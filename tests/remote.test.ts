import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RemoteSyncService } from '../src/core/remote-sync';
import { vfs } from '../src/core/vfs';

describe('RemoteSyncService (GitHub & Codeberg Remote Sync)', () => {
  let service: RemoteSyncService;

  beforeEach(() => {
    // Reset VFS
    vfs.createFile('/index.html', '<h1>Remote Sync Test</h1>', true);
    vfs.createFile('/src/index.js', 'console.log("sync");', true);

    service = new RemoteSyncService();
    service.clearConfig();
    vi.restoreAllMocks();
  });

  it('sets and retrieves remote configuration cleanly', () => {
    service.setConfig({
      provider: 'github',
      repo: 'MauricioPerera/webmcp-code-studio',
      branch: 'main',
      token: 'ghp_secret_token_123',
    });

    const config = service.getConfig();
    expect(config).not.toBeNull();
    expect(config?.provider).toBe('github');
    expect(config?.repo).toBe('MauricioPerera/webmcp-code-studio');
    expect(config?.branch).toBe('main');
    expect(config?.token).toBe('ghp_secret_token_123');
  });

  it('rejects invalid repo formats without slash', () => {
    expect(() => {
      service.setConfig({
        repo: 'invalid-repo-without-slash',
      });
    }).toThrow('El repositorio debe tener el formato "usuario/repositorio"');
  });

  it('clears remote configuration', () => {
    service.setConfig({
      repo: 'test/repo',
      token: 'token123',
    });
    expect(service.getConfig()).not.toBeNull();

    service.clearConfig();
    expect(service.getConfig()).toBeNull();
  });

  it('throws error when pushing without token', async () => {
    service.setConfig({
      provider: 'github',
      repo: 'test/repo',
    });

    await expect(service.push({ message: 'Push without token' })).rejects.toThrow(
      'Se requiere un Personal Access Token'
    );
  });

  it('pushes to GitHub successfully via mocked Git Database REST API', async () => {
    service.setConfig({
      provider: 'github',
      repo: 'user/my-repo',
      branch: 'main',
      token: 'ghp_valid_mock_token',
    });

    // Mock global fetch
    const fetchMock = vi.fn().mockImplementation((url: string, opts: any) => {
      if (url.includes('/git/ref')) {
        if (opts?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ object: { sha: 'commit_sha_mock_999' } }),
          });
        }
        // GET ref
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ object: { sha: 'parent_sha_mock_111' } }),
        });
      }
      if (url.includes('/git/commits/parent_sha_mock_111')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ tree: { sha: 'base_tree_sha_000' } }),
        });
      }
      if (url.includes('/git/trees')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({ sha: 'new_tree_sha_222' }),
        });
      }
      if (url.includes('/git/commits')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({ sha: 'commit_sha_mock_999' }),
        });
      }
      return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found', json: async () => ({}) });
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await service.push({ message: 'feat: automated remote push' });
    expect(result.success).toBe(true);
    expect(result.provider).toBe('github');
    expect(result.commitSha).toBe('commit_sha_mock_999');
    expect(result.url).toBe('https://github.com/user/my-repo/commit/commit_sha_mock_999');
    expect(result.filesCount).toBeGreaterThanOrEqual(2);
  });

  it('pulls from GitHub successfully and updates VFS', async () => {
    service.setConfig({
      provider: 'github',
      repo: 'user/my-repo',
      branch: 'main',
      token: 'ghp_valid_mock_token',
    });

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/git/trees/main?recursive=1')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            tree: [
              { path: 'pulled-remote.txt', type: 'blob', sha: 'blob_sha_123' },
            ],
          }),
        });
      }
      if (url.includes('/git/blobs/blob_sha_123')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            encoding: 'utf-8',
            content: 'Hello from GitHub Remote!',
          }),
        });
      }
      return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found', json: async () => ({}) });
    });

    vi.stubGlobal('fetch', fetchMock);

    const pullResult = await service.pull({ branch: 'main' });
    expect(pullResult.success).toBe(true);
    expect(pullResult.filesUpdated).toBe(1);

    expect(vfs.exists('/pulled-remote.txt')).toBe(true);
    expect(vfs.readFile('/pulled-remote.txt')).toBe('Hello from GitHub Remote!');
  });
});
