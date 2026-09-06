import { webMcpService } from '../core/webmcp-service';
import { eventBus } from '../core/event-bus';
import { WebMcpToolMetadata } from '../core/types';

export class WebMcpPanelView {
  private container: HTMLElement | null = null;
  private selectedToolName: string = 'ide_list_files';

  constructor() {
    this.setupListeners();
  }

  public init(): void {
    this.container = document.getElementById('webmcp-panel-body');
    this.render();
  }

  private setupListeners(): void {
    eventBus.on('webmcp:tools_updated', () => this.render());
    eventBus.on('webmcp:log', () => this.renderLogs());
    eventBus.on('webmcp:log_update', () => this.renderLogs());
  }

  public render(): void {
    if (!this.container) return;

    const isNative = webMcpService.getIsNativeSupported();
    const tools = webMcpService.getRegisteredTools();

    // Update header badge
    const headerDot = document.getElementById('header-status-dot');
    const headerText = document.getElementById('header-status-text');
    const countBadge = document.getElementById('webmcp-tool-count-badge');
    const statusLabel = document.getElementById('status-webmcp-label');

    if (headerDot && headerText) {
      if (isNative) {
        headerDot.className = 'status-dot success';
        headerText.textContent = 'WebMCP Nativo';
      } else {
        headerDot.className = 'status-dot warning';
        headerText.textContent = 'fastwebmcp Mock';
      }
    }
    if (countBadge) countBadge.textContent = String(tools.length);
    if (statusLabel) statusLabel.textContent = `WebMCP: ${tools.length} tools`;

    this.container.innerHTML = `
      <div class="webmcp-subnav">
        <button class="subnav-tab active" id="subtab-tools">Herramientas (${tools.length})</button>
        <button class="subnav-tab" id="subtab-agent">Agente IA</button>
      </div>

      <!-- Tools Inspector View -->
      <div class="webmcp-tab-view active" id="view-mcp-tools">
        <div class="status-callout ${isNative ? 'success' : 'info'}">
          <div class="callout-title">
            <span>${isNative ? '🟢 document.modelContext detectado' : '⚡ fastwebmcp Activo (Fallback Seguro)'}</span>
          </div>
          <p class="callout-desc">
            ${
              isNative
                ? 'El navegador soporta WebMCP nativamente. Las herramientas están expuestas directamente a agentes del sistema.'
                : 'WebMCP ejecutándose con ergonomía FastMCP. Totalmente interactivo en el IDE mediante polyfill local.'
            }
          </p>
        </div>

        <div class="tools-selector-section">
          <label class="form-label">Herramienta seleccionada:</label>
          <select id="select-tool" class="vscode-select">
            ${tools
              .map(
                (t) =>
                  `<option value="${t.name}" ${t.name === this.selectedToolName ? 'selected' : ''}>${t.name} ${t.readOnlyHint ? '(solo lectura)' : ''}</option>`
              )
              .join('')}
          </select>
        </div>

        <div id="tool-details-container">
          <!-- Rendered dynamically -->
        </div>

        <div class="tool-executor-section">
          <div class="executor-header">
            <span class="form-label">Argumentos (JSON):</span>
            <button class="btn-secondary mini-btn" id="btn-reset-args">Por defecto</button>
          </div>
          <textarea id="tool-args-input" class="vscode-textarea" rows="4"></textarea>
          <button class="btn-primary full-width" id="btn-execute-tool">
            <span>⚡ Ejecutar Herramienta</span>
          </button>
        </div>

        <div class="tool-result-section">
          <span class="form-label">Resultado:</span>
          <pre class="code-result-block" id="tool-result-display">// El resultado de la ejecución aparecerá aquí</pre>
        </div>
      </div>

      <!-- AI Agent View -->
      <div class="webmcp-tab-view" id="view-mcp-agent">
        <div class="agent-prompt-section">
          <p class="agent-intro">
            El Agente IA puede inspeccionar y manipular el proyecto ejecutando herramientas WebMCP en bucle.
          </p>
          <div class="form-group">
            <label class="form-label">Proveedor / API Key (opcional):</label>
            <input type="password" id="agent-api-key" class="vscode-input" placeholder="Google Gemini / OpenAI API Key (opcional)">
          </div>
          <div class="form-group">
            <label class="form-label">Instrucción para el Agente:</label>
            <textarea id="agent-user-prompt" class="vscode-textarea" rows="3" placeholder="Ej: Crea un archivo /src/math.js con una función fibonacci y su prueba en /tests/math.test.js"></textarea>
          </div>
          <button class="btn-primary full-width" id="btn-run-agent">
            <span>🤖 Ejecutar Agente</span>
          </button>
        </div>
        <div class="agent-log-section">
          <span class="form-label">Historial de pasos del Agente:</span>
          <div class="agent-history-box" id="agent-history-box">
            <div class="agent-step info">Listo para recibir instrucciones.</div>
          </div>
        </div>
      </div>
    `;

    this.bindSubnavTabs();
    this.renderToolDetails();
    this.bindToolActions();
    this.bindAgentActions();
  }

  private bindSubnavTabs(): void {
    const tabTools = document.getElementById('subtab-tools');
    const tabAgent = document.getElementById('subtab-agent');
    const viewTools = document.getElementById('view-mcp-tools');
    const viewAgent = document.getElementById('view-mcp-agent');

    tabTools?.addEventListener('click', () => {
      tabTools.classList.add('active');
      tabAgent?.classList.remove('active');
      viewTools?.classList.add('active');
      viewAgent?.classList.remove('active');
    });

    tabAgent?.addEventListener('click', () => {
      tabAgent.classList.add('active');
      tabTools?.classList.remove('active');
      viewAgent?.classList.add('active');
      viewTools?.classList.remove('active');
    });
  }

  private renderToolDetails(): void {
    const detailsContainer = document.getElementById('tool-details-container');
    const argsInput = document.getElementById('tool-args-input') as HTMLTextAreaElement;
    if (!detailsContainer || !argsInput) return;

    const tool = webMcpService.getToolMetadata(this.selectedToolName);
    if (!tool) {
      detailsContainer.innerHTML = '<p class="muted">Herramienta no encontrada.</p>';
      return;
    }

    detailsContainer.innerHTML = `
      <div class="tool-meta-card">
        <div class="tool-desc">${tool.description}</div>
        <div class="tool-params-list">
          <strong>Parámetros (${tool.parameters.length}):</strong>
          ${
            tool.parameters.length === 0
              ? '<span class="muted"> Ninguno</span>'
              : tool.parameters
                  .map(
                    (p) =>
                      `<div class="param-row"><code>${p.name}</code>: <span class="param-type">${p.type}</span> ${
                        p.required ? '<span class="required">*</span>' : ''
                      } - ${p.description}</div>`
                  )
                  .join('')
          }
        </div>
      </div>
    `;

    // Populate default JSON args
    const defaultArgs: Record<string, any> = {};
    for (const p of tool.parameters) {
      if (p.name === 'path') defaultArgs[p.name] = '/index.html';
      else if (p.name === 'content') defaultArgs[p.name] = '// Nuevo código';
      else if (p.name === 'code') defaultArgs[p.name] = 'console.log("Ejecutando desde WebMCP"); return 42;';
      else if (p.name === 'query') defaultArgs[p.name] = 'function';
      else if (p.type === 'string') defaultArgs[p.name] = '';
      else if (p.type === 'boolean') defaultArgs[p.name] = false;
      else if (p.type === 'number') defaultArgs[p.name] = 0;
      else defaultArgs[p.name] = null;
    }

    argsInput.value = JSON.stringify(defaultArgs, null, 2);
  }

  private bindToolActions(): void {
    const select = document.getElementById('select-tool') as HTMLSelectElement;
    const executeBtn = document.getElementById('btn-execute-tool');
    const resetBtn = document.getElementById('btn-reset-args');
    const argsInput = document.getElementById('tool-args-input') as HTMLTextAreaElement;
    const resultDisplay = document.getElementById('tool-result-display');

    select?.addEventListener('change', () => {
      this.selectedToolName = select.value;
      this.renderToolDetails();
    });

    resetBtn?.addEventListener('click', () => {
      this.renderToolDetails();
    });

    executeBtn?.addEventListener('click', async () => {
      if (!resultDisplay || !argsInput) return;

      let parsedArgs: Record<string, any> = {};
      try {
        const text = argsInput.value.trim();
        parsedArgs = text ? JSON.parse(text) : {};
      } catch (err: any) {
        resultDisplay.textContent = `[Error de sintaxis JSON]\n${err.message}`;
        resultDisplay.className = 'code-result-block error';
        return;
      }

      executeBtn.setAttribute('disabled', 'true');
      resultDisplay.textContent = '// Ejecutando herramienta...';
      resultDisplay.className = 'code-result-block';

      try {
        const result = await webMcpService.executeTool(this.selectedToolName, parsedArgs);
        resultDisplay.textContent = JSON.stringify(result, null, 2);
        resultDisplay.className = 'code-result-block success';
      } catch (err: any) {
        resultDisplay.textContent = `[Error en ejecución]\n${err.message}`;
        resultDisplay.className = 'code-result-block error';
      } finally {
        executeBtn.removeAttribute('disabled');
      }
    });
  }

  private bindAgentActions(): void {
    const runBtn = document.getElementById('btn-run-agent');
    const promptInput = document.getElementById('agent-user-prompt') as HTMLTextAreaElement;
    const historyBox = document.getElementById('agent-history-box');

    runBtn?.addEventListener('click', async () => {
      const prompt = promptInput?.value.trim();
      if (!prompt || !historyBox) return;

      runBtn.setAttribute('disabled', 'true');
      historyBox.innerHTML += `<div class="agent-step user"><strong>Usuario:</strong> ${this.escapeHtml(prompt)}</div>`;
      historyBox.innerHTML += `<div class="agent-step thinking">Analizando requerimiento con herramientas WebMCP...</div>`;
      historyBox.scrollTop = historyBox.scrollHeight;

      // Simulated automated agent workflow or API invocation
      try {
        // Step 1: List files
        const listResult: any = await webMcpService.executeTool('ide_list_files', {});
        historyBox.innerHTML += `<div class="agent-step tool">⚡ Invocado <code>ide_list_files</code> (${listResult.totalFiles} archivos encontrados).</div>`;

        // Check if user requested creating a file
        if (prompt.toLowerCase().includes('crea') || prompt.toLowerCase().includes('archivo') || prompt.toLowerCase().includes('escribe')) {
          const samplePath = '/src/agent-generated.js';
          const sampleContent = `// Archivo generado automáticamente por el Agente WebMCP\n// Instrucción: ${prompt}\n\nexport function example() {\n  return "Hola desde WebMCP Code Studio!";\n}\n`;

          await webMcpService.executeTool('ide_write_file', {
            path: samplePath,
            content: sampleContent,
          });
          historyBox.innerHTML += `<div class="agent-step tool success">⚡ Invocado <code>ide_write_file</code> en <code>${samplePath}</code>.</div>`;
          historyBox.innerHTML += `<div class="agent-step assistant"><strong>Agente:</strong> He creado el archivo <code>${samplePath}</code> con la función requerida. Ya puedes verlo en el explorador y en las pestañas del editor.</div>`;
        } else {
          // General summary
          const summary: any = await webMcpService.executeTool('ide_get_workspace_summary', {});
          historyBox.innerHTML += `<div class="agent-step tool">⚡ Invocado <code>ide_get_workspace_summary</code>.</div>`;
          historyBox.innerHTML += `<div class="agent-step assistant"><strong>Agente:</strong> He analizado el workspace (${summary.totalFiles} archivos, ${summary.totalBytes} bytes). ¿Deseas que agregue una nueva función o pruebe algún script en el sandbox?</div>`;
        }
      } catch (err: any) {
        historyBox.innerHTML += `<div class="agent-step error">Error en ejecución del agente: ${err.message}</div>`;
      } finally {
        runBtn.removeAttribute('disabled');
        historyBox.scrollTop = historyBox.scrollHeight;
      }
    });
  }

  private renderLogs(): void {
    const auditOutput = document.getElementById('webmcp-audit-output');
    if (!auditOutput) return;

    const logs = webMcpService.getExecutionLogs();
    if (logs.length === 0) return;

    auditOutput.innerHTML = logs
      .map((log) => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        return `
        <div class="log-entry ${log.status}">
          <span class="log-time">[${time}]</span>
          <span class="log-tool">⚡ ${log.toolName}</span>
          <span class="log-status badge-${log.status}">${log.status}</span>
          <pre class="log-details">${JSON.stringify(log.args)} -> ${log.error ? log.error : JSON.stringify(log.result)}</pre>
        </div>
      `;
      })
      .join('');
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

export const webMcpPanelView = new WebMcpPanelView();
