import { eventBus } from '../core/event-bus';
import { vfs } from '../core/vfs';
import { webMcpService } from '../core/webmcp-service';
import { gitVcs } from '../core/git-vcs';
import { gitView } from './git-view';

export class StatusBarView {
  private cursorEl: HTMLElement | null = null;
  private langEl: HTMLElement | null = null;
  private vfsEl: HTMLElement | null = null;
  private webmcpBadge: HTMLElement | null = null;
  private branchEl: HTMLElement | null = null;

  constructor() {
    this.setupListeners();
  }

  public init(): void {
    this.cursorEl = document.getElementById('status-cursor');
    this.langEl = document.getElementById('status-language');
    this.vfsEl = document.getElementById('status-vfs');
    this.webmcpBadge = document.getElementById('status-webmcp-badge');
    this.branchEl = document.getElementById('status-branch');

    this.updateVfsStatus();
    this.updateWebmcpStatus();
    this.updateGitStatus();

    this.webmcpBadge?.addEventListener('click', () => {
      // Switch activity bar to WebMCP
      const btn = document.getElementById('act-webmcp');
      btn?.click();
    });

    this.branchEl?.addEventListener('click', () => {
      gitView.promptSwitchBranch();
    });
  }

  private setupListeners(): void {
    eventBus.on<{ lineNumber: number; column: number }>('editor:cursor_changed', ({ lineNumber, column }) => {
      if (this.cursorEl) {
        this.cursorEl.textContent = `Ln ${lineNumber}, Col ${column}`;
      }
    });

    eventBus.on<string>('editor:file_opened', (path) => {
      if (this.langEl) {
        const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
        this.langEl.textContent = this.getLanguageLabel(ext);
      }
      this.updateVfsStatus();
    });

    eventBus.on('vfs:change', () => this.updateVfsStatus());
    eventBus.on('webmcp:tools_updated', () => this.updateWebmcpStatus());
    eventBus.on('git:branch_changed', () => this.updateGitStatus());
    eventBus.on('git:commit', () => this.updateGitStatus());
  }

  private updateGitStatus(): void {
    if (!this.branchEl) return;
    const branch = gitVcs.getCurrentBranch();
    const branchLabel = document.getElementById('status-branch-name');
    if (branchLabel) {
      branchLabel.textContent = branch;
    } else {
      this.branchEl.textContent = branch;
    }
  }

  private updateVfsStatus(): void {
    if (!this.vfsEl) return;
    const files = vfs.listAllFiles();
    let totalBytes = 0;
    for (const f of files) totalBytes += f.content.length;

    const sizeStr = totalBytes > 1024 ? `${(totalBytes / 1024).toFixed(1)} KB` : `${totalBytes} B`;
    this.vfsEl.textContent = `VFS: ${files.length} archivos (${sizeStr})`;
  }

  private updateWebmcpStatus(): void {
    const label = document.getElementById('status-webmcp-label');
    const tools = webMcpService.getRegisteredTools();
    if (label) {
      label.textContent = `WebMCP (${tools.length} tools)`;
    }
  }

  private getLanguageLabel(ext: string): string {
    switch (ext) {
      case '.js':
        return 'JavaScript';
      case '.ts':
        return 'TypeScript';
      case '.html':
        return 'HTML';
      case '.css':
        return 'CSS';
      case '.json':
        return 'JSON';
      case '.md':
        return 'Markdown';
      case '.py':
        return 'Python';
      case '.yaml':
      case '.yml':
        return 'YAML';
      default:
        return 'Plain Text';
    }
  }
}

export const statusBarView = new StatusBarView();
