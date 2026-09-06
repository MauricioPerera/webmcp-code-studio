import { describe, it, expect, beforeEach } from 'vitest';
import { vfs } from '../src/core/vfs';
import { GitVersionControl } from '../src/core/git-vcs';

describe('GitVersionControl (Client-Side VCS Engine)', () => {
  let git: GitVersionControl;

  beforeEach(() => {
    // Reset VFS state
    vfs.createFile('/index.html', '<h1>Initial Title</h1>', true);
    vfs.createFile('/app.js', 'console.log("hello");', true);
    git = new GitVersionControl();
    git.init();
  });

  it('creates initial commit when VFS has files', () => {
    const latest = git.getLatestCommit();
    expect(latest).not.toBeNull();
    expect(latest?.message).toContain('Initial commit');
    expect(latest?.snapshot['/index.html']).toBe('<h1>Initial Title</h1>');
  });

  it('reports 0 changes right after initial commit', () => {
    const status = git.getStatus();
    expect(status.totalChanges).toBe(0);
    expect(status.branch).toBe('main');
  });

  it('detects modified files (M)', () => {
    vfs.writeFile('/index.html', '<h1>Updated Title</h1>');
    const status = git.getStatus();
    expect(status.totalChanges).toBe(1);
    const mod = status.unstaged.find((c) => c.path === '/index.html');
    expect(mod).toBeDefined();
    expect(mod?.status).toBe('M');
  });

  it('detects added files (A)', () => {
    vfs.createFile('/src/utils.js', 'export const add = (a, b) => a + b;', true);
    const status = git.getStatus();
    const added = status.unstaged.find((c) => c.path === '/src/utils.js');
    expect(added).toBeDefined();
    expect(added?.status).toBe('A');
  });

  it('detects deleted files (D)', () => {
    vfs.deleteNode('/app.js');
    const status = git.getStatus();
    const del = status.unstaged.find((c) => c.path === '/app.js');
    expect(del).toBeDefined();
    expect(del?.status).toBe('D');
  });

  it('stages and unstages files cleanly', () => {
    vfs.writeFile('/index.html', '<h1>Stage Test</h1>');
    git.stageFile('/index.html');
    let status = git.getStatus();
    expect(status.staged.length).toBe(1);
    expect(status.unstaged.length).toBe(0);

    git.unstageFile('/index.html');
    status = git.getStatus();
    expect(status.staged.length).toBe(0);
    expect(status.unstaged.length).toBe(1);
  });

  it('creates commit and clears staging area', () => {
    vfs.writeFile('/index.html', '<h1>Committed Change</h1>');
    git.stageAll();
    const commit = git.commit('feat: update index title', 'Tester <test@webmcp.dev>');

    expect(commit.hash).toHaveLength(40);
    expect(commit.message).toBe('feat: update index title');
    expect(commit.author).toBe('Tester <test@webmcp.dev>');
    expect(commit.snapshot['/index.html']).toBe('<h1>Committed Change</h1>');

    const status = git.getStatus();
    expect(status.totalChanges).toBe(0);
    expect(status.staged.length).toBe(0);
  });

  it('throws when committing with empty message or no changes', () => {
    expect(() => git.commit('')).toThrow('El mensaje del commit no puede estar vacio.');
    expect(() => git.commit('no changes commit')).toThrow('No hay cambios');
  });

  it('retrieves commit log in reverse chronological order', () => {
    vfs.createFile('/step1.txt', '1', true);
    git.commit('commit 1');

    vfs.createFile('/step2.txt', '2', true);
    git.commit('commit 2');

    const log = git.getLog(10);
    expect(log.length).toBeGreaterThanOrEqual(3);
    expect(log[0].message).toBe('commit 2');
    expect(log[1].message).toBe('commit 1');
  });

  it('discards file changes restoring committed snapshot', () => {
    vfs.writeFile('/index.html', '<p>Dirty edit</p>');
    expect(vfs.readFile('/index.html')).toBe('<p>Dirty edit</p>');

    git.discardFileChanges('/index.html');
    expect(vfs.readFile('/index.html')).toBe('<h1>Initial Title</h1>');
    expect(git.getStatus().totalChanges).toBe(0);
  });

  it('handles branch creation and checkout with isolation', () => {
    git.createBranch('feature-login');
    expect(git.getBranches()).toContain('feature-login');

    git.checkoutBranch('feature-login');
    expect(git.getCurrentBranch()).toBe('feature-login');

    vfs.createFile('/login.html', '<h1>Login</h1>', true);
    git.commit('feat: add login page');

    expect(vfs.exists('/login.html')).toBe(true);

    // Switch back to main
    git.checkoutBranch('main');
    expect(git.getCurrentBranch()).toBe('main');
    expect(vfs.exists('/login.html')).toBe(false);
  });
});
