import { vfs } from '../core/vfs';
import { eventBus } from '../core/event-bus';
import { editorManager } from './editor';
import { starterTemplates } from '../templates/starter-projects';
import { VFSNode } from '../core/types';

export class ExplorerView {
  private treeContainer: HTMLElement | null = null;
  private templateSelect: HTMLSelectElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private searchResults: HTMLElement | null = null;
  private collapsedDirs: Set<string> = new Set();

  constructor() {
    this.setupListeners();
  }

  public init(): void {
    this.treeContainer = document.getElementById('file-tree');
    this.templateSelect = document.getElementById('template-select') as HTMLSelectElement;
    this.searchInput = document.getElementById('search-input') as HTMLInputElement;
    this.searchResults = document.getElementById('search-results');

    this.bindHeaderActions();
    this.bindTemplateSelector();
    this.bindSearchInput();
    this.render();
  }

  private setupListeners(): void {
    eventBus.on('vfs:change', () => this.render());
    eventBus.on('vfs:rename', () => this.render());
    eventBus.on('vfs:reloaded', () => this.render());
  }

  private bindHeaderActions(): void {
    document.getElementById('btn-new-file')?.addEventListener('click', () => {
      this.promptCreateFile();
    });

    document.getElementById('btn-new-folder')?.addEventListener('click', () => {
      this.promptCreateFolder();
    });

    document.getElementById('btn-refresh-files')?.addEventListener('click', () => {
      this.render();
    });

    document.getElementById('btn-export-zip')?.addEventListener('click', async () => {
      const blob = await vfs.exportToZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'webmcp-project.zip';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  private bindTemplateSelector(): void {
    if (!this.templateSelect) return;

    this.templateSelect.addEventListener('change', () => {
      const templateId = this.templateSelect?.value;
      if (templateId && starterTemplates[templateId]) {
        if (confirm(`¿Cargar la plantilla "${starterTemplates[templateId].name}"? Se reiniciará el espacio de trabajo.`)) {
          vfs.loadProjectTemplate(starterTemplates[templateId].files);
        }
      }
    });
  }

  private bindSearchInput(): void {
    if (!this.searchInput || !this.searchResults) return;

    this.searchInput.addEventListener('input', () => {
      const query = this.searchInput?.value.trim() || '';
      if (!query) {
        this.searchResults!.innerHTML = '<div class="empty-state">Escribe un término para buscar en todos los archivos.</div>';
        return;
      }

      const matches = vfs.searchFiles(query);
      if (matches.length === 0) {
        this.searchResults!.innerHTML = `<div class="empty-state">No se encontraron coincidencias para "${query}".</div>`;
        return;
      }

      this.searchResults!.innerHTML = matches
        .map(
          (m) => `
        <div class="search-match-item" data-path="${m.file}">
          <div class="match-file"><strong>${m.file}</strong> <span class="match-line">línea ${m.line}</span></div>
          <div class="match-text">${this.escapeHtml(m.text)}</div>
        </div>`
        )
        .join('');

      // Add click handlers to jump to file
      this.searchResults?.querySelectorAll('.search-match-item').forEach((el) => {
        el.addEventListener('click', () => {
          const path = el.getAttribute('data-path');
          if (path) {
            editorManager.openFile(path);
          }
        });
      });
    });
  }

  public promptCreateFile(parentDir: string = '/'): void {
    const filename = prompt('Nombre del nuevo archivo (ej: index.js, /src/utils.ts):');
    if (!filename || !filename.trim()) return;

    let targetPath = filename.trim();
    if (!targetPath.startsWith('/')) {
      targetPath = parentDir === '/' ? '/' + targetPath : parentDir + '/' + targetPath;
    }

    try {
      vfs.createFile(targetPath, '');
      vfs.saveToStorage();
      editorManager.openFile(targetPath);
    } catch (err: any) {
      alert(err.message);
    }
  }

  public promptCreateFolder(parentDir: string = '/'): void {
    const dirname = prompt('Nombre de la nueva carpeta:');
    if (!dirname || !dirname.trim()) return;

    let targetPath = dirname.trim();
    if (!targetPath.startsWith('/')) {
      targetPath = parentDir === '/' ? '/' + targetPath : parentDir + '/' + targetPath;
    }

    try {
      vfs.createDirectory(targetPath);
      vfs.saveToStorage();
    } catch (err: any) {
      alert(err.message);
    }
  }

  public render(): void {
    if (!this.treeContainer) return;
    this.treeContainer.innerHTML = '';

    const rootNodes = vfs.listDirectory('/');
    if (rootNodes.length === 0) {
      this.treeContainer.innerHTML = '<div class="empty-state">No hay archivos en el proyecto. Crea uno arriba.</div>';
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'tree-root';
    this.renderNodeList(rootNodes, ul, 0);
    this.treeContainer.appendChild(ul);
  }

  private renderNodeList(nodes: VFSNode[], container: HTMLElement, depth: number): void {
    for (const node of nodes) {
      const li = document.createElement('li');
      li.className = `tree-item ${node.type}`;
      li.style.paddingLeft = `${depth * 14 + 10}px`;

      const itemContent = document.createElement('div');
      itemContent.className = 'tree-item-content';

      const icon = document.createElement('span');
      icon.className = 'item-icon';

      const label = document.createElement('span');
      label.className = 'item-label';
      label.textContent = node.name;

      const actions = document.createElement('div');
      actions.className = 'item-actions';

      if (node.type === 'directory') {
        const isCollapsed = this.collapsedDirs.has(node.path);
        icon.innerHTML = isCollapsed ? '▶' : '▼';
        icon.className += ' folder-toggle';

        itemContent.appendChild(icon);
        itemContent.appendChild(label);

        // Actions: New File inside, Delete
        actions.innerHTML = `
          <button class="mini-btn btn-add" title="Nuevo archivo aquí">+</button>
          <button class="mini-btn btn-del" title="Eliminar carpeta">&times;</button>
        `;

        actions.querySelector('.btn-add')?.addEventListener('click', (e) => {
          e.stopPropagation();
          this.promptCreateFile(node.path);
        });

        actions.querySelector('.btn-del')?.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`¿Eliminar la carpeta "${node.path}" y todo su contenido?`)) {
            vfs.deleteNode(node.path);
            vfs.saveToStorage();
          }
        });

        itemContent.appendChild(actions);
        li.appendChild(itemContent);

        itemContent.onclick = () => {
          if (this.collapsedDirs.has(node.path)) {
            this.collapsedDirs.delete(node.path);
          } else {
            this.collapsedDirs.add(node.path);
          }
          this.render();
        };

        container.appendChild(li);

        if (!isCollapsed) {
          const children = vfs.listDirectory(node.path);
          if (children.length > 0) {
            const childUl = document.createElement('ul');
            childUl.className = 'tree-sublist';
            this.renderNodeList(children, childUl, depth + 1);
            container.appendChild(childUl);
          }
        }
      } else {
        // File node
        icon.innerHTML = this.getFileIcon(node.name);
        itemContent.appendChild(icon);
        itemContent.appendChild(label);

        // Actions: Rename, Delete
        actions.innerHTML = `
          <button class="mini-btn btn-del" title="Eliminar archivo">&times;</button>
        `;

        actions.querySelector('.btn-del')?.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm(`¿Eliminar el archivo "${node.name}"?`)) {
            vfs.deleteNode(node.path);
            vfs.saveToStorage();
          }
        });

        itemContent.appendChild(actions);
        li.appendChild(itemContent);

        itemContent.onclick = () => {
          editorManager.openFile(node.path);
        };

        container.appendChild(li);
      }
    }
  }

  private getFileIcon(name: string): string {
    const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
    switch (ext) {
      case '.js':
        return '<span style="color:#f1e05a">JS</span>';
      case '.ts':
        return '<span style="color:#3178c6">TS</span>';
      case '.html':
        return '<span style="color:#e34c26">&lt;&gt;</span>';
      case '.css':
        return '<span style="color:#563d7c">#</span>';
      case '.json':
        return '<span style="color:#cb8b00">{}</span>';
      case '.md':
        return '<span style="color:#007acc">M↓</span>';
      case '.py':
        return '<span style="color:#3572A5">PY</span>';
      default:
        return '<span>📄</span>';
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

export const explorerView = new ExplorerView();
