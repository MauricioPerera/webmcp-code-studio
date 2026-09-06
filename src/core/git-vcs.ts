import { vfs } from './vfs';
import { eventBus } from './event-bus';

export type GitFileStatus = 'M' | 'A' | 'D';

export interface GitFileChange {
  path: string;
  status: GitFileStatus;
  staged: boolean;
}

export interface GitCommit {
  hash: string;
  parentHash: string | null;
  message: string;
  author: string;
  timestamp: number;
  branch: string;
  snapshot: Record<string, string>;
}

export interface GitStatusResult {
  branch: string;
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  totalChanges: number;
}

const STORAGE_KEY = 'webmcp_studio_git_v1';

export class GitVersionControl {
  private commits: GitCommit[] = [];
  private branches: Set<string> = new Set(['main']);
  private currentBranch: string = 'main';
  private stagedPaths: Set<string> = new Set();
  private authorName: string = 'WebMCP Developer <dev@webmcp.local>';

  constructor() {
    this.loadFromStorage();
    this.listenToVfs();
  }

  private listenToVfs(): void {
    eventBus.on('vfs:change', () => {
      this.cleanStaleStaged();
      eventBus.emit('git:status_changed', this.getStatus());
    });
    eventBus.on('vfs:reloaded', () => {
      this.ensureInitialCommit();
      this.cleanStaleStaged();
      eventBus.emit('git:status_changed', this.getStatus());
    });
  }

  public init(): void {
    this.ensureInitialCommit();
  }

  private generateHash(): string {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 40; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  private getVfsSnapshot(): Record<string, string> {
    const files = vfs.listAllFiles();
    const snapshot: Record<string, string> = {};
    for (const file of files) {
      snapshot[file.path] = file.content;
    }
    return snapshot;
  }

  private ensureInitialCommit(): void {
    if (this.commits.length === 0) {
      const snapshot = this.getVfsSnapshot();
      if (Object.keys(snapshot).length > 0) {
        const initialCommit: GitCommit = {
          hash: this.generateHash(),
          parentHash: null,
          message: 'Initial commit: WebMCP Project Setup',
          author: this.authorName,
          timestamp: Date.now(),
          branch: this.currentBranch,
          snapshot,
        };
        this.commits.push(initialCommit);
        this.saveToStorage();
        eventBus.emit('git:commit', initialCommit);
      }
    }
  }

  private cleanStaleStaged(): void {
    const currentFiles = this.getVfsSnapshot();
    const latestCommit = this.getLatestCommit();
    const headSnapshot = latestCommit?.snapshot || {};

    for (const path of Array.from(this.stagedPaths)) {
      const inVfs = path in currentFiles;
      const inHead = path in headSnapshot;
      if (!inVfs && !inHead) {
        this.stagedPaths.delete(path);
      }
    }
  }

  public getLatestCommit(branch?: string): GitCommit | null {
    const targetBranch = branch || this.currentBranch;
    for (let i = this.commits.length - 1; i >= 0; i--) {
      if (this.commits[i].branch === targetBranch) {
        return this.commits[i];
      }
    }
    return this.commits[this.commits.length - 1] || null;
  }

  public getStatus(): GitStatusResult {
    const currentSnapshot = this.getVfsSnapshot();
    const latestCommit = this.getLatestCommit();
    const headSnapshot = latestCommit?.snapshot || {};

    const changes: Map<string, GitFileStatus> = new Map();

    for (const [path, content] of Object.entries(currentSnapshot)) {
      if (!(path in headSnapshot)) {
        changes.set(path, 'A');
      } else if (headSnapshot[path] !== content) {
        changes.set(path, 'M');
      }
    }

    for (const path of Object.keys(headSnapshot)) {
      if (!(path in currentSnapshot)) {
        changes.set(path, 'D');
      }
    }

    const staged: GitFileChange[] = [];
    const unstaged: GitFileChange[] = [];

    for (const [path, status] of changes.entries()) {
      const isStaged = this.stagedPaths.has(path);
      const item: GitFileChange = { path, status, staged: isStaged };
      if (isStaged) {
        staged.push(item);
      } else {
        unstaged.push(item);
      }
    }

    return {
      branch: this.currentBranch,
      staged,
      unstaged,
      totalChanges: staged.length + unstaged.length,
    };
  }

  public stageFile(path: string): void {
    this.stagedPaths.add(path);
    eventBus.emit('git:status_changed', this.getStatus());
  }

  public unstageFile(path: string): void {
    this.stagedPaths.delete(path);
    eventBus.emit('git:status_changed', this.getStatus());
  }

  public stageAll(): void {
    const status = this.getStatus();
    for (const change of status.unstaged) {
      this.stagedPaths.add(change.path);
    }
    eventBus.emit('git:status_changed', this.getStatus());
  }

  public unstageAll(): void {
    this.stagedPaths.clear();
    eventBus.emit('git:status_changed', this.getStatus());
  }

  public commit(message: string, author?: string): GitCommit {
    const trimmedMsg = message.trim();
    if (!trimmedMsg) {
      throw new Error('El mensaje del commit no puede estar vacio.');
    }

    const status = this.getStatus();
    if (status.totalChanges === 0) {
      throw new Error('No hay cambios para hacer commit en el espacio de trabajo.');
    }

    if (status.staged.length === 0) {
      this.stageAll();
    }

    const latestCommit = this.getLatestCommit();
    const newSnapshot = { ...(latestCommit?.snapshot || {}) };

    for (const change of this.getStatus().staged) {
      if (change.status === 'D') {
        delete newSnapshot[change.path];
      } else {
        const content = vfs.readFile(change.path);
        if (content !== null) {
          newSnapshot[change.path] = content;
        }
      }
    }

    const newCommit: GitCommit = {
      hash: this.generateHash(),
      parentHash: latestCommit?.hash || null,
      message: trimmedMsg,
      author: author || this.authorName,
      timestamp: Date.now(),
      branch: this.currentBranch,
      snapshot: newSnapshot,
    };

    this.commits.push(newCommit);
    this.stagedPaths.clear();
    this.saveToStorage();

    eventBus.emit('git:commit', newCommit);
    eventBus.emit('git:status_changed', this.getStatus());
    return newCommit;
  }

  public getLog(limit: number = 20): GitCommit[] {
    const branchCommits = this.commits.filter((c) => c.branch === this.currentBranch);
    return [...branchCommits].reverse().slice(0, limit);
  }

  public getBranches(): string[] {
    return Array.from(this.branches);
  }

  public getCurrentBranch(): string {
    return this.currentBranch;
  }

  public createBranch(name: string): boolean {
    const cleanName = name.trim();
    if (!cleanName || cleanName.includes(' ') || cleanName.includes('..')) {
      throw new Error('Nombre de rama invalido: ' + name);
    }
    if (this.branches.has(cleanName)) {
      throw new Error('La rama ya existe: ' + cleanName);
    }
    this.branches.add(cleanName);
    this.saveToStorage();
    eventBus.emit('git:branch_created', cleanName);
    return true;
  }

  public checkoutBranch(name: string): boolean {
    const cleanName = name.trim();
    if (!this.branches.has(cleanName)) {
      throw new Error('La rama no existe: ' + cleanName);
    }
    if (cleanName === this.currentBranch) {
      return true;
    }

    const targetCommit = this.getLatestCommit(cleanName);
    if (targetCommit) {
      vfs.loadProjectTemplate(targetCommit.snapshot);
    }

    this.currentBranch = cleanName;
    this.stagedPaths.clear();
    this.saveToStorage();

    eventBus.emit('git:branch_changed', cleanName);
    eventBus.emit('git:status_changed', this.getStatus());
    return true;
  }

  public discardFileChanges(path: string): boolean {
    const latestCommit = this.getLatestCommit();
    const headSnapshot = latestCommit?.snapshot || {};

    if (path in headSnapshot) {
      vfs.createFile(path, headSnapshot[path], true);
    } else {
      vfs.deleteNode(path);
    }

    this.stagedPaths.delete(path);
    eventBus.emit('git:status_changed', this.getStatus());
    return true;
  }

  public setAuthor(author: string): void {
    if (author && author.trim()) {
      this.authorName = author.trim();
      this.saveToStorage();
    }
  }

  public getAuthor(): string {
    return this.authorName;
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = {
        commits: this.commits,
        branches: Array.from(this.branches),
        currentBranch: this.currentBranch,
        authorName: this.authorName,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('[Git VCS] No se pudo persistir el historial Git:', err);
    }
  }

  private loadFromStorage(): boolean {
    if (typeof localStorage === 'undefined') return false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.commits)) {
        this.commits = data.commits;
        this.branches = new Set(data.branches || ['main']);
        this.currentBranch = data.currentBranch || 'main';
        this.authorName = data.authorName || this.authorName;
        return true;
      }
    } catch (err) {
      console.warn('[Git VCS] Error al leer historial Git de localStorage:', err);
    }
    return false;
  }
}

export const gitVcs = new GitVersionControl();
