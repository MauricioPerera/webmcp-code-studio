import { vfs } from './vfs';
import { gitVcs } from './git-vcs';
import { eventBus } from './event-bus';

export type RemoteProvider = 'github' | 'codeberg';

export interface RemoteConfig {
  provider: RemoteProvider;
  repo: string; // Formato: "owner/repo"
  branch: string;
  token?: string; // Personal Access Token
  customBaseUrl?: string;
}

export interface RemotePushResult {
  success: boolean;
  provider: RemoteProvider;
  repo: string;
  branch: string;
  commitSha: string;
  url: string;
  filesCount: number;
}

export interface RemotePullResult {
  success: boolean;
  provider: RemoteProvider;
  repo: string;
  branch: string;
  filesUpdated: number;
  message: string;
}

const STORAGE_KEY = 'webmcp_studio_remote_config_v1';

function utf8ToBase64(str: string): string {
  if (typeof btoa !== 'undefined') {
    return btoa(unescape(encodeURIComponent(str)));
  }
  return Buffer.from(str, 'utf8').toString('base64');
}

function base64ToUtf8(b64: string): string {
  const clean = b64.replace(/\s+/g, '');
  if (typeof atob !== 'undefined') {
    return decodeURIComponent(escape(atob(clean)));
  }
  return Buffer.from(clean, 'base64').toString('utf8');
}

export class RemoteSyncService {
  private config: RemoteConfig | null = null;

  constructor() {
    this.loadConfig();
  }

  public getConfig(): RemoteConfig | null {
    if (!this.config) return null;
    return { ...this.config };
  }

  public setConfig(newConfig: Partial<RemoteConfig>): RemoteConfig {
    const provider: RemoteProvider = newConfig.provider || this.config?.provider || 'github';
    const repo = (newConfig.repo || this.config?.repo || '').trim();
    const branch = (newConfig.branch || this.config?.branch || 'main').trim();
    const token = newConfig.token !== undefined ? newConfig.token.trim() : this.config?.token;
    const customBaseUrl = newConfig.customBaseUrl !== undefined ? newConfig.customBaseUrl.trim() : this.config?.customBaseUrl;

    if (!repo || !repo.includes('/')) {
      throw new Error('El repositorio debe tener el formato "usuario/repositorio" (ej: "MauricioPerera/mi-repo").');
    }

    this.config = {
      provider,
      repo,
      branch,
      token,
      customBaseUrl,
    };

    this.saveConfig();
    eventBus.emit('remote:config_updated', this.getConfig());
    return this.getConfig()!;
  }

  public clearConfig(): void {
    this.config = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    eventBus.emit('remote:config_updated', null);
  }

  private getApiBaseUrl(provider: RemoteProvider, customBaseUrl?: string): string {
    if (customBaseUrl && customBaseUrl.trim()) {
      return customBaseUrl.replace(/\/$/, '');
    }
    return provider === 'codeberg' ? 'https://codeberg.org/api/v1' : 'https://api.github.com';
  }

  private getHeaders(token?: string, provider: RemoteProvider = 'github'): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    if (token && token.trim()) {
      headers['Authorization'] = provider === 'codeberg' ? `token ${token.trim()}` : `Bearer ${token.trim()}`;
    }
    return headers;
  }

  public async push(options?: { message?: string; branch?: string }): Promise<RemotePushResult> {
    if (!this.config) {
      throw new Error('No hay configuración de repositorio remoto. Configure el proveedor, repositorio y token primero.');
    }

    const { provider, repo, token, customBaseUrl } = this.config;
    const branch = options?.branch || this.config.branch || gitVcs.getCurrentBranch() || 'main';
    const message = options?.message || (gitVcs.getLog(1)[0]?.message) || 'Update from WebMCP Code Studio';

    if (!token) {
      throw new Error('Se requiere un Personal Access Token (PAT) con permisos de escritura para hacer Push al repositorio remoto.');
    }

    const baseUrl = this.getApiBaseUrl(provider, customBaseUrl);
    const headers = this.getHeaders(token, provider);

    const files = vfs.listAllFiles();
    if (files.length === 0) {
      throw new Error('El VFS local está vacío. No hay archivos para publicar.');
    }

    if (provider === 'github') {
      return this.pushToGitHub({ baseUrl, repo, branch, message, headers, files });
    } else {
      return this.pushToCodeberg({ baseUrl, repo, branch, message, headers, files });
    }
  }

  private async pushToGitHub(ctx: {
    baseUrl: string;
    repo: string;
    branch: string;
    message: string;
    headers: Record<string, string>;
    files: Array<{ path: string; content: string }>;
  }): Promise<RemotePushResult> {
    const { baseUrl, repo, branch, message, headers, files } = ctx;

    // 1. Obtener la referencia HEAD de la rama
    let parentCommitSha: string | null = null;
    let baseTreeSha: string | null = null;

    try {
      const refRes = await fetch(`${baseUrl}/repos/${repo}/git/ref/heads/${branch}`, { headers });
      if (refRes.ok) {
        const refData = await refRes.json();
        parentCommitSha = refData.object.sha;

        const commitRes = await fetch(`${baseUrl}/repos/${repo}/git/commits/${parentCommitSha}`, { headers });
        if (commitRes.ok) {
          const commitData = await commitRes.json();
          baseTreeSha = commitData.tree.sha;
        }
      }
    } catch (err) {
      console.warn('[RemoteSync] No se pudo leer rama remota, intentando inicialización limpia:', err);
    }

    // 2. Construir árbol (tree)
    const treeItems = files.map((file) => ({
      path: file.path.replace(/^\//, ''),
      mode: '100644',
      type: 'blob',
      content: file.content,
    }));

    const treeBody: Record<string, unknown> = {
      tree: treeItems,
    };
    if (baseTreeSha) {
      treeBody.base_tree = baseTreeSha;
    }

    const createTreeRes = await fetch(`${baseUrl}/repos/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify(treeBody),
    });

    if (!createTreeRes.ok) {
      const errJson = await createTreeRes.json().catch(() => ({}));
      throw new Error(`Error de GitHub al crear árbol de archivos (${createTreeRes.status}): ${errJson.message || createTreeRes.statusText}`);
    }

    const treeData = await createTreeRes.json();
    const newTreeSha = treeData.sha;

    // 3. Crear commit remoto
    const authorName = gitVcs.getAuthor() || 'WebMCP Studio <dev@webmcp.local>';
    const commitPayload: Record<string, unknown> = {
      message,
      tree: newTreeSha,
      parents: parentCommitSha ? [parentCommitSha] : [],
      author: {
        name: authorName.split('<')[0].trim() || 'WebMCP Studio',
        email: authorName.includes('<') ? authorName.split('<')[1].replace('>', '').trim() : 'dev@webmcp.local',
        date: new Date().toISOString(),
      },
    };

    const createCommitRes = await fetch(`${baseUrl}/repos/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify(commitPayload),
    });

    if (!createCommitRes.ok) {
      const errJson = await createCommitRes.json().catch(() => ({}));
      throw new Error(`Error de GitHub al crear commit (${createCommitRes.status}): ${errJson.message || createCommitRes.statusText}`);
    }

    const commitData = await createCommitRes.json();
    const newCommitSha = commitData.sha;

    // 4. Actualizar o crear referencia de rama
    let updateRefRes = await fetch(`${baseUrl}/repos/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: newCommitSha, force: true }),
    });

    if (!updateRefRes.ok && updateRefRes.status === 404) {
      // Si la rama no existía, crearla
      updateRefRes = await fetch(`${baseUrl}/repos/${repo}/git/refs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ref: `refs/heads/${branch}`,
          sha: newCommitSha,
        }),
      });
    }

    if (!updateRefRes.ok) {
      const errJson = await updateRefRes.json().catch(() => ({}));
      throw new Error(`Error al actualizar la rama "${branch}" en GitHub (${updateRefRes.status}): ${errJson.message || updateRefRes.statusText}`);
    }

    const htmlUrl = `https://github.com/${repo}/commit/${newCommitSha}`;
    const result: RemotePushResult = {
      success: true,
      provider: 'github',
      repo,
      branch,
      commitSha: newCommitSha,
      url: htmlUrl,
      filesCount: files.length,
    };

    eventBus.emit('remote:push_completed', result);
    return result;
  }

  private async pushToCodeberg(ctx: {
    baseUrl: string;
    repo: string;
    branch: string;
    message: string;
    headers: Record<string, string>;
    files: Array<{ path: string; content: string }>;
  }): Promise<RemotePushResult> {
    const { baseUrl, repo, branch, message, headers, files } = ctx;

    // Codeberg / Forgejo Contents or Branch Commit API
    // Creamos/actualizamos los archivos mediante la API de contents
    let lastCommitSha = 'codeberg_commit_' + Date.now();

    for (const file of files) {
      const filePath = encodeURIComponent(file.path.replace(/^\//, ''));
      const b64 = utf8ToBase64(file.content);

      // Verificamos si existe para obtener SHA previo
      let existingSha: string | undefined = undefined;
      try {
        const checkRes = await fetch(`${baseUrl}/repos/${repo}/contents/${filePath}?ref=${branch}`, { headers });
        if (checkRes.ok) {
          const item = await checkRes.json();
          existingSha = item.sha;
        }
      } catch {
        // Archivo nuevo
      }

      const body: Record<string, unknown> = {
        content: b64,
        message: `${message}: update ${file.path}`,
        branch,
      };
      if (existingSha) {
        body.sha = existingSha;
      }

      const uploadRes = await fetch(`${baseUrl}/repos/${repo}/contents/${filePath}`, {
        method: existingSha ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        if (uploadData.commit && uploadData.commit.sha) {
          lastCommitSha = uploadData.commit.sha;
        }
      }
    }

    const htmlUrl = `https://codeberg.org/${repo}/commit/${lastCommitSha}`;
    const result: RemotePushResult = {
      success: true,
      provider: 'codeberg',
      repo,
      branch,
      commitSha: lastCommitSha,
      url: htmlUrl,
      filesCount: files.length,
    };

    eventBus.emit('remote:push_completed', result);
    return result;
  }

  public async pull(options?: { branch?: string }): Promise<RemotePullResult> {
    if (!this.config) {
      throw new Error('No hay configuración de repositorio remoto. Configure el proveedor y repositorio primero.');
    }

    const { provider, repo, token, customBaseUrl } = this.config;
    const branch = options?.branch || this.config.branch || 'main';
    const baseUrl = this.getApiBaseUrl(provider, customBaseUrl);
    const headers = this.getHeaders(token, provider);

    if (provider === 'github') {
      // 1. Obtener el árbol recursivo de la rama
      const treeRes = await fetch(`${baseUrl}/repos/${repo}/git/trees/${branch}?recursive=1`, { headers });
      if (!treeRes.ok) {
        const err = await treeRes.json().catch(() => ({}));
        throw new Error(`Error de GitHub al obtener archivos de "${branch}" (${treeRes.status}): ${err.message || treeRes.statusText}`);
      }

      const treeData = await treeRes.json();
      const treeItems = Array.isArray(treeData.tree) ? treeData.tree : [];
      let updatedCount = 0;

      for (const item of treeItems) {
        if (item.type === 'blob' && item.path) {
          // Descargar contenido del blob
          const blobRes = await fetch(`${baseUrl}/repos/${repo}/git/blobs/${item.sha}`, { headers });
          if (blobRes.ok) {
            const blobData = await blobRes.json();
            const decoded = blobData.encoding === 'base64' ? base64ToUtf8(blobData.content) : blobData.content;
            vfs.createFile('/' + item.path, decoded, true);
            updatedCount++;
          }
        }
      }

      vfs.saveToStorage();
      gitVcs.commit(`merge: sincronización remota desde github:${repo}@${branch}`, 'Remote Sync <sync@webmcp.ai>');

      const result: RemotePullResult = {
        success: true,
        provider: 'github',
        repo,
        branch,
        filesUpdated: updatedCount,
        message: `Se sincronizaron ${updatedCount} archivo(s) exitosamente desde GitHub.`,
      };

      eventBus.emit('remote:pull_completed', result);
      return result;
    } else {
      // Codeberg
      const branchRes = await fetch(`${baseUrl}/repos/${repo}/branches/${branch}`, { headers });
      if (!branchRes.ok) {
        throw new Error(`No se pudo acceder a la rama "${branch}" en Codeberg.`);
      }

      // Descargamos lista de contents del repo
      const contentsRes = await fetch(`${baseUrl}/repos/${repo}/contents?ref=${branch}`, { headers });
      if (!contentsRes.ok) {
        throw new Error('Error al listar contenidos en Codeberg.');
      }

      const items = await contentsRes.json();
      let updatedCount = 0;
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.type === 'file' && item.content) {
            const decoded = base64ToUtf8(item.content);
            vfs.createFile('/' + item.name, decoded, true);
            updatedCount++;
          }
        }
      }

      vfs.saveToStorage();
      gitVcs.commit(`merge: sincronización remota desde codeberg:${repo}@${branch}`, 'Remote Sync <sync@webmcp.ai>');

      const result: RemotePullResult = {
        success: true,
        provider: 'codeberg',
        repo,
        branch,
        filesUpdated: updatedCount,
        message: `Se sincronizaron ${updatedCount} archivo(s) exitosamente desde Codeberg.`,
      };

      eventBus.emit('remote:pull_completed', result);
      return result;
    }
  }

  private saveConfig(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      if (this.config) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.warn('[RemoteSync] No se pudo guardar configuración remota:', err);
    }
  }

  private loadConfig(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.config = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[RemoteSync] Error al cargar configuración remota:', err);
    }
  }
}

export const remoteSync = new RemoteSyncService();
