import { describe, it, expect, beforeEach } from 'vitest';
import { SandboxManager } from '../src/core/sandbox';
import { vfs } from '../src/core/vfs';

describe('SandboxManager', () => {
  let sandbox: SandboxManager;

  beforeEach(() => {
    sandbox = new SandboxManager();
  });

  it('executes JavaScript expressions and captures return value', async () => {
    const res = await sandbox.executeJs('return 10 * 5;');
    expect(res.success).toBe(true);
    expect(res.result).toBe(50);
  });

  it('captures console.log output during execution', async () => {
    const res = await sandbox.executeJs('console.log("test-log-1"); console.warn("test-warn"); return true;');
    expect(res.success).toBe(true);
    expect(res.logs).toContain('test-log-1');
    expect(res.logs).toContain('[WARN] test-warn');
  });

  it('handles execution runtime errors gracefully (TC-EXEC-03)', async () => {
    const res = await sandbox.executeJs('throw new Error("Sandbox test error");');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Sandbox test error');
  });

  it('terminates execution when timeout is exceeded (TC-EXEC-04)', async () => {
    const res = await sandbox.executeJs('await new Promise(r => setTimeout(r, 200));', 50);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Tiempo de ejecución excedido');
  });

  it('generates preview HTML with error banner and inlines linked CSS and JS (TC-EXEC-02)', () => {
    vfs.createFile('/index.html', '<!DOCTYPE html><html><head><link rel="stylesheet" href="./style.css"></head><body><h1>Hi</h1><script src="./app.js"></script></body></html>', true);
    vfs.createFile('/style.css', 'body { color: red; }', true);
    vfs.createFile('/app.js', 'console.log("preview running");', true);

    const html = sandbox.generatePreviewHtml();
    expect(html).toContain('<style data-inlined-from="/style.css">');
    expect(html).toContain('body { color: red; }');
    expect(html).toContain('<script data-inlined-from="/app.js">');
    expect(html).toContain('console.log("preview running");');
    expect(html).toContain('__webmcp_error_banner__');
    expect(html).toContain('webmcp-sandbox');
  });
});
