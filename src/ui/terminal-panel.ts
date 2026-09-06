import { sandboxManager } from '../core/sandbox';
import { eventBus } from '../core/event-bus';

export class TerminalPanelView {
  private logOutput: HTMLElement | null = null;
  private inputEl: HTMLInputElement | null = null;
  private clearBtn: HTMLElement | null = null;
  private commandHistory: string[] = [];
  private historyIndex: number = -1;

  constructor() {
    this.setupListeners();
  }

  public init(): void {
    this.logOutput = document.getElementById('terminal-output');
    this.inputEl = document.getElementById('terminal-input') as HTMLInputElement;
    this.clearBtn = document.getElementById('btn-clear-terminal');

    this.bindEvents();
    this.appendSystemLog('WebMCP Terminal REPL listo. Escribe código JavaScript y presiona Enter.');
  }

  private setupListeners(): void {
    eventBus.on<{ type: string; messages: string[]; timestamp: number }>(
      'sandbox:log',
      ({ type, messages }) => {
        this.appendLog(type, messages.join(' '));
      }
    );
  }

  private bindEvents(): void {
    this.clearBtn?.addEventListener('click', () => {
      if (this.logOutput) this.logOutput.innerHTML = '';
    });

    this.inputEl?.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const code = this.inputEl?.value.trim();
        if (!code) return;

        this.commandHistory.push(code);
        this.historyIndex = this.commandHistory.length;
        this.inputEl!.value = '';

        this.appendLog('input', `> ${code}`);

        const result = await sandboxManager.executeJs(code);
        if (result.success) {
          if (result.logs.length > 0) {
            for (const log of result.logs) {
              this.appendLog('log', log);
            }
          }
          if (result.result !== undefined) {
            this.appendLog('return', `← ${this.formatOutput(result.result)} (${result.durationMs}ms)`);
          }
        } else {
          this.appendLog('error', `✖ ${result.error}`);
        }
      } else if (e.key === 'ArrowUp') {
        if (this.commandHistory.length > 0 && this.historyIndex > 0) {
          this.historyIndex--;
          this.inputEl!.value = this.commandHistory[this.historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        if (this.historyIndex < this.commandHistory.length - 1) {
          this.historyIndex++;
          this.inputEl!.value = this.commandHistory[this.historyIndex];
        } else {
          this.historyIndex = this.commandHistory.length;
          this.inputEl!.value = '';
        }
      }
    });
  }

  public appendLog(type: string, text: string): void {
    if (!this.logOutput) return;

    const row = document.createElement('div');
    row.className = `term-line ${type}`;

    const time = new Date().toLocaleTimeString();
    row.innerHTML = `<span class="term-time">[${time}]</span> <span class="term-text">${this.escapeHtml(text)}</span>`;

    this.logOutput.appendChild(row);
    this.logOutput.scrollTop = this.logOutput.scrollHeight;
  }

  public appendSystemLog(text: string): void {
    this.appendLog('system', text);
  }

  private formatOutput(val: unknown): string {
    if (typeof val === 'object' && val !== null) {
      try {
        return JSON.stringify(val, null, 2);
      } catch {
        return String(val);
      }
    }
    return String(val);
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
