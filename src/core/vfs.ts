import JSZip from 'jszip';
import { eventBus } from './event-bus';
import { VFSFile, VFSDirectory, VFSNode } from './types';

const STORAGE_KEY = 'webmcp_studio_vfs_v1';

export class VirtualFileSystem {
  private nodes: Map<string, VFSNode> = new Map();

  constructor() {
    this.ensureRoot();
  }

  private ensureRoot(): void {
    if (!this.nodes.has('/')) {
      this.nodes.set('/', {
        type: 'directory',
        path: '/',
        name: '',
        children: [],
        updatedAt: Date.now(),
      });
    }
  }

  public validatePath(rawPath: string): string {
    if (!rawPath || typeof rawPath !== 'string') {
      throw new Error('La ruta no puede estar vacía.');
    }
    const trimmed = rawPath.trim();
    if (!trimmed) {
      throw new Error('El nombre o ruta de archivo no puede contener solo espacios en blanco.');
    }

    // Prohibit dangerous filesystem characters
    const forbiddenChars = /[<>:"|?*\x00-\x1F]/;
    if (forbiddenChars.test(trimmed)) {
      throw new Error('La ruta contiene caracteres no permitidos (< > : " | ? *).');
    }

    // Split and resolve path segments (defends against Path Traversal)
    const normalizedSeparators = trimmed.replace(/\\/g, '/');
    const segments = normalizedSeparators.split('/');
    const resolved: string[] = [];

    for (const seg of segments) {
      const s = seg.trim();
      if (!s || s === '.') continue;
      if (s === '..') {
        if (resolved.length === 0) {
          throw new Error('Intento de Path Traversal fuera de la raíz virtual no permitido.');
        }
        resolved.pop();
      } else {
        resolved.push(s);
      }
    }

    if (resolved.length === 0) {
      return '/';
    }
    return '/' + resolved.join('/');
  }

  public normalizePath(rawPath: string): string {
    try {
      return this.validatePath(rawPath);
    } catch {
      let p = rawPath.replace(/\\/g, '/').trim();
      if (!p.startsWith('/')) p = '/' + p;
      if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
      return p.replace(/\/+/g, '/');
    }
  }

  public getParentPath(path: string): string {
    const norm = this.normalizePath(path);
    if (norm === '/') return '/';
    const lastSlash = norm.lastIndexOf('/');
    if (lastSlash <= 0) return '/';
    return norm.slice(0, lastSlash);
  }

  public getNodeName(path: string): string {
    const norm = this.normalizePath(path);
    if (norm === '/') return '';
    return norm.slice(norm.lastIndexOf('/') + 1);
  }

  public exists(rawPath: string): boolean {
    try {
      const path = this.validatePath(rawPath);
      return this.nodes.has(path);
    } catch {
      return false;
    }
  }

  public getNode(rawPath: string): VFSNode | null {
    try {
      const path = this.validatePath(rawPath);
      return this.nodes.get(path) || null;
    } catch {
      return null;
    }
  }

  public createDirectory(rawPath: string): VFSDirectory {
    const path = this.validatePath(rawPath);
    if (path === '/') return this.nodes.get('/') as VFSDirectory;

    const existing = this.nodes.get(path);
    if (existing) {
      if (existing.type === 'directory') return existing;
      throw new Error(`La ruta "${path}" ya existe como archivo.`);
    }

    // Ensure parents exist recursively
    const parentPath = this.getParentPath(path);
    const parent = this.createDirectory(parentPath);

    const dir: VFSDirectory = {
      type: 'directory',
      path,
      name: this.getNodeName(path),
      children: [],
      updatedAt: Date.now(),
    };

    this.nodes.set(path, dir);
    if (!parent.children.includes(path)) {
      parent.children.push(path);
      parent.updatedAt = Date.now();
    }

    this.saveToStorage();
    eventBus.emit('vfs:change', { type: 'create_dir', path });
    return dir;
  }

  public createFile(rawPath: string, content: string = '', overwrite: boolean = false): VFSFile {
    const path = this.validatePath(rawPath);
    if (path === '/') {
      throw new Error('No se puede crear un archivo en la raíz "/". Especifique un nombre de archivo.');
    }

    const existing = this.nodes.get(path);
    if (existing) {
      if (existing.type === 'directory') {
        throw new Error(`La ruta "${path}" ya existe como un directorio.`);
      }
      if (!overwrite) {
        throw new Error(`El archivo "${path}" ya existe. Especifique otro nombre o use sobrescritura.`);
      }
      existing.content = content;
      existing.updatedAt = Date.now();
      this.saveToStorage();
      eventBus.emit('vfs:change', { type: 'update_file', path });
      return existing;
    }

    const parentPath = this.getParentPath(path);
    const parent = this.createDirectory(parentPath);

    const file: VFSFile = {
      type: 'file',
      path,
      name: this.getNodeName(path),
      content,
      updatedAt: Date.now(),
    };

    this.nodes.set(path, file);
    if (!parent.children.includes(path)) {
      parent.children.push(path);
      parent.updatedAt = Date.now();
    }

    this.saveToStorage();
    eventBus.emit('vfs:change', { type: 'create_file', path });
    return file;
  }

  public readFile(rawPath: string): string | null {
    try {
      const path = this.validatePath(rawPath);
      const node = this.nodes.get(path);
      if (!node || node.type !== 'file') return null;
      return node.content;
    } catch {
      return null;
    }
  }

  public writeFile(rawPath: string, content: string): boolean {
    try {
      const path = this.validatePath(rawPath);
      const node = this.nodes.get(path);
      if (!node) {
        this.createFile(path, content, true);
        return true;
      }
      if (node.type !== 'file') return false;

      node.content = content;
      node.updatedAt = Date.now();
      this.saveToStorage();
      eventBus.emit('vfs:change', { type: 'update_file', path });
      return true;
    } catch {
      return false;
    }
  }

  public deleteNode(rawPath: string): boolean {
    const path = this.normalizePath(rawPath);
    if (path === '/') {
      throw new Error('No se permite eliminar el directorio raíz "/".');
    }

    const node = this.nodes.get(path);
    if (!node) return false;

    if (node.type === 'directory') {
      // Recursively delete all children
      const childrenCopy = [...node.children];
      for (const child of childrenCopy) {
        this.deleteNode(child);
      }
    }

    this.nodes.delete(path);

    // Remove from parent's children list
    const parentPath = this.getParentPath(path);
    const parent = this.nodes.get(parentPath);
    if (parent && parent.type === 'directory') {
      parent.children = parent.children.filter((c) => c !== path);
      parent.updatedAt = Date.now();
    }

    this.saveToStorage();
    eventBus.emit('vfs:change', { type: 'delete', path });
    return true;
  }

  public renameNode(oldRawPath: string, newRawPath: string): boolean {
    const oldPath = this.validatePath(oldRawPath);
    const newPath = this.validatePath(newRawPath);

    if (oldPath === '/' || newPath === '/' || oldPath === newPath) return false;
    const node = this.nodes.get(oldPath);
    if (!node || this.nodes.has(newPath)) return false;

    if (node.type === 'file') {
      const content = node.content;
      this.deleteNode(oldPath);
      this.createFile(newPath, content, true);
      eventBus.emit('vfs:rename', { oldPath, newPath });
      return true;
    } else {
      // Directory rename
      const prefix = oldPath + '/';
      const descendantFiles: Array<{ path: string; content: string }> = [];
      const descendantDirs: string[] = [];

      for (const [p, n] of this.nodes.entries()) {
        if (p.startsWith(prefix)) {
          if (n.type === 'file') {
            descendantFiles.push({ path: p, content: n.content });
          } else {
            descendantDirs.push(p);
          }
        }
      }

      this.deleteNode(oldPath);
      this.createDirectory(newPath);

      for (const d of descendantDirs) {
        const subPath = newPath + d.slice(oldPath.length);
        this.createDirectory(subPath);
      }
      for (const f of descendantFiles) {
        const subPath = newPath + f.path.slice(oldPath.length);
        this.createFile(subPath, f.content, true);
      }

      this.saveToStorage();
      eventBus.emit('vfs:rename', { oldPath, newPath });
      return true;
    }
  }

  public listDirectory(rawPath: string = '/'): VFSNode[] {
    const path = this.normalizePath(rawPath);
    const node = this.nodes.get(path);
    if (!node || node.type !== 'directory') return [];

    const result: VFSNode[] = [];
    for (const childPath of node.children) {
      const child = this.nodes.get(childPath);
      if (child) result.push(child);
    }
    result.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return result;
  }

  public listAllFiles(): VFSFile[] {
    const files: VFSFile[] = [];
    for (const node of this.nodes.values()) {
      if (node.type === 'file') {
        files.push(node);
      }
    }
    files.sort((a, b) => a.path.localeCompare(b.path));
    return files;
  }

  public searchFiles(
    query: string,
    isRegex: boolean = false
  ): Array<{ file: string; line: number; text: string }> {
    const results: Array<{ file: string; line: number; text: string }> = [];
    if (!query.trim()) return results;

    let regex: RegExp;
    try {
      regex = isRegex ? new RegExp(query, 'gi') : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    } catch {
      return results;
    }

    for (const file of this.listAllFiles()) {
      const lines = file.content.split('\n');
      lines.forEach((lineText, idx) => {
        if (regex.test(lineText)) {
          results.push({
            file: file.path,
            line: idx + 1,
            text: lineText.trim(),
          });
        }
      });
    }
    return results;
  }

  public loadProjectTemplate(files: Record<string, string>): void {
    this.nodes.clear();
    this.ensureRoot();
    for (const [filePath, content] of Object.entries(files)) {
      this.createFile(filePath, content, true);
    }
    this.saveToStorage();
    eventBus.emit('vfs:reloaded');
  }

  public saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const serializable: VFSNode[] = [];
      for (const node of this.nodes.values()) {
        serializable.push(node);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch (err) {
      console.warn('[VFS] Error saving to localStorage:', err);
    }
  }

  public loadFromStorage(): boolean {
    if (typeof localStorage === 'undefined') return false;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return false;
      const parsed = JSON.parse(data) as VFSNode[];
      if (!Array.isArray(parsed) || parsed.length === 0) return false;

      this.nodes.clear();
      this.ensureRoot();
      // First pass: create directories
      for (const node of parsed) {
        if (node.type === 'directory') {
          this.createDirectory(node.path);
        }
      }
      // Second pass: create files
      for (const node of parsed) {
        if (node.type === 'file') {
          this.createFile(node.path, node.content, true);
        }
      }
      eventBus.emit('vfs:reloaded');
      return true;
    } catch (err) {
      console.warn('[VFS] Error loading from localStorage:', err);
      return false;
    }
  }

  public async exportToZip(): Promise<Blob> {
    const zip = new JSZip();
    for (const file of this.listAllFiles()) {
      const zipPath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
      zip.file(zipPath, file.content);
    }
    return await zip.generateAsync({ type: 'blob' });
  }

  public async importFromZip(data: Blob | ArrayBuffer): Promise<number> {
    const zip = await JSZip.loadAsync(data);
    let count = 0;
    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir) {
        const text = await zipEntry.async('string');
        this.createFile('/' + relativePath, text, true);
        count++;
      }
    }
    this.saveToStorage();
    eventBus.emit('vfs:reloaded');
    return count;
  }
}

export const vfs = new VirtualFileSystem();
