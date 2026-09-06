import { gitVcs, GitStatusResult, GitCommit } from '../core/git-vcs';
import { remoteSync, RemoteConfig } from '../core/remote-sync';
import { editorManager } from './editor';
import { eventBus } from '../core/event-bus';

export class GitView {
  private container: HTMLElement | null = null;
  private badgeEl: HTMLElement | null = null;
  private commitMsgInput: HTMLTextAreaElement | null = null;
  private commitBtn: HTMLButtonElement | null = null;
  private stagedContainer: HTMLElement | null = null;
  private unstagedContainer: HTMLElement | null = null;
  private historyContainer: HTMLElement | null = null;
  private branchLabel: HTMLElement | null = null;

  constructor() {
    this.setupListeners();
  }

  public init(): void {
    this.container = document.getElementById('panel-git');
    this.badgeEl = document.getElementById('git-badge');

    if (!this.container) return;

    this.renderInitialHtml();
    this.bindEvents();
    this.updateView(gitVcs.getStatus());
    this.updateRemoteView();
  }

  private setupListeners(): void {
    eventBus.on<GitStatusResult>('git:status_changed', (status) => {
      this.updateView(status);
    });

    eventBus.on<GitCommit>('git:commit', () => {
      this.updateView(gitVcs.getStatus());
    });

    eventBus.on('remote:config_updated', () => {
      this.updateRemoteView();
    });

    eventBus.on('remote:push_completed', (res: any) => {
      this.showRemoteMessage(`✓ Push exitoso: ${res.repo}@${res.branch}`, 'success', res.url);
    });

    eventBus.on('remote:pull_completed', (res: any) => {
      this.showRemoteMessage(`✓ Pull exitoso: ${res.filesUpdated} archivos`, 'success');
      this.updateView(gitVcs.getStatus());
    });
  }

  private renderInitialHtml(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="sidebar-header">
        <span class="sidebar-title">CONTROL DE CÓDIGO FUENTE</span>
        <div class="sidebar-actions">
          <button class="icon-btn" id="btn-git-refresh" title="Actualizar estado Git">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
          <button class="icon-btn" id="btn-git-new-branch" title="Crear nueva rama">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="6" y1="3" x2="6" y2="15"></line>
              <circle cx="18" cy="6" r="3"></circle>
              <circle cx="6" cy="18" r="3"></circle>
              <path d="M18 9a9 9 0 0 1-9 9"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="git-view-body">
        <!-- Branch selector bar -->
        <div class="git-branch-bar">
          <div class="git-branch-info" id="git-branch-trigger" title="Haga clic para cambiar o crear rama">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="6" y1="3" x2="6" y2="15"></line>
              <circle cx="18" cy="6" r="3"></circle>
              <circle cx="6" cy="18" r="3"></circle>
              <path d="M18 9a9 9 0 0 1-9 9"></path>
            </svg>
            <span id="git-current-branch-name">${gitVcs.getCurrentBranch()}</span>
          </div>
        </div>

        <!-- Commit Form -->
        <div class="git-commit-box">
          <textarea
            id="git-commit-input"
            class="git-commit-textarea"
            rows="2"
            placeholder="Mensaje (Ctrl+Enter para commit)"
          ></textarea>
          <button id="btn-git-commit" class="btn btn-primary git-commit-btn" disabled>
            Hacer Commit
          </button>
        </div>

        <!-- Sections for Staged and Unstaged changes -->
        <div class="git-changes-scrollable">
          <div id="git-staged-section" class="git-section" style="display: none;">
            <div class="git-section-header">
              <span class="git-section-title">CAMBIOS PREPARADOS (<span id="git-staged-count">0</span>)</span>
              <button class="icon-btn-micro" id="btn-git-unstage-all" title="Despreparar todos los cambios">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
            <ul id="git-staged-list" class="git-file-list"></ul>
          </div>

          <div id="git-unstaged-section" class="git-section">
            <div class="git-section-header">
              <span class="git-section-title">CAMBIOS (<span id="git-unstaged-count">0</span>)</span>
              <div class="git-section-actions">
                <button class="icon-btn-micro" id="btn-git-discard-all" title="Descartar todos los cambios">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                  </svg>
                </button>
                <button class="icon-btn-micro" id="btn-git-stage-all" title="Preparar todos los cambios">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            </div>
            <ul id="git-unstaged-list" class="git-file-list"></ul>
          </div>

          <!-- Remote Repository Section -->
          <div class="git-section git-remote-section">
            <div class="git-section-header">
              <span class="git-section-title">SINCRONIZACIÓN REMOTA</span>
              <button class="icon-btn-micro" id="btn-remote-toggle-config" title="Configurar Remoto">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
            </div>
            <div class="git-remote-content">
              <div class="git-remote-info">
                <span id="remote-info-label" class="git-remote-repo-text">Sin remoto</span>
                <span id="remote-status-badge" class="remote-badge unconfigured">Desconectado</span>
              </div>
              <div id="remote-config-form" class="remote-config-form" style="display: none;">
                <div class="form-row">
                  <label class="remote-input-label">Proveedor:</label>
                  <select id="remote-provider-select" class="vscode-select">
                    <option value="github">GitHub</option>
                    <option value="codeberg">Codeberg</option>
                  </select>
                </div>
                <div class="form-row">
                  <label class="remote-input-label">Repositorio (usuario/repo):</label>
                  <input type="text" id="remote-repo-input" class="vscode-input" placeholder="MauricioPerera/mi-repo" />
                </div>
                <div class="form-row">
                  <label class="remote-input-label">Personal Access Token (PAT):</label>
                  <input type="password" id="remote-token-input" class="vscode-input" placeholder="ghp_... o token Codeberg" />
                </div>
                <div class="form-row-actions">
                  <button id="btn-remote-save" class="btn btn-primary btn-micro">Guardar</button>
                  <button id="btn-remote-clear" class="btn btn-secondary btn-micro">Limpiar</button>
                </div>
              </div>
              <div class="remote-actions-row">
                <button id="btn-remote-push" class="btn btn-primary btn-micro remote-action-btn" title="Subir al repositorio remoto">
                  ↑ Push
                </button>
                <button id="btn-remote-pull" class="btn btn-secondary btn-micro remote-action-btn" title="Descargar desde el repositorio remoto">
                  ↓ Pull
                </button>
              </div>
              <div id="remote-status-msg" class="remote-status-msg"></div>
            </div>
          </div>

          <!-- Commit History Section -->
          <div class="git-section git-history-section">
            <div class="git-section-header">
              <span class="git-section-title">HISTORIAL DE COMMITS</span>
            </div>
            <div id="git-history-list" class="git-history-list"></div>
          </div>
        </div>
      </div>
    `;

    this.commitMsgInput = document.getElementById('git-commit-input') as HTMLTextAreaElement;
    this.commitBtn = document.getElementById('btn-git-commit') as HTMLButtonElement;
    this.stagedContainer = document.getElementById('git-staged-list');
    this.unstagedContainer = document.getElementById('git-unstaged-list');
    this.historyContainer = document.getElementById('git-history-list');
    this.branchLabel = document.getElementById('git-current-branch-name');
  }

  private bindEvents(): void {
    document.getElementById('btn-git-refresh')?.addEventListener('click', () => {
      this.updateView(gitVcs.getStatus());
    });

    document.getElementById('btn-git-new-branch')?.addEventListener('click', () => {
      this.promptCreateBranch();
    });

    document.getElementById('git-branch-trigger')?.addEventListener('click', () => {
      this.promptSwitchBranch();
    });

    this.commitBtn?.addEventListener('click', () => {
      this.handleCommit();
    });

    this.commitMsgInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.handleCommit();
      }
    });

    document.getElementById('btn-git-stage-all')?.addEventListener('click', () => {
      gitVcs.stageAll();
    });

    document.getElementById('btn-git-unstage-all')?.addEventListener('click', () => {
      gitVcs.unstageAll();
    });

    document.getElementById('btn-git-discard-all')?.addEventListener('click', () => {
      if (confirm('¿Descartar TODOS los cambios no guardados? Esta acción restaurará el último commit.')) {
        const status = gitVcs.getStatus();
        for (const c of status.unstaged) {
          gitVcs.discardFileChanges(c.path);
        }
      }
    });

    // Remote sync events
    const toggleConfigBtn = document.getElementById('btn-remote-toggle-config');
    const configForm = document.getElementById('remote-config-form');
    toggleConfigBtn?.addEventListener('click', () => {
      if (configForm) {
        configForm.style.display = configForm.style.display === 'none' ? 'block' : 'none';
      }
    });

    document.getElementById('btn-remote-save')?.addEventListener('click', () => {
      this.saveRemoteConfig();
    });

    document.getElementById('btn-remote-clear')?.addEventListener('click', () => {
      remoteSync.clearConfig();
      if (configForm) configForm.style.display = 'none';
      this.showRemoteMessage('Configuración remota eliminada.', 'info');
    });

    document.getElementById('btn-remote-push')?.addEventListener('click', async () => {
      await this.handleRemotePush();
    });

    document.getElementById('btn-remote-pull')?.addEventListener('click', async () => {
      await this.handleRemotePull();
    });
  }

  private saveRemoteConfig(): void {
    const provider = (document.getElementById('remote-provider-select') as HTMLSelectElement)?.value as any;
    const repo = (document.getElementById('remote-repo-input') as HTMLInputElement)?.value.trim();
    const token = (document.getElementById('remote-token-input') as HTMLInputElement)?.value.trim();

    if (!repo) {
      alert('Por favor especifique el repositorio (ej: usuario/mi-repo).');
      return;
    }

    try {
      remoteSync.setConfig({
        provider,
        repo,
        token: token || undefined,
      });
      const form = document.getElementById('remote-config-form');
      if (form) form.style.display = 'none';
      this.showRemoteMessage('Configuración remota guardada con éxito.', 'success');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  }

  private async handleRemotePush(): Promise<void> {
    const pushBtn = document.getElementById('btn-remote-push') as HTMLButtonElement;
    if (pushBtn) pushBtn.disabled = true;
    this.showRemoteMessage('Enviando cambios al repositorio remoto...', 'info');

    try {
      const res = await remoteSync.push();
      this.showRemoteMessage(`✓ Push completado con éxito a ${res.repo} (${res.commitSha.slice(0, 7)})`, 'success', res.url);
    } catch (err: any) {
      this.showRemoteMessage(`✕ Error en push: ${err.message}`, 'error');
    } finally {
      if (pushBtn) pushBtn.disabled = false;
    }
  }

  private async handleRemotePull(): Promise<void> {
    const pullBtn = document.getElementById('btn-remote-pull') as HTMLButtonElement;
    if (pullBtn) pullBtn.disabled = true;
    this.showRemoteMessage('Descargando cambios desde el repositorio remoto...', 'info');

    try {
      const res = await remoteSync.pull();
      this.showRemoteMessage(`✓ Pull completado: ${res.filesUpdated} archivos actualizados.`, 'success');
      this.updateView(gitVcs.getStatus());
    } catch (err: any) {
      this.showRemoteMessage(`✕ Error en pull: ${err.message}`, 'error');
    } finally {
      if (pullBtn) pullBtn.disabled = false;
    }
  }

  private updateRemoteView(): void {
    const config = remoteSync.getConfig();
    const infoLabel = document.getElementById('remote-info-label');
    const statusBadge = document.getElementById('remote-status-badge');
    const repoInput = document.getElementById('remote-repo-input') as HTMLInputElement;
    const providerSelect = document.getElementById('remote-provider-select') as HTMLSelectElement;

    if (config) {
      if (infoLabel) infoLabel.textContent = `${config.provider === 'github' ? 'GitHub' : 'Codeberg'}: ${config.repo}`;
      if (statusBadge) {
        statusBadge.textContent = 'Conectado';
        statusBadge.className = 'remote-badge connected';
      }
      if (repoInput) repoInput.value = config.repo;
      if (providerSelect) providerSelect.value = config.provider;
    } else {
      if (infoLabel) infoLabel.textContent = 'Sin remoto configurado';
      if (statusBadge) {
        statusBadge.textContent = 'Desconectado';
        statusBadge.className = 'remote-badge unconfigured';
      }
    }
  }

  private showRemoteMessage(text: string, type: 'info' | 'success' | 'error', linkUrl?: string): void {
    const msgEl = document.getElementById('remote-status-msg');
    if (!msgEl) return;

    msgEl.className = `remote-status-msg ${type}`;
    if (linkUrl) {
      msgEl.innerHTML = `${this.escapeHtml(text)} <a href="${linkUrl}" target="_blank" rel="noopener" style="color: #38bdf8; text-decoration: underline; margin-left: 4px;">Ver commit ↗</a>`;
    } else {
      msgEl.textContent = text;
    }

    if (type !== 'error') {
      setTimeout(() => {
        if (msgEl.textContent === text) {
          msgEl.textContent = '';
          msgEl.className = 'remote-status-msg';
        }
      }, 8000);
    }
  }

  private handleCommit(): void {
    const msg = this.commitMsgInput?.value.trim();
    if (!msg) {
      alert('Por favor escribe un mensaje para el commit.');
      return;
    }

    try {
      gitVcs.commit(msg);
      if (this.commitMsgInput) {
        this.commitMsgInput.value = '';
      }
    } catch (err: any) {
      alert('Error en commit: ' + err.message);
    }
  }

  public promptCreateBranch(): void {
    const name = prompt('Nombre de la nueva rama Git (ej: feature-api):');
    if (name && name.trim()) {
      try {
        gitVcs.createBranch(name.trim());
        if (confirm(`¿Cambiar a la nueva rama "${name.trim()}" ahora?`)) {
          gitVcs.checkoutBranch(name.trim());
        }
      } catch (err: any) {
        alert('Error: ' + err.message);
      }
    }
  }

  public promptSwitchBranch(): void {
    const branches = gitVcs.getBranches();
    const current = gitVcs.getCurrentBranch();
    const selection = prompt(
      `Ramas disponibles:\n${branches.map((b) => (b === current ? `* ${b} (actual)` : `  ${b}`)).join('\n')}\n\nEscribe el nombre de la rama a la que deseas cambiar:`,
      current
    );

    if (selection && selection.trim() && selection.trim() !== current) {
      try {
        gitVcs.checkoutBranch(selection.trim());
      } catch (err: any) {
        alert('Error al cambiar de rama: ' + err.message);
      }
    }
  }

  public updateView(status: GitStatusResult): void {
    // 1. Update activity badge
    if (this.badgeEl) {
      this.badgeEl.textContent = status.totalChanges > 0 ? String(status.totalChanges) : '0';
      this.badgeEl.style.display = status.totalChanges > 0 ? 'flex' : 'none';
    }

    // 2. Update branch name
    if (this.branchLabel) {
      this.branchLabel.textContent = status.branch;
    }

    // 3. Update commit button state
    if (this.commitBtn) {
      this.commitBtn.disabled = status.totalChanges === 0;
    }

    // 4. Render staged changes
    const stagedSection = document.getElementById('git-staged-section');
    const stagedCount = document.getElementById('git-staged-count');
    if (stagedSection && stagedCount && this.stagedContainer) {
      stagedCount.textContent = String(status.staged.length);
      stagedSection.style.display = status.staged.length > 0 ? 'block' : 'none';

      this.stagedContainer.innerHTML = '';
      for (const change of status.staged) {
        this.stagedContainer.appendChild(this.createChangeItem(change, true));
      }
    }

    // 5. Render unstaged changes
    const unstagedCount = document.getElementById('git-unstaged-count');
    if (unstagedCount && this.unstagedContainer) {
      unstagedCount.textContent = String(status.unstaged.length);

      this.unstagedContainer.innerHTML = '';
      if (status.unstaged.length === 0 && status.staged.length === 0) {
        this.unstagedContainer.innerHTML = '<li class="git-empty-state">No hay cambios pendientes</li>';
      } else {
        for (const change of status.unstaged) {
          this.unstagedContainer.appendChild(this.createChangeItem(change, false));
        }
      }
    }

    this.renderHistory();
  }

  private createChangeItem(change: { path: string; status: 'M' | 'A' | 'D'; staged: boolean }, isStaged: boolean): HTMLElement {
    const li = document.createElement('li');
    li.className = 'git-file-item';

    const leftPart = document.createElement('div');
    leftPart.className = 'git-file-left';

    const fileName = change.path.split('/').pop() || change.path;
    const dirPath = change.path.substring(0, change.path.lastIndexOf('/')) || '/';

    leftPart.innerHTML = `
      <span class="git-file-name" title="${change.path}">${this.escapeHtml(fileName)}</span>
      <span class="git-file-dir" title="${change.path}">${this.escapeHtml(dirPath)}</span>
    `;

    leftPart.onclick = () => {
      if (change.status !== 'D') {
        editorManager.openDiff(change.path);
      }
    };

    const rightPart = document.createElement('div');
    rightPart.className = 'git-file-right';

    const statusBadge = document.createElement('span');
    statusBadge.className = `git-status-badge status-${change.status.toLowerCase()}`;
    statusBadge.textContent = change.status;
    statusBadge.title = change.status === 'M' ? 'Modificado' : change.status === 'A' ? 'Añadido' : 'Eliminado';

    const actions = document.createElement('div');
    actions.className = 'git-item-actions';

    if (change.status !== 'D') {
      const openNormalBtn = document.createElement('button');
      openNormalBtn.className = 'icon-btn-micro';
      openNormalBtn.title = 'Abrir archivo estándar';
      openNormalBtn.innerHTML = `
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      `;
      openNormalBtn.onclick = (e) => {
        e.stopPropagation();
        editorManager.openFile(change.path);
      };
      actions.appendChild(openNormalBtn);
    }

    if (isStaged) {
      // Unstage button (-)
      const unstageBtn = document.createElement('button');
      unstageBtn.className = 'icon-btn-micro';
      unstageBtn.title = 'Despreparar cambios';
      unstageBtn.innerHTML = `
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      `;
      unstageBtn.onclick = (e) => {
        e.stopPropagation();
        gitVcs.unstageFile(change.path);
      };
      actions.appendChild(unstageBtn);
    } else {
      // Discard button (↺)
      const discardBtn = document.createElement('button');
      discardBtn.className = 'icon-btn-micro';
      discardBtn.title = 'Descartar cambios';
      discardBtn.innerHTML = `
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="1 4 1 10 7 10"></polyline>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
        </svg>
      `;
      discardBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`¿Descartar cambios en "${change.path}"?`)) {
          gitVcs.discardFileChanges(change.path);
        }
      };
      actions.appendChild(discardBtn);

      // Stage button (+)
      const stageBtn = document.createElement('button');
      stageBtn.className = 'icon-btn-micro';
      stageBtn.title = 'Preparar cambios';
      stageBtn.innerHTML = `
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      `;
      stageBtn.onclick = (e) => {
        e.stopPropagation();
        gitVcs.stageFile(change.path);
      };
      actions.appendChild(stageBtn);
    }

    rightPart.appendChild(statusBadge);
    rightPart.appendChild(actions);

    li.appendChild(leftPart);
    li.appendChild(rightPart);
    return li;
  }

  private renderHistory(): void {
    if (!this.historyContainer) return;

    const commits = gitVcs.getLog(15);
    this.historyContainer.innerHTML = '';

    if (commits.length === 0) {
      this.historyContainer.innerHTML = '<div class="git-empty-state">Sin commits todavía</div>';
      return;
    }

    for (const commit of commits) {
      const item = document.createElement('div');
      item.className = 'git-history-item';

      const shortHash = commit.hash.substring(0, 7);
      const dateStr = new Date(commit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      item.innerHTML = `
        <div class="git-history-top">
          <span class="git-history-hash" title="${commit.hash}">${shortHash}</span>
          <span class="git-history-time">${dateStr}</span>
        </div>
        <div class="git-history-msg" title="${this.escapeHtml(commit.message)}">${this.escapeHtml(commit.message)}</div>
        <div class="git-history-author" title="${commit.author}">${this.escapeHtml(commit.author)}</div>
      `;

      this.historyContainer.appendChild(item);
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

export const gitView = new GitView();
