import { z } from 'zod';
import { registerTool, supportsWebMcp, createWebMcpMock } from 'fastwebmcp';
import { vfs } from './vfs';
import { gitVcs } from './git-vcs';
import { sandboxManager } from './sandbox';
import { eventBus } from './event-bus';
import { WebMcpToolMetadata, WebMcpExecutionLog } from './types';

export class WebMcpService {
  private registeredTools: Map<string, {
    metadata: WebMcpToolMetadata;
    execute: (args: any) => Promise<any>;
    schema: z.ZodTypeAny;
  }> = new Map();

  private executionLogs: WebMcpExecutionLog[] = [];
  private activeFilePath: string | null = null;
  private isNativeSupported: boolean = false;

  constructor() {
    this.initEnvironment();
    this.registerCoreTools();
    this.listenToEvents();
    this.exposePublicBridge();
  }

  private initEnvironment(): void {
    this.isNativeSupported = supportsWebMcp();

    // If browser/environment doesn't have document.modelContext natively, polyfill with createWebMcpMock
    const globalObj: any = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
    const docObj: any = typeof document !== 'undefined' ? document : (globalObj.document || null);

    if (docObj && !docObj.modelContext) {
      const mock = createWebMcpMock();
      docObj.modelContext = mock.document.modelContext;
    }
  }

  public exposePublicBridge(): void {
    const globalObj: any = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
    const docObj: any = typeof document !== 'undefined' ? document : (globalObj.document || null);

    const existingDocContext = docObj?.modelContext || {};
    const existingWinContext = globalObj.modelContext || {};

    const bridge = {
      registerTool: existingDocContext.registerTool || existingWinContext.registerTool || (() => {}),
      unregisterTool: (name: string) => {
        this.registeredTools.delete(name);
        eventBus.emit('webmcp:tools_updated', this.getRegisteredTools());
      },
      getTools: () => this.getRegisteredTools(),
      listTools: () => this.getRegisteredTools(),
      hasTool: (name: string) => this.registeredTools.has(name),
      executeTool: async (name: string, args: Record<string, unknown> = {}) => {
        return await this.executeTool(name, args);
      },
    };

    if (docObj) {
      docObj.modelContext = Object.assign(existingDocContext, bridge);
    }
    globalObj.modelContext = Object.assign(existingWinContext, bridge);
    globalObj.webmcp = {
      getTools: () => this.getRegisteredTools(),
      executeTool: async (name: string, args: Record<string, unknown> = {}) => this.executeTool(name, args),
      invoke: async (name: string, args: Record<string, unknown> = {}) => this.executeTool(name, args),
    };
  }

  private listenToEvents(): void {
    eventBus.on<string>('editor:file_opened', (path) => {
      this.activeFilePath = path;
    });
  }

  public getIsNativeSupported(): boolean {
    return this.isNativeSupported;
  }

  public getRegisteredTools(): WebMcpToolMetadata[] {
    return Array.from(this.registeredTools.values()).map((t) => t.metadata);
  }

  public getToolMetadata(toolName: string): WebMcpToolMetadata | undefined {
    return this.registeredTools.get(toolName)?.metadata;
  }

  public getExecutionLogs(): WebMcpExecutionLog[] {
    return [...this.executionLogs];
  }

  public registerCustomTool<T extends z.ZodTypeAny>(options: {
    name: string;
    description: string;
    inputSchema: T;
    execute: (args: z.infer<T>) => Promise<unknown>;
    parametersList: Array<{ name: string; type: string; description: string; required: boolean }>;
    readOnlyHint?: boolean;
  }): void {
    const { name, description, inputSchema, execute, parametersList, readOnlyHint } = options;

    // Register with fastwebmcp
    registerTool({
      name,
      description,
      inputSchema,
      execute,
      annotations: {
        readOnlyHint: readOnlyHint ?? false,
      },
    });

    const metadata: WebMcpToolMetadata = {
      name,
      description,
      parameters: parametersList,
      readOnlyHint,
    };

    this.registeredTools.set(name, {
      metadata,
      execute,
      schema: inputSchema,
    });

    this.exposePublicBridge();
    eventBus.emit('webmcp:tools_updated', this.getRegisteredTools());
  }

  public async executeTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const tool = this.registeredTools.get(toolName);
    if (!tool) {
      throw new Error(`WebMCP Tool "${toolName}" no está registrada.`);
    }

    const logId = Math.random().toString(36).substring(2, 9);
    const logEntry: WebMcpExecutionLog = {
      id: logId,
      toolName,
      timestamp: Date.now(),
      args,
      status: 'pending',
    };
    this.executionLogs.unshift(logEntry);
    eventBus.emit('webmcp:log', logEntry);

    try {
      // Validate schema with Zod
      const parsedArgs = tool.schema.parse(args);
      const result = await tool.execute(parsedArgs);

      logEntry.status = 'success';
      logEntry.result = result;
      eventBus.emit('webmcp:log_update', logEntry);
      return result;
    } catch (err: unknown) {
      let errorMsg: string;
      if (err instanceof z.ZodError) {
        const details = err.issues.map((i) => `[${i.path.join('.') || 'param'}]: ${i.message}`).join('; ');
        errorMsg = `[MCP -32602 INVALID_PARAMS] Parámetros inválidos para "${toolName}": ${details}`;
      } else {
        errorMsg = err instanceof Error ? err.message : String(err);
      }
      logEntry.status = 'error';
      logEntry.error = errorMsg;
      eventBus.emit('webmcp:log_update', logEntry);
      throw new Error(errorMsg);
    }
  }

  private registerCoreTools(): void {
    // 1. ide_get_active_file
    this.registerCustomTool({
      name: 'ide_get_active_file',
      description: 'Devuelve la ruta y contenido del archivo actualmente activo en el editor.',
      inputSchema: z.object({}),
      parametersList: [],
      readOnlyHint: true,
      execute: async () => {
        if (!this.activeFilePath) {
          return { active: false, message: 'Ningún archivo abierto en el editor.' };
        }
        const content = vfs.readFile(this.activeFilePath);
        return {
          active: true,
          path: this.activeFilePath,
          content: content ?? '',
        };
      },
    });

    // 2. ide_list_files
    this.registerCustomTool({
      name: 'ide_list_files',
      description: 'Lista todos los archivos existentes en el sistema de archivos virtual (VFS).',
      inputSchema: z.object({}),
      parametersList: [],
      readOnlyHint: true,
      execute: async () => {
        const files = vfs.listAllFiles().map((f) => ({
          path: f.path,
          sizeBytes: f.content.length,
          updatedAt: f.updatedAt,
        }));
        return {
          totalFiles: files.length,
          files,
        };
      },
    });

    // 3. ide_read_file
    this.registerCustomTool({
      name: 'ide_read_file',
      description: 'Lee el contenido de un archivo específico del proyecto en el VFS.',
      inputSchema: z.object({
        path: z.string().describe('Ruta del archivo a leer (ej: /index.html o /src/main.js)'),
      }),
      parametersList: [
        {
          name: 'path',
          type: 'string',
          description: 'Ruta absoluta en VFS (/index.html)',
          required: true,
        },
      ],
      readOnlyHint: true,
      execute: async ({ path }) => {
        const content = vfs.readFile(path);
        if (content === null) {
          throw new Error(`El archivo "${path}" no existe en el proyecto.`);
        }
        return {
          path: vfs.normalizePath(path),
          content,
        };
      },
    });

    // 4. ide_write_file
    this.registerCustomTool({
      name: 'ide_write_file',
      description: 'Crea o sobrescribe un archivo con nuevo código o contenido en el VFS.',
      inputSchema: z.object({
        path: z.string().describe('Ruta absoluta del archivo a crear/actualizar'),
        content: z.string().describe('Código o texto a escribir en el archivo'),
      }),
      parametersList: [
        { name: 'path', type: 'string', description: 'Ruta en VFS', required: true },
        { name: 'content', type: 'string', description: 'Contenido del archivo', required: true },
      ],
      readOnlyHint: false,
      execute: async ({ path, content }) => {
        vfs.writeFile(path, content);
        vfs.saveToStorage();
        // Trigger live preview update
        sandboxManager.updatePreview();
        return {
          success: true,
          path: vfs.normalizePath(path),
          bytesWritten: content.length,
        };
      },
    });

    // 5. ide_delete_file
    this.registerCustomTool({
      name: 'ide_delete_file',
      description: 'Elimina un archivo o directorio del sistema de archivos virtual.',
      inputSchema: z.object({
        path: z.string().describe('Ruta del archivo a eliminar'),
      }),
      parametersList: [
        { name: 'path', type: 'string', description: 'Ruta en VFS', required: true },
      ],
      readOnlyHint: false,
      execute: async ({ path }) => {
        const deleted = vfs.deleteNode(path);
        if (!deleted) {
          throw new Error(`No se pudo eliminar "${path}". Verifique que exista y no sea la raíz.`);
        }
        vfs.saveToStorage();
        return {
          success: true,
          deletedPath: vfs.normalizePath(path),
        };
      },
    });

    // 6. ide_execute_code
    this.registerCustomTool({
      name: 'ide_execute_code',
      description: 'Ejecuta un fragmento de código JavaScript de forma segura en el sandbox del navegador y devuelve los logs y resultado.',
      inputSchema: z.object({
        code: z.string().describe('Código JavaScript a evaluar (soporta async/await)'),
      }),
      parametersList: [
        { name: 'code', type: 'string', description: 'Código JavaScript a ejecutar', required: true },
      ],
      readOnlyHint: false,
      execute: async ({ code }) => {
        const res = await sandboxManager.executeJs(code);
        return res;
      },
    });

    // 7. ide_search_files
    this.registerCustomTool({
      name: 'ide_search_files',
      description: 'Busca texto o patrones regex en todos los archivos del proyecto.',
      inputSchema: z.object({
        query: z.string().describe('Texto o expresión a buscar'),
        isRegex: z.boolean().optional().describe('Si es true, interpreta query como regex'),
      }),
      parametersList: [
        { name: 'query', type: 'string', description: 'Término de búsqueda', required: true },
        { name: 'isRegex', type: 'boolean', description: 'Búsqueda por expresión regular', required: false },
      ],
      readOnlyHint: true,
      execute: async ({ query, isRegex }) => {
        const matches = vfs.searchFiles(query, isRegex ?? false);
        return {
          totalMatches: matches.length,
          matches,
        };
      },
    });

    // 8. ide_get_workspace_summary
    this.registerCustomTool({
      name: 'ide_get_workspace_summary',
      description: 'Devuelve un resumen del espacio de trabajo: total de archivos, extensiones, tamaño y archivo activo.',
      inputSchema: z.object({}),
      parametersList: [],
      readOnlyHint: true,
      execute: async () => {
        const files = vfs.listAllFiles();
        const extensions: Record<string, number> = {};
        let totalBytes = 0;

        for (const file of files) {
          totalBytes += file.content.length;
          const ext = file.name.includes('.') ? file.name.split('.').pop()! : 'other';
          extensions[ext] = (extensions[ext] || 0) + 1;
        }

        return {
          totalFiles: files.length,
          totalBytes,
          fileTypes: extensions,
          activeFile: this.activeFilePath,
          timestamp: Date.now(),
        };
      },
    });

    // 9. git_status
    this.registerCustomTool({
      name: 'git_status',
      description: 'Consulta el estado del repositorio Git: rama actual, archivos preparados (staged) y no preparados (unstaged) con estado M/A/D.',
      inputSchema: z.object({}),
      parametersList: [],
      readOnlyHint: true,
      execute: async () => {
        return gitVcs.getStatus();
      },
    });

    // 10. git_commit
    this.registerCustomTool({
      name: 'git_commit',
      description: 'Crea un commit atómico en la rama actual con los cambios preparados (o todos los cambios pendientes si no hay staged).',
      inputSchema: z.object({
        message: z.string().min(1, 'El mensaje del commit es requerido.'),
        author: z.string().optional(),
      }),
      parametersList: [
        { name: 'message', type: 'string', description: 'Mensaje descriptivo del commit.', required: true },
        { name: 'author', type: 'string', description: 'Nombre y correo del autor (opcional).', required: false },
      ],
      readOnlyHint: false,
      execute: async ({ message, author }) => {
        const commit = gitVcs.commit(message, author);
        return {
          success: true,
          hash: commit.hash,
          message: commit.message,
          author: commit.author,
          timestamp: commit.timestamp,
          branch: commit.branch,
        };
      },
    });

    // 11. git_log
    this.registerCustomTool({
      name: 'git_log',
      description: 'Obtiene el historial de commits recientes en la rama activa ordenados cronológicamente inverso.',
      inputSchema: z.object({
        limit: z.number().int().positive().optional().default(10),
      }),
      parametersList: [
        { name: 'limit', type: 'number', description: 'Cantidad máxima de commits a retornar (por defecto 10).', required: false },
      ],
      readOnlyHint: true,
      execute: async ({ limit }) => {
        const commits = gitVcs.getLog(limit);
        return {
          branch: gitVcs.getCurrentBranch(),
          total: commits.length,
          commits: commits.map((c) => ({
            hash: c.hash,
            parentHash: c.parentHash,
            message: c.message,
            author: c.author,
            timestamp: c.timestamp,
            branch: c.branch,
          })),
        };
      },
    });
  }
}

export const webMcpService = new WebMcpService();
