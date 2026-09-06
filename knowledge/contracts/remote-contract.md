---
type: 'Task Contract'
title: 'Contrato de Sincronizacion Remota Git'
description: 'Especificacion y oraculo congelado para la sincronizacion con GitHub y Codeberg via APIs REST y PAT.'
tags: ['ccdd', 'remote', 'git', 'sync', 'contract']
task: 'remote_sync_service'
intent: 'Proveer sincronizacion remota Push y Pull con GitHub y Codeberg usando APIs REST y Personal Access Tokens'
target: 'src/core/remote-sync.ts'
signature: 'export class RemoteSyncService'
test_command: 'npm test'
budget:
  cyclomatic_max: 15
tests: 'tests/remote.test.ts'
tests_sha256: '0bdd3b5f9da37f48ac70062fb1b982ba38751e6339488021f5c08c23dfc9b064'
touch_only: ['src/core/remote-sync.ts']
deps_allowed: []
forbids: ['child_process', 'fs']
---

## Intent
Implementar y mantener el servicio de sincronizacion remota con forjas Git (GitHub y Codeberg), permitiendo operaciones de Push atomico mediante Git Database API y Pull para importar arboles remotos al VFS. Ver modelo de datos en [remote-model.md](../data_models/remote-model.md).

## Interface
La clase RemoteSyncService expone:
- `getConfig(): RemoteConfig | null`
- `setConfig(config: Partial<RemoteConfig>): RemoteConfig`
- `clearConfig(): void`
- `push(options?: { message?: string; branch?: string }): Promise<RemotePushResult>`
- `pull(options?: { branch?: string }): Promise<RemotePullResult>`

## Invariants
1. El repositorio debe seguir estrictamente la convencion de formato owner/repo.
2. Las operaciones de Push requieren un Personal Access Token (PAT) con permisos de escritura.
3. La configuracion remota se persiste de forma segura en localStorage.
4. Tras un Pull exitoso, los archivos se inyectan en el VFS y se genera un commit local de sincronizacion.

## Examples
- **Ejemplo 1 (Configurar remoto):**
  ```ts
  import { remoteSync } from './src/core/remote-sync';
  remoteSync.setConfig({
    provider: 'github',
    repo: 'MauricioPerera/mi-proyecto',
    branch: 'main',
    token: 'ghp_secret'
  });
  ```
- **Ejemplo 2 (Publicar cambios a remoto):**
  ```ts
  import { remoteSync } from './src/core/remote-sync';
  const result = await remoteSync.push({ message: 'feat: actualizacion desde IDE' });
  console.log(result.commitSha, result.url);
  ```

## Do / Don't
- **DO:** Usar la API Git Database de GitHub (trees, commits, refs) para commits atomicos sin WebAssembly ni binarios locales.
- **DO:** Validar y sanear las cadenas de entrada y manejar codigos HTTP de error con mensajes informativos.
- **DON'T:** Guardar credenciales en repositorios publicos; almacenar tokens exclusivamente en el almacenamiento local del cliente.
- **DON'T:** Invocar modulos de NodeJS no soportados en el navegador como `child_process` o `fs`.

## Tests
El oraculo formal de pruebas esta congelado en [tests/remote.test.ts](../../tests/remote.test.ts) y verificado por el hash SHA-256 declarado en el Frontmatter.

## Constraints
- PARAR y reportar si se corrompe la comunicacion con la API o si las credenciales fallan irreparablemente.
- Operaciones idempotentes y no destructivas en caso de fallas de conexion o credenciales invalidas.
