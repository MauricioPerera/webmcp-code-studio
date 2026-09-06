import { eventBus } from './event-bus';
import { vfs } from './vfs';

export interface ExecutionResult {
  success: boolean;
  result?: unknown;
  logs: string[];
  error?: string;
  durationMs: number;
}

export class SandboxManager {
  private iframe: HTMLIFrameElement | null = null;
  private messageListener: ((e: MessageEvent) => void) | null = null;

  constructor() {
    this.initMessageListener();
  }

  private initMessageListener(): void {
    if (typeof window === 'undefined') return;

    this.messageListener = (event: MessageEvent) => {
      if (event.data && event.data.source === 'webmcp-sandbox') {
        const { type, messages } = event.data;
        eventBus.emit('sandbox:log', { type, messages, timestamp: Date.now() });
      }
    };

    window.addEventListener('message', this.messageListener);
  }

  public setIframe(iframe: HTMLIFrameElement): void {
    this.iframe = iframe;
  }

  public generatePreviewHtml(): string {
    // Find entry html file
    let htmlContent = vfs.readFile('/index.html') || vfs.readFile('/public/index.html');

    if (!htmlContent) {
      // Find any html file
      const allFiles = vfs.listAllFiles();
      const anyHtml = allFiles.find((f) => f.path.endsWith('.html'));
      if (anyHtml) {
        htmlContent = anyHtml.content;
      } else {
        htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Vista Previa</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; color: #333; }
    .box { border: 1px dashed #ccc; border-radius: 8px; padding: 2rem; text-align: center; }
  </style>
</head>
<body>
  <div class="box">
    <h3>No se encontró un archivo index.html</h3>
    <p>Crea un archivo <code>index.html</code> en el explorador para ver la vista previa en vivo.</p>
  </div>
</body>
</html>`;
      }
    }

    // Injected bridge script to intercept console logs and errors
    const bridgeScript = `
<script>
  (function() {
    const _origLog = console.log;
    const _origWarn = console.warn;
    const _origError = console.error;
    const _origInfo = console.info;

    function sendLog(type, args) {
      try {
        const serialized = Array.from(args).map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            try { return JSON.stringify(arg); } catch (e) { return String(arg); }
          }
          return String(arg);
        });
        window.parent.postMessage({
          source: 'webmcp-sandbox',
          type: type,
          messages: serialized
        }, '*');
      } catch (e) {}
    }

    console.log = function(...args) { _origLog.apply(console, args); sendLog('log', args); };
    console.warn = function(...args) { _origWarn.apply(console, args); sendLog('warn', args); };
    console.error = function(...args) { _origError.apply(console, args); sendLog('error', args); };
    console.info = function(...args) { _origInfo.apply(console, args); sendLog('info', args); };

    window.addEventListener('error', function(err) {
      sendLog('error', [err.message + ' at ' + (err.filename || '') + ':' + (err.lineno || '')]);
    });

    window.addEventListener('unhandledrejection', function(err) {
      sendLog('error', ['Unhandled Promise Rejection: ' + String(err.reason)]);
    });
  })();
</script>`;

    // Inline CSS and JS if linked with relative paths
    let processedHtml = htmlContent;

    // Inline <link rel="stylesheet" href="...">
    processedHtml = processedHtml.replace(/<link\b([^>]+)>/gi, (match, attrs) => {
      const isStylesheet = /rel=["']stylesheet["']/i.test(attrs);
      const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
      if (isStylesheet && hrefMatch) {
        let cssPath = hrefMatch[1].trim();
        if (cssPath.startsWith('./')) {
          cssPath = cssPath.slice(1);
        }
        if (!cssPath.startsWith('/')) {
          cssPath = '/' + cssPath;
        }
        const cssContent = vfs.readFile(cssPath);
        if (cssContent !== null) {
          return `<style data-inlined-from="${cssPath}">\n${cssContent}\n</style>`;
        }
      }
      return match;
    });

    // Inline <script src="...">
    processedHtml = processedHtml.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs) => {
      const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
      if (srcMatch) {
        const src = srcMatch[1].trim();
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
          return match;
        }
        let jsPath = src.startsWith('./') ? src.slice(1) : src;
        if (!jsPath.startsWith('/')) {
          jsPath = '/' + jsPath;
        }
        const jsContent = vfs.readFile(jsPath);
        if (jsContent !== null) {
          return `<script data-inlined-from="${jsPath}">\n${jsContent}\n</script>`;
        }
      }
      return match;
    });

    // Inject bridge script at beginning of <head> or <html>
    if (processedHtml.includes('<head>')) {
      processedHtml = processedHtml.replace('<head>', '<head>' + bridgeScript);
    } else if (processedHtml.includes('<html>')) {
      processedHtml = processedHtml.replace('<html>', '<html><head>' + bridgeScript + '</head>');
    } else {
      processedHtml = bridgeScript + processedHtml;
    }

    return processedHtml;
  }

  public updatePreview(): void {
    if (!this.iframe) return;
    const html = this.generatePreviewHtml();
    this.iframe.srcdoc = html;
  }

  public async executeJs(code: string): Promise<ExecutionResult> {
    const logs: string[] = [];
    const startTime = performance.now();

    try {
      // Create isolated sandboxed execution function with console mock
      const customConsole = {
        log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
        warn: (...args: unknown[]) => logs.push('[WARN] ' + args.map(String).join(' ')),
        error: (...args: unknown[]) => logs.push('[ERROR] ' + args.map(String).join(' ')),
        info: (...args: unknown[]) => logs.push('[INFO] ' + args.map(String).join(' ')),
      };

      // Wrap code in an async function to support top-level await
      const runner = new Function(
        'console',
        'vfs',
        `return (async () => {
          ${code}
        })();`
      );

      const result = await runner(customConsole, vfs);
      const durationMs = Math.round(performance.now() - startTime);

      return {
        success: true,
        result,
        logs,
        durationMs,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logs.push(`[ERROR] ${errorMsg}`);
      const durationMs = Math.round(performance.now() - startTime);

      return {
        success: false,
        error: errorMsg,
        logs,
        durationMs,
      };
    }
  }
}

export const sandboxManager = new SandboxManager();
