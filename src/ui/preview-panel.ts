import { sandboxManager } from '../core/sandbox';
import { eventBus } from '../core/event-bus';

export class PreviewPanelView {
  private iframe: HTMLIFrameElement | null = null;
  private refreshBtn: HTMLElement | null = null;

  constructor() {
    this.setupListeners();
  }

  public init(): void {
    this.iframe = document.getElementById('sandbox-iframe') as HTMLIFrameElement;
    this.refreshBtn = document.getElementById('btn-refresh-preview');

    if (this.iframe) {
      sandboxManager.setIframe(this.iframe);
      sandboxManager.updatePreview();
    }

    this.refreshBtn?.addEventListener('click', () => {
      sandboxManager.updatePreview();
    });

    document.getElementById('btn-run-preview')?.addEventListener('click', () => {
      // Switch bottom panel to preview and refresh
      const tabPreview = document.getElementById('tab-preview');
      tabPreview?.click();
      sandboxManager.updatePreview();
    });
  }

  private setupListeners(): void {
    // Auto-update preview when saving files
    eventBus.on('editor:file_saved', () => {
      sandboxManager.updatePreview();
    });

    eventBus.on('vfs:reloaded', () => {
      sandboxManager.updatePreview();
    });
  }
}

export const previewPanelView = new PreviewPanelView();
