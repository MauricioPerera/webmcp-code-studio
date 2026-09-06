---
type: 'Task Contract'
title: 'Contrato de Terminal Unix y Shell VFS'
description: 'Especificacion y oraculo congelado para el motor de emulacion de terminal Unix y herramientas CLI sobre el VFS.'
tags: ['ccdd', 'terminal', 'shell', 'posix', 'cli', 'contract']
task: 'terminal_shell_service'
intent: 'Proveer una terminal Unix interactiva y ejecutor de comandos estandar POSIX y Git sobre el VFS'
target: 'src/core/terminal-shell.ts'
signature: 'export class TerminalShell'
test_command: 'npm test'
budget:
  cyclomatic_max: 20
tests: 'tests/terminal.test.ts'
tests_sha256: '09694c3dafabf677548a9ffe8ed907c9b5c668a8b120c2bcf2a0adbf318f166d'
touch_only: ['src/core/terminal-shell.ts']
deps_allowed: []
forbids: ['child_process', 'fs']
---

## Intent
Implementar y mantener el motor de shell Unix (`TerminalShell`) que emula comandos POSIX (`ls`, `cat`, `mkdir`, `rm`, `touch`, `cp`, `mv`, `echo`, `grep`, `pwd`, `cd`), comandos de Git (`status`, `add`, `commit`, `diff`, `branch`, `log`, `push`, `pull`), soporte de tuberias (`|`) y redirecciones (`>`, `>>`) directamente sobre el VFS sin requerir backend de servidor. Ver modelo de datos en [terminal-model.md](../data_models/terminal-model.md).

## Interface
La clase TerminalShell expone:
- `getCwd(): string`
- `setCwd(path: string): void`
- `resolvePath(path: string): string`
- `tokenizeLine(line: string): string[]`
- `parseCommandLine(line: string): ParsedPipeline`
- `execute(commandLine: string, customCwd?: string): Promise<TerminalExecutionResult>`

## Invariants
1. Toda resolucion de rutas relativas y de navegacion (`cd`, `..`) permanece estrictamente acotada al VFS.
2. Los comandos que fallan o no existen retornan codigos de salida POSIX estandar (`1` o `127`) sin lanzar excepciones no controladas.
3. Las tuberias (`|`) conectan secuencialmente el `stdout` de un comando con el `stdin` del siguiente.
4. Las redirecciones (`>`, `>>`) persisten el `stdout` resultante en el archivo destino del VFS.

## Examples
- **Ejemplo 1 (Listar archivos y filtrar con grep):**
  ```ts
  import { terminalShell } from './src/core/terminal-shell';
  const res = await terminalShell.execute('ls -la /src | grep index');
  console.log(res.stdout, res.exitCode);
  ```
- **Ejemplo 2 (Crear archivo mediante redireccion y confirmar con Git):**
  ```ts
  import { terminalShell } from './src/core/terminal-shell';
  await terminalShell.execute('echo "export const v = 1;" > /src/version.ts');
  await terminalShell.execute('git add . && git commit -m "feat: version file"');
  ```

## Do / Don't
- **DO:** Manejar comillas simples y dobles para preservar cadenas y argumentos con espacios.
- **DO:** Conectar las operaciones de Git con `gitVcs` y la sincronizacion remota con `remoteSync`.
- **DON'T:** Ejecutar comandos de sistema operativo real ni importar modulos nativos como `child_process` o `fs`.
- **DON'T:** Romper la ejecucion si un comando del pipeline no produce salida.

## Tests
El oraculo formal de pruebas esta congelado en [tests/terminal.test.ts](../../tests/terminal.test.ts) y verificado por el hash SHA-256 declarado en el Frontmatter.

## Constraints
- PARAR y reportar si se detecta ejecucion arbitraria no sanitizada o violacion del aislamiento del VFS.
- El tiempo de ejecucion de comandos locales debe ser inmediato e imperceptible para el usuario.
