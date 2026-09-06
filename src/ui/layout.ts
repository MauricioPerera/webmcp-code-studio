import { editorManager } from './editor';
import { vfs } from '../core/vfs';

export class LayoutManager {
  private activeActivityId: string = 'explorer';
  private isBottomPanelOpen: boolean = true;

  public init(): void {
    this.bindActivityBar();
    this.bindBottomPanel();
    this.bindSplitters();
    this.bindThemeToggle();
    this.bindQuickOpen();
    this.renderKddPanel();
    this.renderSettingsPanel();
  }

  private bindActivityBar(): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.activity-btn[data-panel]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const panelId = btn.getAttribute('data-panel');
        if (!panelId) return;

        // Toggle active button
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeActivityId = panelId;

        // Toggle active sidebar panel
        document.querySelectorAll('.sidebar-panel').forEach((p) => p.classList.remove('active'));
        const targetPanel = document.getElementById(`panel-${panelId}`);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  }

  private bindBottomPanel(): void {
    // Tabs switching
    const tabs = document.querySelectorAll<HTMLButtonElement>('.panel-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        if (!tabId) return;

        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        document.querySelectorAll('.panel-view').forEach((v) => v.classList.remove('active'));
        const targetView = document.getElementById(`view-${tabId}`);
        if (targetView) targetView.classList.add('active');
      });
    });

    // Close bottom panel
    document.getElementById('btn-close-bottom-panel')?.addEventListener('click', () => {
      this.toggleBottomPanel(false);
    });

    // Toggle bottom panel button
    document.getElementById('btn-toggle-panel')?.addEventListener('click', () => {
      this.toggleBottomPanel(!this.isBottomPanelOpen);
    });

    // Keyboard shortcut Ctrl+`
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        this.toggleBottomPanel(!this.isBottomPanelOpen);
      }
    });
  }

  public toggleBottomPanel(show?: boolean): void {
    const bottomPanel = document.getElementById('bottom-panel');
    const resizer = document.getElementById('panel-resizer');
    if (!bottomPanel) return;

    this.isBottomPanelOpen = show !== undefined ? show : !this.isBottomPanelOpen;
    if (this.isBottomPanelOpen) {
      bottomPanel.style.display = 'flex';
      if (resizer) resizer.style.display = 'block';
    } else {
      bottomPanel.style.display = 'none';
      if (resizer) resizer.style.display = 'none';
    }
  }

  private bindSplitters(): void {
    // Vertical splitter (Sidebar width)
    const vResizer = document.getElementById('sidebar-resizer');
    const sidebar = document.getElementById('sidebar');

    if (vResizer && sidebar) {
      let isDragging = false;

      vResizer.addEventListener('mousedown', (e) => {
        isDragging = true;
        document.body.style.cursor = 'col-resize';
        vResizer.classList.add('resizing');
        e.preventDefault();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const newWidth = Math.max(160, Math.min(600, e.clientX - 48)); // 48px is activity bar width
        sidebar.style.width = `${newWidth}px`;
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          document.body.style.cursor = 'default';
          vResizer.classList.remove('resizing');
        }
      });
    }

    // Horizontal splitter (Bottom panel height)
    const hResizer = document.getElementById('panel-resizer');
    const bottomPanel = document.getElementById('bottom-panel');

    if (hResizer && bottomPanel) {
      let isDragging = false;

      hResizer.addEventListener('mousedown', (e) => {
        isDragging = true;
        document.body.style.cursor = 'row-resize';
        hResizer.classList.add('resizing');
        e.preventDefault();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const newHeight = Math.max(120, Math.min(window.innerHeight - 150, window.innerHeight - e.clientY - 24)); // 24px status bar
        bottomPanel.style.height = `${newHeight}px`;
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          document.body.style.cursor = 'default';
          hResizer.classList.remove('resizing');
        }
      });
    }
  }

  private bindThemeToggle(): void {
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
      editorManager.toggleTheme();
    });
  }

  private bindQuickOpen(): void {
    const quickOpen = document.getElementById('quick-open');
    quickOpen?.addEventListener('click', () => {
      this.showQuickOpenDialog();
    });

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        this.showQuickOpenDialog();
      }
    });
  }

  private showQuickOpenDialog(): void {
    const allFiles = vfs.listAllFiles();
    const query = prompt('Ir al archivo:\n' + allFiles.map((f) => f.path).join('\n'));
    if (!query) return;

    const matched = allFiles.find((f) => f.path.toLowerCase().includes(query.toLowerCase()));
    if (matched) {
      editorManager.openFile(matched.path);
    } else {
      alert(`No se encontró ningún archivo que coincida con "${query}".`);
    }
  }

  private renderKddPanel(): void {
    const container = document.getElementById('kdd-panel-body');
    if (!container) return;

    container.innerHTML = `
      <div class="kdd-info-box">
        <h4>Metodología KDD</h4>
        <p class="kdd-summary">
          <strong>Knowledge-Driven Development (KDD)</strong> unifica el modelado de contexto en 
          <strong>Open Knowledge Format (OKF)</strong> con el rigor de <strong>Contract-Driven Development (CCDD)</strong>.
        </p>

        <div class="kdd-pillars">
          <div class="kdd-card">
            <strong>1. Base de Conocimiento OKF</strong>
            <p>Directorio <code>knowledge/</code> con nodos en Markdown y Frontmatter YAML estructurado.</p>
          </div>
          <div class="kdd-card">
            <strong>2. Contratos de Tarea CCDD</strong>
            <p>Contratos con oráculos de pruebas congelados, hash SHA-256 inmutable y claves de perímetro <code>touch_only</code>.</p>
          </div>
          <div class="kdd-card">
            <strong>3. Validadores Deterministas</strong>
            <p>Scripts en Python stdlib (sin dependencias ni red) para validar contratos, OKF y lints.</p>
          </div>
        </div>

        <div class="kdd-links">
          <strong>Enlaces canónicos del proyecto:</strong>
          <ul>
            <li><a href="#" id="link-kdd-index">📄 knowledge/index.md</a></li>
            <li><a href="#" id="link-kdd-arch">🏛️ knowledge/architecture/overview.md</a></li>
            <li><a href="#" id="link-kdd-vfs">📦 knowledge/contracts/vfs-contract.md</a></li>
            <li><a href="#" id="link-kdd-webmcp">⚡ knowledge/contracts/webmcp-contract.md</a></li>
          </ul>
        </div>
      </div>
    `;

    document.getElementById('link-kdd-index')?.addEventListener('click', (e) => {
      e.preventDefault();
      editorManager.openFile('/knowledge/index.md');
    });
    document.getElementById('link-kdd-arch')?.addEventListener('click', (e) => {
      e.preventDefault();
      editorManager.openFile('/knowledge/architecture/overview.md');
    });
    document.getElementById('link-kdd-vfs')?.addEventListener('click', (e) => {
      e.preventDefault();
      editorManager.openFile('/knowledge/contracts/vfs-contract.md');
    });
    document.getElementById('link-kdd-webmcp')?.addEventListener('click', (e) => {
      e.preventDefault();
      editorManager.openFile('/knowledge/contracts/webmcp-contract.md');
    });
  }

  private renderSettingsPanel(): void {
    const container = document.getElementById('settings-panel-body');
    if (!container) return;

    container.innerHTML = `
      <div class="settings-content">
        <div class="form-group">
          <label class="form-label">Tema de la Interfaz:</label>
          <button class="btn-secondary" id="btn-switch-theme">Alternar Tema (Dark / Light)</button>
        </div>

        <div class="form-group">
          <label class="form-label">Almacenamiento Local:</label>
          <button class="btn-danger" id="btn-reset-vfs">Borrar y Restaurar Espacio de Trabajo</button>
        </div>

        <div class="form-group">
          <label class="form-label">Acerca de:</label>
          <div class="about-card">
            <strong>WebMCP Code Studio v1.0.0</strong>
            <p>Construido con Vite, TypeScript, Monaco Editor, fastwebmcp v0.4.2 y metodología KDD.</p>
            <p>Listo para despliegue estático en GitHub Pages.</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-switch-theme')?.addEventListener('click', () => {
      editorManager.toggleTheme();
    });

    document.getElementById('btn-reset-vfs')?.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que deseas restablecer el almacenamiento local del VFS? Se recargarán las plantillas por defecto.')) {
        localStorage.removeItem('webmcp_studio_vfs_v1');
        window.location.reload();
      }
    });
  }
}

export const layoutManager = new LayoutManager();
