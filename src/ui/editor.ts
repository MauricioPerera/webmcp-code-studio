import loader from '@monaco-editor/loader';
import { vfs } from '../core/vfs';
import { gitVcs } from '../core/git-vcs';
import { eventBus } from '../core/event-bus';
import { OpenTab } from '../core/types';

export class EditorManager {
  private monaco: any = null;
  private editor: any = null;
  private diffEditor: any = null;
  private container: HTMLElement | null = null;
  private diffContainer: HTMLElement | null = null;
  private welcomeEl: HTMLElement | null = null;
  private tabsContainer: HTMLElement | null = null;
  private breadcrumbEl: HTMLElement | null = null;

  private openTabs: Map<string, OpenTab> = new Map();
  private activeTabPath: string | null = null;
  private models: Map<string, any> = new Map();
  private diffModels: Map<string, { original: any; modified: any }> = new Map();
  private currentTheme: 'vs-dark' | 'vs' = 'vs-dark';

  constructor() {
    this.setupListeners();
  }

  public async init(containerId: string): Promise<void> {
    this.container = document.getElementById(containerId);
    this.diffContainer = document.getElementById('monaco-diff-mount');
    this.welcomeEl = document.getElementById('editor-welcome');
    this.tabsContainer = document.getElementById('tabs-container');
    this.breadcrumbEl = document.getElementById('active-file-breadcrumb');

    if (!this.container) return;

    try {
      this.monaco = await loader.init();

      // Create standard editor inside mount container
      this.editor = this.monaco.editor.create(this.container, {
        value: '',
        language: 'plaintext',
        theme: this.currentTheme,
        automaticLayout: true,
        fontSize: 14,
        fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
        tabSize: 2,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        renderWhitespace: 'selection',
        lineNumbers: 'on',
      });

      // Create diff editor inside diff mount container
      if (this.diffContainer) {
        this.diffEditor = this.monaco.editor.createDiffEditor(this.diffContainer, {
          theme: this.currentTheme,
          automaticLayout: true,
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
          tabSize: 2,
          renderSideBySide: true,
          readOnly: false,
          originalEditable: false,
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
        });

        this.diffEditor.addCommand(
          this.monaco.KeyMod.CtrlCmd | this.monaco.KeyCode.KeyS,
          () => {
            this.saveActiveFile();
          }
        );
      }

      // Save shortcut (Ctrl+S or Cmd+S)
      this.editor.addCommand(
        this.monaco.KeyMod.CtrlCmd | this.monaco.KeyCode.KeyS,
        () => {
          this.saveActiveFile();
        }
      );

      // Cursor position change listener
      this.editor.onDidChangeCursorPosition((e: any) => {
        eventBus.emit('editor:cursor_changed', {
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        });
      });

      // Show/hide welcome depending on whether files are open
      this.updateWelcomeVisibility();
    } catch (err) {
      console.error('[EditorManager] Error loading Monaco Editor:', err);
    }
  }

  private setupListeners(): void {
    // When file renamed in VFS
    eventBus.on<{ oldPath: string; newPath: string }>('vfs:rename', ({ oldPath, newPath }) => {
      if (this.openTabs.has(oldPath)) {
        const tab = this.openTabs.get(oldPath)!;
        this.openTabs.delete(oldPath);
        this.openTabs.set(newPath, { ...tab, path: newPath });

        if (this.activeTabPath === oldPath) {
          this.activeTabPath = newPath;
        }
        this.renderTabs();
      }
    });

    // When file deleted in VFS
    eventBus.on<{ type: string; path: string }>('vfs:change', (data) => {
      if (data.type === 'delete') {
        if (this.openTabs.has(data.path)) {
          this.closeTab(data.path);
        } else {
          // If directory was deleted, close all child tabs
          for (const tabPath of Array.from(this.openTabs.keys())) {
            if (tabPath.startsWith(data.path + '/')) {
              this.closeTab(tabPath);
            }
          }
        }
      }
      if (data.type === 'update_file' && this.models.has(data.path)) {
        const fileContent = vfs.readFile(data.path);
        const model = this.models.get(data.path);
        if (model && fileContent !== null && model.getValue() !== fileContent) {
          model.setValue(fileContent);
        }
      }
    });

    // When project template is reloaded
    eventBus.on('vfs:reloaded', () => {
      this.closeAllTabs();
      const files = vfs.listAllFiles();
      const indexFile = files.find((f) => f.path === '/index.html' || f.path === '/src/main.js') || files[0];
      if (indexFile) {
        this.openFile(indexFile.path);
      }
    });
  }

  public openFile(path: string): void {
    if (path.startsWith('diff:')) {
      this.openDiff(path.replace(/^diff:/, ''));
      return;
    }

    const file = vfs.readFile(path);
    if (file === null) return;

    if (!this.openTabs.has(path)) {
      this.openTabs.set(path, {
        path,
        isDirty: false,
        isDiff: false,
      });
    }

    this.activeTabPath = path;

    // Show standard editor container, hide diff container
    if (this.diffContainer) this.diffContainer.style.display = 'none';
    if (this.container) this.container.style.display = 'block';

    // Get or create model
    let model = this.models.get(path);
    if (!model && this.monaco) {
      const lang = this.detectLanguage(path);
      model = this.monaco.editor.createModel(file, lang);

      model.onDidChangeContent(() => {
        const tab = this.openTabs.get(path);
        if (tab) {
          const currentDiskContent = vfs.readFile(path);
          const isDirty = model.getValue() !== currentDiskContent;
          if (tab.isDirty !== isDirty) {
            tab.isDirty = isDirty;
            this.renderTabs();
          }
        }
        const diffTab = this.openTabs.get(`diff:${path}`);
        if (diffTab) {
          diffTab.isDirty = model.getValue() !== vfs.readFile(path);
          this.renderTabs();
        }
      });

      this.models.set(path, model);
    }

    if (this.editor && model) {
      this.editor.setModel(model);
      this.editor.layout();
    }

    this.renderTabs();
    this.updateBreadcrumb(path);
    this.updateWelcomeVisibility();

    eventBus.emit('editor:file_opened', path);
  }

  public openDiff(path: string): void {
    const diffTabKey = `diff:${path}`;
    const headContent = gitVcs.getHeadContent(path) ?? '';
    const currentContent = vfs.readFile(path) ?? '';

    if (!this.openTabs.has(diffTabKey)) {
      this.openTabs.set(diffTabKey, {
        path: diffTabKey,
        isDirty: false,
        isDiff: true,
        originalPath: path,
      });
    }

    this.activeTabPath = diffTabKey;

    // Show diff container, hide standard editor container
    if (this.container) this.container.style.display = 'none';
    if (this.diffContainer) this.diffContainer.style.display = 'block';

    if (this.monaco && this.diffEditor) {
      const lang = this.detectLanguage(path);
      let diffPair = this.diffModels.get(diffTabKey);
      if (!diffPair) {
        const originalModel = this.monaco.editor.createModel(headContent, lang);

        let modifiedModel = this.models.get(path);
        if (!modifiedModel) {
          modifiedModel = this.monaco.editor.createModel(currentContent, lang);
          this.models.set(path, modifiedModel);
        }

        modifiedModel.onDidChangeContent(() => {
          const tab = this.openTabs.get(diffTabKey);
          if (tab) {
            const diskContent = vfs.readFile(path);
            const isDirty = modifiedModel.getValue() !== diskContent;
            if (tab.isDirty !== isDirty) {
              tab.isDirty = isDirty;
              this.renderTabs();
            }
          }
          const normalTab = this.openTabs.get(path);
          if (normalTab) {
            normalTab.isDirty = modifiedModel.getValue() !== vfs.readFile(path);
            this.renderTabs();
          }
        });

        diffPair = { original: originalModel, modified: modifiedModel };
        this.diffModels.set(diffTabKey, diffPair);
      } else {
        if (diffPair.original.getValue() !== headContent) {
          diffPair.original.setValue(headContent);
        }
        if (diffPair.modified.getValue() !== currentContent) {
          diffPair.modified.setValue(currentContent);
        }
      }

      this.diffEditor.setModel({
        original: diffPair.original,
        modified: diffPair.modified,
      });
      this.diffEditor.layout();
    }

    this.renderTabs();
    this.updateBreadcrumb(diffTabKey);
    this.updateWelcomeVisibility();

    eventBus.emit('editor:diff_opened', { path });
  }

  public closeTab(path: string): void {
    const tab = this.openTabs.get(path);
    if (!tab) return;

    if (path.startsWith('diff:')) {
      const diffPair = this.diffModels.get(path);
      if (diffPair) {
        diffPair.original.dispose();
        this.diffModels.delete(path);
      }
    } else {
      const model = this.models.get(path);
      if (model) {
        model.dispose();
        this.models.delete(path);
      }
    }

    this.openTabs.delete(path);

    // If active tab was closed, switch to another tab or null
    if (this.activeTabPath === path) {
      const remaining = Array.from(this.openTabs.values());
      if (remaining.length > 0) {
        const nextTab = remaining[remaining.length - 1];
        if (nextTab.isDiff) {
          this.openDiff(nextTab.originalPath || nextTab.path.replace(/^diff:/, ''));
        } else {
          this.openFile(nextTab.path);
        }
      } else {
        this.activeTabPath = null;
        if (this.diffContainer) this.diffContainer.style.display = 'none';
        if (this.container) this.container.style.display = 'block';
        if (this.editor) {
          this.editor.setModel(null);
        }
        this.updateBreadcrumb('');
      }
    }

    this.renderTabs();
    this.updateWelcomeVisibility();
  }

  public closeAllTabs(): void {
    for (const model of this.models.values()) {
      model.dispose();
    }
    for (const pair of this.diffModels.values()) {
      pair.original.dispose();
    }
    this.models.clear();
    this.diffModels.clear();
    this.openTabs.clear();
    this.activeTabPath = null;

    if (this.diffContainer) this.diffContainer.style.display = 'none';
    if (this.container) this.container.style.display = 'block';

    if (this.editor) {
      this.editor.setModel(null);
    }
    this.renderTabs();
    this.updateBreadcrumb('');
    this.updateWelcomeVisibility();
  }

  public saveActiveFile(): void {
    if (!this.activeTabPath) return;

    let targetPath = this.activeTabPath;
    if (this.activeTabPath.startsWith('diff:')) {
      targetPath = this.activeTabPath.replace(/^diff:/, '');
    }

    if (!this.models.has(targetPath)) return;
    const model = this.models.get(targetPath)!;
    const content = model.getValue();

    vfs.writeFile(targetPath, content);
    vfs.saveToStorage();

    const tab = this.openTabs.get(this.activeTabPath);
    if (tab) {
      tab.isDirty = false;
    }
    const normalTab = this.openTabs.get(targetPath);
    if (normalTab) {
      normalTab.isDirty = false;
    }

    this.renderTabs();
    eventBus.emit('editor:file_saved', { path: targetPath });
  }

  public toggleTheme(): 'vs-dark' | 'vs' {
    this.currentTheme = this.currentTheme === 'vs-dark' ? 'vs' : 'vs-dark';
    if (this.monaco) {
      this.monaco.editor.setTheme(this.currentTheme);
    }
    document.documentElement.setAttribute('data-theme', this.currentTheme === 'vs' ? 'light' : 'dark');
    return this.currentTheme;
  }

  public getActiveFilePath(): string | null {
    return this.activeTabPath;
  }

  public getActiveFileContent(): string | null {
    if (!this.activeTabPath) return null;
    const targetPath = this.activeTabPath.startsWith('diff:')
      ? this.activeTabPath.replace(/^diff:/, '')
      : this.activeTabPath;
    if (!this.models.has(targetPath)) return null;
    return this.models.get(targetPath)!.getValue();
  }

  public hasUnsavedChanges(): boolean {
    for (const tab of this.openTabs.values()) {
      if (tab.isDirty) return true;
    }
    return false;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private renderTabs(): void {
    if (!this.tabsContainer) return;
    this.tabsContainer.innerHTML = '';

    for (const [path, tab] of this.openTabs.entries()) {
      const isDiff = tab.isDiff || path.startsWith('diff:');
      const targetPath = tab.originalPath || path.replace(/^diff:/, '');
      const fileName = vfs.getNodeName(targetPath) || targetPath;
      const isActive = path === this.activeTabPath;

      const tabEl = document.createElement('div');
      tabEl.className = 'vscode-tab ' + (isDiff ? 'tab-diff ' : '') + (isActive ? 'active ' : '') + (tab.isDirty ? 'dirty' : '');
      tabEl.title = isDiff ? ('Comparativa Git: ' + targetPath + ' frente a HEAD') : path;

      const titleEl = document.createElement('span');
      titleEl.className = 'tab-title';
      if (isDiff) {
        titleEl.innerHTML = '<span class="tab-diff-tag">DIFF</span> ' + this.escapeHtml(fileName);
      } else {
        titleEl.textContent = fileName;
      }

      const closeBtn = document.createElement('button');
      closeBtn.className = 'tab-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.title = 'Cerrar pestaña';
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        this.closeTab(path);
      };

      tabEl.appendChild(titleEl);
      tabEl.appendChild(closeBtn);

      tabEl.onclick = () => {
        if (isDiff) {
          this.openDiff(targetPath);
        } else {
          this.openFile(path);
        }
      };

      this.tabsContainer.appendChild(tabEl);
    }
  }

  private updateBreadcrumb(path: string): void {
    if (!this.breadcrumbEl) return;
    if (!path) {
      this.breadcrumbEl.textContent = 'Ningún archivo abierto';
      return;
    }

    if (path.startsWith('diff:')) {
      const targetPath = path.replace(/^diff:/, '');
      this.breadcrumbEl.innerHTML = '<span class="crumb">Control de Código Fuente</span> &gt; <span class="crumb diff-crumb">' + this.escapeHtml(targetPath) + ' <em>(Working Tree ↔ HEAD)</em></span>';
      return;
    }

    const parts = path.split('/').filter(Boolean);
    this.breadcrumbEl.innerHTML = parts
      .map((part, idx) => '<span class="crumb">' + part + (idx < parts.length - 1 ? ' &gt; ' : '') + '</span>')
      .join('');
  }

  private updateWelcomeVisibility(): void {
    if (!this.welcomeEl) return;
    if (this.openTabs.size === 0) {
      this.welcomeEl.style.display = 'flex';
    } else {
      this.welcomeEl.style.display = 'none';
    }
  }

  private detectLanguage(path: string): string {
    const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
    switch (ext) {
      case '.js':
      case '.mjs':
      case '.cjs':
        return 'javascript';
      case '.ts':
        return 'typescript';
      case '.html':
      case '.htm':
        return 'html';
      case '.css':
        return 'css';
      case '.json':
        return 'json';
      case '.md':
      case '.markdown':
        return 'markdown';
      case '.py':
        return 'python';
      case '.yaml':
      case '.yml':
        return 'yaml';
      case '.sh':
      case '.bash':
        return 'shell';
      case '.sql':
        return 'sql';
      default:
        return 'plaintext';
    }
  }
}

export const editorManager = new EditorManager();
