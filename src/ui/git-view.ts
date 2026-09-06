import { gitVcs, GitStatusResult, GitCommit } from '../core/git-vcs';
import { eventBus } from '../core/event-bus';
import { editorManager } from './editor';

export class GitView {
  private panelContainer: HTMLElement | null = null;
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
    this.panelContainer = document.getElementById('panel-git');
    this.badgeEl = document.getElementById('git-badge');

    if (!this.panelContainer) return;

    this.renderSkeleton();
    this.bindEvents();
    this.updateView(gitVcs.getStatus());
  }

  private setupListeners(): void {
    eventBus.on<GitStatusResult>('git:status_changed', (status) => {
      this.updateView(status);
    });
    eventBus.on('git:commit', () => {
      this.renderHistory();
    });
    eventBus.on<string>('git:branch_changed', (branch) => {
      if (this.branchLabel) this.branchLabel.textContent = branch;
      this.updateView(gitVcs.getStatus());
    });
  }

  private renderSkeleton(): void {
    if (!this.panelContainer) return;

    this.panelContainer.innerHTML = `
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
        editorManager.openFile(change.path);
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

    if (commits.length === 0) {
      this.historyContainer.innerHTML = '<div class="git-empty-state">Sin commits todavía</div>';
      return;
    }

    this.historyContainer.innerHTML = '';
    for (const c of commits) {
      const el = document.createElement('div');
      el.className = 'git-history-item';
      const shortHash = c.hash.substring(0, 7);
      const timeStr = new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      el.innerHTML = `
        <div class="git-history-top">
          <span class="git-history-hash">${shortHash}</span>
          <span class="git-history-time">${timeStr}</span>
        </div>
        <div class="git-history-msg" title="${this.escapeHtml(c.message)}">${this.escapeHtml(c.message)}</div>
        <div class="git-history-author">${this.escapeHtml(c.author)}</div>
      `;
      this.historyContainer.appendChild(el);
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

export const gitView = new GitView();
