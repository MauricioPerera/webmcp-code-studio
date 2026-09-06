---
type: 'Task Contract'
title: 'Contrato de Control de Versiones Git Cliente'
description: 'Especificacion y oraculo congelado para el motor de Git cliente del IDE.'
tags: ['ccdd', 'git', 'vcs', 'contract']
task: 'git_vcs_core'
intent: 'Proveer un sistema de control de versiones Git en memoria y localStorage con staging, commits atómicos y ramas'
target: 'src/core/git-vcs.ts'
signature: 'export class GitVersionControl'
test_command: 'npm test'
budget:
  cyclomatic_max: 15
tests: 'tests/git.test.ts'
tests_sha256: '96e566b4fdd9bffc7cbbd1d3fe56392a94402c80115195ab8320786aa7f131f0'
touch_only: ['src/core/git-vcs.ts']
deps_allowed: []
forbids: ['child_process', 'fs']
---

## Intent
Implementar y mantener el motor de control de versiones Git en el cliente, permitiendo a los desarrolladores y agentes rastrear cambios, preparar archivos en el staging area, generar commits atómicos y gestionar ramas. Ver modelo de datos en [git-model.md](../data_models/git-model.md).

## Interface
La clase `GitVersionControl` expone:
- `getStatus(): GitStatusResult`
- `stageFile(path: string): void`
- `unstageFile(path: string): void`
- `stageAll(): void`
- `unstageAll(): void`
- `commit(message: string, author?: string): GitCommit`
- `getLog(limit?: number): GitCommit[]`
- `getBranches(): string[]`
- `getCurrentBranch(): string`
- `createBranch(name: string): boolean`
- `checkoutBranch(name: string): boolean`
- `discardFileChanges(path: string): boolean`

## Invariants
1. El commit inicial debe crearse automaticamente cuando el VFS contenga archivos y no existan commits previos.
2. Cada commit contiene un arbol completo e inmutable del estado de los archivos en ese instante.
3. El area de preparacion (staging) se limpia automaticamente tras completar exitosamente un commit.
4. El cambio de rama restaura el VFS con el snapshot exacto del ultimo commit en dicha rama.

## Examples
- **Ejemplo 1 (Consultar estado y preparar cambios):**
  ```ts
  import { gitVcs } from './src/core/git-vcs';
  gitVcs.stageFile('/src/index.js');
  const status = gitVcs.getStatus();
  ```
- **Ejemplo 2 (Crear un commit atomico):**
  ```ts
  import { gitVcs } from './src/core/git-vcs';
  const commit = gitVcs.commit('feat: nueva funcionalidad');
  console.log(commit.hash);
  ```

## Do / Don't
- **DO:** Calcular diffs en tiempo real comparando el VFS actual frente al snapshot del HEAD.
- **DO:** Persistir el historial en `localStorage` bajo una clave dedicada.
- **DON'T:** Permitir crear commits sin mensaje o sin cambios pendientes.
- **DON'T:** Usar dependencias externas de NodeJS como `child_process` o `fs`.

## Tests
El oraculo formal de pruebas esta congelado en [tests/git.test.ts](../../tests/git.test.ts) y verificado por el hash SHA-256 declarado en el Frontmatter.

## Constraints
- PARAR y reportar si se corrompe el arbol de commits o si el calculo de estados arroja excepciones no controladas.
- Rendimiento acotado a ejecucion instantanea en el navegador para proyectos de tamano estandar.
