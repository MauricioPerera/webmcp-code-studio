import { terminalShell } from '../core/terminal-shell';
import { gitVcs } from '../core/git-vcs';
import { vfs } from '../core/vfs';
import { eventBus } from '../core/event-bus';

export class TerminalPanelView {
  private logOutput: HTMLElement | null = null;
  private inputEl: HTMLInputElement | null = null;
  private promptEl: HTMLElement | null = null;
  private clearBtn: HTMLElement | null = null;
  private commandHistory: string[] = [];
  private historyIndex: number = -1;

  constructor() {
    this.setupListeners();
  }

  public init(): void {
    this.logOutput = document.getElementById('terminal-output');
    this.inputEl = document.getElementById('terminal-input') as HTMLInputElement;
    this.promptEl = document.getElementById('terminal-prompt');
    this.clearBtn = document.getElementById('btn-clear-terminal');

    this.bindEvents();
    this.updatePrompt();
    this.appendSystemLog('WebMCP Unix Terminal (POSIX & Git VFS Shell) lista. Escribe "help" para ver comandos disponibles.');
  }

  private setupListeners(): void {
    eventBus.on<{ type: string; messages: string[]; timestamp: number }>(
      'sandbox:log',
      ({ type, messages }) => {
        this.appendLog(type, messages.join(' '));
      }
    );

    eventBus.on('git:status_changed', () => {
      this.updatePrompt();
    });

    eventBus.on('git:branch_changed', () => {
      this.updatePrompt();
    });
  }

  public updatePrompt(): void {
    if (!this.promptEl) return;
    const cwd = terminalShell.getCwd();
    const branch = gitVcs.getCurrentBranch();
    this.promptEl.innerHTML = `<span style="color:#38bdf8">dev@webmcp</span>:<span style="color:#fbbf24">${cwd}</span> (<span style="color:#10b981">${branch}</span>)$`;
  }

  private bindEvents(): void {
    this.clearBtn?.addEventListener('click', () => {
      if (this.logOutput) this.logOutput.innerHTML = '';
    });

    this.inputEl?.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const line = this.inputEl?.value.trim();
        if (!line) return;

        this.commandHistory.push(line);
        this.historyIndex = this.commandHistory.length;
        this.inputEl!.value = '';

        const cwd = terminalShell.getCwd();
        const branch = gitVcs.getCurrentBranch();
        this.appendLog('input', `dev@webmcp:${cwd} (${branch})$ ${line}`);

        const result = await terminalShell.execute(line);

        if (result.stdout.includes('\x1b[2J\x1b[H')) {
          if (this.logOutput) this.logOutput.innerHTML = '';
        } else if (result.stdout) {
          this.appendLog('stdout', result.stdout);
        }

        if (result.stderr) {
          this.appendLog('stderr', result.stderr);
        }

        this.updatePrompt();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.commandHistory.length > 0 && this.historyIndex > 0) {
          this.historyIndex--;
          this.inputEl!.value = this.commandHistory[this.historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.historyIndex < this.commandHistory.length - 1) {
          this.historyIndex++;
          this.inputEl!.value = this.commandHistory[this.historyIndex];
        } else {
          this.historyIndex = this.commandHistory.length;
          this.inputEl!.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.handleTabCompletion();
      }
    });
  }

  private handleTabCompletion(): void {
    if (!this.inputEl) return;
    const val = this.inputEl.value;
    const parts = val.split(' ');
    const currentWord = parts[parts.length - 1];

    if (parts.length === 1) {
      // Complete command name
      const commands = [
        'pwd', 'cd', 'ls', 'cat', 'echo', 'touch', 'mkdir', 'rm',
        'cp', 'mv', 'grep', 'head', 'tail', 'wc', 'clear', 'help',
        'git', 'node', 'js',
      ];
      const match = commands.find((c) => c.startsWith(currentWord) && c !== currentWord);
      if (match) {
        parts[parts.length - 1] = match;
        this.inputEl.value = parts.join(' ') + ' ';
      }
    } else {
      // Complete path in cwd
      const cwd = terminalShell.getCwd();
      const children = vfs.listDirectory(cwd);
      const names = children.map((c) => (c.type === 'directory' ? c.name + '/' : c.name));
      const match = names.find((n) => n.startsWith(currentWord) && n !== currentWord);
      if (match) {
        parts[parts.length - 1] = match;
        this.inputEl.value = parts.join(' ');
      }
    }
  }

  public appendLog(type: string, text: string): void {
    if (!this.logOutput) return;

    const row = document.createElement('div');
    row.className = `term-line ${type}`;

    const formatted = this.ansiToHtml(text);
    row.innerHTML = formatted;

    this.logOutput.appendChild(row);
    this.logOutput.scrollTop = this.logOutput.scrollHeight;
  }

  public appendSystemLog(text: string): void {
    this.appendLog('system', text);
  }

  private ansiToHtml(text: string): string {
    const escaped = this.escapeHtml(text);
    return escaped
      .replace(/\x1b\[32m/g, '<span style="color:#10b981">')
      .replace(/\x1b\[31m/g, '<span style="color:#ef4444">')
      .replace(/\x1b\[33m/g, '<span style="color:#fbbf24">')
      .replace(/\x1b\[34m/g, '<span style="color:#38bdf8">')
      .replace(/\x1b\[0m/g, '</span>');
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

export const terminalPanelView = new TerminalPanelView();
