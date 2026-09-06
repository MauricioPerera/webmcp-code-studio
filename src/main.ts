import { vfs } from './core/vfs';
import { starterTemplates } from './templates/starter-projects';
import { editorManager } from './ui/editor';
import { explorerView } from './ui/explorer';
import { layoutManager } from './ui/layout';
import { webMcpPanelView } from './ui/webmcp-panel';
import { terminalPanelView } from './ui/terminal-panel';
import { previewPanelView } from './ui/preview-panel';
import { statusBarView } from './ui/status-bar';

async function bootstrap() {
  console.log('[WebMCP Studio] Inicializando aplicación...');

  // 1. Initialize VFS
  const hasLoaded = vfs.loadFromStorage();
  if (!hasLoaded) {
    console.log('[WebMCP Studio] Cargando plantilla inicial "webmcp-demo"...');
    vfs.loadProjectTemplate(starterTemplates['webmcp-demo'].files);
  }

  // 2. Initialize Layout & UI views
  layoutManager.init();
  explorerView.init();
  webMcpPanelView.init();
  terminalPanelView.init();
  previewPanelView.init();
  statusBarView.init();

  // 3. Initialize Monaco Editor
  await editorManager.init('monaco-mount');

  // 4. Open default entry file
  const defaultFile = vfs.exists('/index.html') ? '/index.html' : vfs.listAllFiles()[0]?.path;
  if (defaultFile) {
    editorManager.openFile(defaultFile);
  }

  console.log('[WebMCP Studio] Aplicación lista y operativa.');
}

window.addEventListener('DOMContentLoaded', () => {
  bootstrap().catch((err) => {
    console.error('[WebMCP Studio] Error en bootstrap:', err);
  });
});
