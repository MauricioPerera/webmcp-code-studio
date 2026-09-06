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

  it('registers all 17 core IDE, Git Remote & Terminal tools', () => {
    const tools = service.getRegisteredTools();
    const toolNames = tools.map((t) => t.name);

    expect(toolNames).toHaveLength(17);
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
    expect(toolNames).toContain('git_diff');
    expect(toolNames).toContain('git_branch');
    expect(toolNames).toContain('git_remote_config');
    expect(toolNames).toContain('git_remote_push');
    expect(toolNames).toContain('git_remote_pull');
    expect(toolNames).toContain('ide_terminal_exec');
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

  it('executes git_diff and git_branch via WebMCP', async () => {
    // 1. Modify a file
    vfs.writeFile('/index.html', '<h1>Changed for git_diff</h1>');

    // 2. Query git_diff for single file
    const fileDiff: any = await service.executeTool('git_diff', { path: '/index.html' });
    expect(fileDiff.path).toBe('/index.html');
    expect(fileDiff.hasChanges).toBe(true);
    expect(fileDiff.diff).toContain('--- a/index.html');
    expect(fileDiff.diff).toContain('+<h1>Changed for git_diff</h1>');

    // 3. Query git_diff for whole workspace
    const allDiff: any = await service.executeTool('git_diff', {});
    expect(allDiff.totalModifiedFiles).toBeGreaterThanOrEqual(1);
    expect(allDiff.diff).toContain('--- a/index.html');

    // 4. Test git_branch 'list'
    const listBranch: any = await service.executeTool('git_branch', { action: 'list' });
    expect(listBranch.currentBranch).toBe('main');
    expect(listBranch.branches).toContain('main');

    // 5. Test git_branch 'create'
    const createBranch: any = await service.executeTool('git_branch', {
      action: 'create',
      name: 'feat-webmcp-agent',
    });
    expect(createBranch.success).toBe(true);
    expect(createBranch.createdBranch).toBe('feat-webmcp-agent');

    // 6. Test git_branch 'switch'
    const switchBranch: any = await service.executeTool('git_branch', {
      action: 'switch',
      name: 'feat-webmcp-agent',
    });
    expect(switchBranch.success).toBe(true);
    expect(switchBranch.currentBranch).toBe('feat-webmcp-agent');
  });

  it('executes git_remote_config via WebMCP', async () => {
    // 1. Set config
    const setRes: any = await service.executeTool('git_remote_config', {
      action: 'set',
      provider: 'github',
      repo: 'MauricioPerera/webmcp-code-studio',
      branch: 'main',
      token: 'ghp_agent_mock_token',
    });
    expect(setRes.success).toBe(true);
    expect(setRes.config.provider).toBe('github');
    expect(setRes.config.repo).toBe('MauricioPerera/webmcp-code-studio');
    expect(setRes.config.hasToken).toBe(true);

    // 2. Get config
    const getRes: any = await service.executeTool('git_remote_config', {
      action: 'get',
    });
    expect(getRes.configured).toBe(true);
    expect(getRes.config.repo).toBe('MauricioPerera/webmcp-code-studio');

    // 3. Clear config
    const clearRes: any = await service.executeTool('git_remote_config', {
      action: 'clear',
    });
    expect(clearRes.success).toBe(true);

    const checkRes: any = await service.executeTool('git_remote_config', {
      action: 'get',
    });
    expect(checkRes.configured).toBe(false);
  });

  it('executes ide_terminal_exec via WebMCP', async () => {
    const res: any = await service.executeTool('ide_terminal_exec', {
      command: 'echo "hello from webmcp terminal tool" > /terminal-test.txt',
    });
    expect(res.exitCode).toBe(0);

    const catRes: any = await service.executeTool('ide_terminal_exec', {
      command: 'cat /terminal-test.txt | grep webmcp',
    });
    expect(catRes.exitCode).toBe(0);
    expect(catRes.stdout).toContain('hello from webmcp terminal tool');
  });
});
