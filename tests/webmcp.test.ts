import { describe, it, expect, beforeEach } from 'vitest';
import { WebMcpService } from '../src/core/webmcp-service';
import { vfs } from '../src/core/vfs';

describe('WebMcpService & fastwebmcp tools', () => {
  let service: WebMcpService;

  beforeEach(() => {
    const g = globalThis as any;
    if (typeof g.window === 'undefined') {
      g.window = g;
    }
    if (typeof g.document === 'undefined') {
      g.document = {};
    }
    // Clear and prepare VFS
    vfs.createFile('/index.html', '<h1>Hello WebMCP</h1>', true);
    vfs.createFile('/src/main.js', 'console.log("running");', true);
    service = new WebMcpService();
  });

  it('registers all 11 core IDE & Git tools', () => {
    const tools = service.getRegisteredTools();
    const toolNames = tools.map((t) => t.name);

    expect(toolNames).toContain('ide_get_active_file');
    expect(toolNames).toContain('ide_list_files');
    expect(toolNames).toContain('ide_read_file');
    expect(toolNames).toContain('ide_write_file');
    expect(toolNames).toContain('ide_delete_file');
    expect(toolNames).toContain('ide_execute_code');
    expect(toolNames).toContain('ide_search_files');
    expect(toolNames).toContain('ide_get_workspace_summary');
    expect(toolNames).toContain('git_status');
    expect(toolNames).toContain('git_commit');
    expect(toolNames).toContain('git_log');
  });

  it('executes ide_list_files tool successfully', async () => {
    const result: any = await service.executeTool('ide_list_files', {});
    expect(result.totalFiles).toBeGreaterThanOrEqual(2);
    expect(result.files.some((f: any) => f.path === '/index.html')).toBe(true);
  });

  it('executes ide_read_file and throws on non-existent file', async () => {
    const readResult: any = await service.executeTool('ide_read_file', {
      path: '/index.html',
    });
    expect(readResult.content).toBe('<h1>Hello WebMCP</h1>');

    await expect(
      service.executeTool('ide_read_file', { path: '/does-not-exist.txt' })
    ).rejects.toThrow();
  });

  it('executes ide_write_file and writes content into VFS', async () => {
    const writeResult: any = await service.executeTool('ide_write_file', {
      path: '/created-by-tool.txt',
      content: 'Tool content',
    });
    expect(writeResult.success).toBe(true);
    expect(vfs.readFile('/created-by-tool.txt')).toBe('Tool content');
  });

  it('executes ide_search_files and returns matches', async () => {
    const searchResult: any = await service.executeTool('ide_search_files', {
      query: 'running',
    });
    expect(searchResult.totalMatches).toBe(1);
    expect(searchResult.matches[0].file).toBe('/src/main.js');
  });

  it('formats schema validation errors according to MCP protocol -32602 (TC-MCP-02)', async () => {
    // Missing required parameter 'path'
    await expect(
      service.executeTool('ide_read_file', {} as any)
    ).rejects.toThrow(/\[MCP -32602 INVALID_PARAMS\]/);
  });

  it('records execution logs for audit', async () => {
    await service.executeTool('ide_list_files', {});
    const logs = service.getExecutionLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].toolName).toBe('ide_list_files');
    expect(logs[0].status).toBe('success');
  });

  it('exposes public bridge with executeTool on document.modelContext, window.modelContext, and window.webmcp', async () => {
    const docContext = (globalThis as any).document.modelContext;
    const winContext = (globalThis as any).window.modelContext;
    const webmcpHelper = (globalThis as any).window.webmcp;

    expect(typeof docContext.executeTool).toBe('function');
    expect(typeof winContext.executeTool).toBe('function');
    expect(typeof webmcpHelper.invoke).toBe('function');
    expect(typeof docContext.getTools).toBe('function');

    const listRes: any = await docContext.executeTool('ide_list_files', {});
    expect(listRes.totalFiles).toBeGreaterThanOrEqual(2);

    const winRes: any = await winContext.executeTool('ide_read_file', { path: '/index.html' });
    expect(winRes.content).toBe('<h1>Hello WebMCP</h1>');

    const invokeRes: any = await webmcpHelper.invoke('ide_get_workspace_summary', {});
    expect(invokeRes.totalFiles).toBeGreaterThanOrEqual(2);
  });

  it('executes git tools via WebMCP (git_status, git_commit, git_log)', async () => {
    const statusRes: any = await service.executeTool('git_status', {});
    expect(statusRes).toBeDefined();
    expect(statusRes.branch).toBe('main');

    // Modify a file to have changes to commit
    vfs.writeFile('/index.html', '<h1>Updated for Git WebMCP test</h1>');
    const commitRes: any = await service.executeTool('git_commit', {
      message: 'test: commit via WebMCP tool',
      author: 'Agent <agent@webmcp.ai>',
    });
    expect(commitRes.success).toBe(true);
    expect(commitRes.hash).toHaveLength(40);

    const logRes: any = await service.executeTool('git_log', { limit: 5 });
    expect(logRes.commits.length).toBeGreaterThanOrEqual(1);
    expect(logRes.commits[0].message).toBe('test: commit via WebMCP tool');
  });
});
