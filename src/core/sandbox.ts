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
    let htmlContent = vfs.readFile('/index.html') || vfs.readFile('/public/index.html');

    if (!htmlContent) {
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

    // Injected bridge script with visual error banner and console bridge
    const bridgeScript = `
<div id="__webmcp_error_banner__" style="display:none; position:fixed; top:0; left:0; right:0; background:#f14c4c; color:#fff; padding:10px 14px; font-family:-apple-system,BlinkMacSystemFont,sans-serif; font-size:12px; z-index:999999; box-shadow:0 3px 10px rgba(0,0,0,0.4); border-bottom:2px solid #b71c1c;">
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <span><strong>⚠️ Error en Vista Previa:</strong> <span id="__webmcp_error_text__"></span></span>
    <button onclick="document.getElementById('__webmcp_error_banner__').style.display='none'" style="background:none; border:none; color:#fff; font-size:16px; cursor:pointer; padding:0 4px;">&times;</button>
  </div>
</div>
<script>
  (function() {
    const _origLog = console.log;
    const _origWarn = console.warn;
    const _origError = console.error;
    const _origInfo = console.info;

    function showBanner(msg) {
      try {
        const banner = document.getElementById('__webmcp_error_banner__');
        const text = document.getElementById('__webmcp_error_text__');
        if (banner && text) {
          text.textContent = msg;
          banner.style.display = 'block';
        }
      } catch (e) {}
    }

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
      const msg = (err.message || 'Error desconocido') + (err.lineno ? ' (línea ' + err.lineno + ')' : '');
      showBanner(msg);
      sendLog('error', [msg]);
    });

    window.addEventListener('unhandledrejection', function(err) {
      const msg = 'Promesa rechazada: ' + (err.reason ? (err.reason.message || String(err.reason)) : 'desconocida');
      showBanner(msg);
      sendLog('error', [msg]);
    });
  })();
</script>`;

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

  public async executeJs(code: string, timeoutMs: number = 3000): Promise<ExecutionResult> {
    const logs: string[] = [];
    const startTime = performance.now();

    // In browser with Web Worker support: use Worker with termination watchdog
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
      return new Promise<ExecutionResult>((resolve) => {
        let finished = false;
        let worker: Worker | null = null;

        const timer = setTimeout(() => {
          if (!finished) {
            finished = true;
            if (worker) {
              worker.terminate();
            }
            const durationMs = Math.round(performance.now() - startTime);
            resolve({
              success: false,
              error: `Tiempo de ejecución excedido (Watchdog: bucle infinito o tarea bloqueante detectada tras ${timeoutMs}ms)`,
              logs,
              durationMs,
            });
          }
        }, timeoutMs);

        try {
          const workerSource = `
            self.onmessage = async function(e) {
              var code = e.data.code;
              var customLogs = [];
              var customConsole = {
                log: function() { var args = Array.prototype.slice.call(arguments); customLogs.push(args.join(' ')); },
                warn: function() { var args = Array.prototype.slice.call(arguments); customLogs.push('[WARN] ' + args.join(' ')); },
                error: function() { var args = Array.prototype.slice.call(arguments); customLogs.push('[ERROR] ' + args.join(' ')); },
                info: function() { var args = Array.prototype.slice.call(arguments); customLogs.push('[INFO] ' + args.join(' ')); }
              };
              try {
                var runner = new Function('console', 'return (async function() { ' + code + ' })();');
                var res = await runner(customConsole);
                self.postMessage({ success: true, result: res, logs: customLogs });
              } catch (err) {
                self.postMessage({ success: false, error: err instanceof Error ? err.message : String(err), logs: customLogs });
              }
            };
          `;
          const blob = new Blob([workerSource], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(blob);
          worker = new Worker(workerUrl);

          worker.onmessage = (event: MessageEvent) => {
            if (!finished) {
              finished = true;
              clearTimeout(timer);
              URL.revokeObjectURL(workerUrl);
              worker?.terminate();

              const durationMs = Math.round(performance.now() - startTime);
              resolve({
                success: event.data.success,
                result: event.data.result,
                logs: event.data.logs || [],
                error: event.data.error,
                durationMs,
              });
            }
          };

          worker.onerror = (err: ErrorEvent) => {
            if (!finished) {
              finished = true;
              clearTimeout(timer);
              URL.revokeObjectURL(workerUrl);
              worker?.terminate();

              const durationMs = Math.round(performance.now() - startTime);
              resolve({
                success: false,
                error: err.message || 'Error en Web Worker',
                logs,
                durationMs,
              });
            }
          };

          worker.postMessage({ code });
        } catch {
          // Fallback if Blob/Worker fails to construct
          clearTimeout(timer);
          this.executeJsInProcess(code, logs, startTime, timeoutMs).then(resolve);
        }
      });
    }

    // Direct in-process execution with Promise.race for Node / test environments
    return this.executeJsInProcess(code, logs, startTime, timeoutMs);
  }

  private async executeJsInProcess(
    code: string,
    logs: string[],
    startTime: number,
    timeoutMs: number
  ): Promise<ExecutionResult> {
    try {
      const customConsole = {
        log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
        warn: (...args: unknown[]) => logs.push('[WARN] ' + args.map(String).join(' ')),
        error: (...args: unknown[]) => logs.push('[ERROR] ' + args.map(String).join(' ')),
        info: (...args: unknown[]) => logs.push('[INFO] ' + args.map(String).join(' ')),
      };

      const runner = new Function(
        'console',
        'vfs',
        `return (async () => {
          ${code}
        })();`
      );

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Tiempo de ejecución excedido tras ${timeoutMs}ms`)), timeoutMs)
      );

      const result = await Promise.race([runner(customConsole, vfs), timeoutPromise]);
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
