---
type: 'Task Contract'
title: 'Contrato de Implementación del VFS'
description: 'Especificación y oráculo congelado para el Virtual File System del IDE.'
tags: ['ccdd', 'vfs', 'contract']
task: 'vfs_core'
intent: 'Proveer un sistema de archivos virtual reactivo con soporte de árbol, búsqueda, persistencia e import/export ZIP'
target: 'src/core/vfs.ts'
signature: 'export class VirtualFileSystem'
test_command: 'npm test'
budget:
  cyclomatic_max: 15
tests: 'tests/vfs.test.ts'
tests_sha256: '80ace291df7fa79c612bb2fd0a498240d7d70ea5352bc1a7f543076f9d212d3a'
touch_only: ['src/core/vfs.ts']
deps_allowed: ['jszip']
forbids: ['fs', 'child_process']
---

## Intent
Implementar y mantener el motor central del Virtual File System (VFS) para el Web IDE, garantizando operaciones atómicas de creación, edición, renombrado, eliminación en cascada y serialización. Ver detalles arquitectónicos en [vfs-design.md](../architecture/vfs-design.md).

## Interface
El módulo expone la clase `VirtualFileSystem` con métodos públicos:
- `normalizePath(rawPath: string): string`
- `getParentPath(path: string): string`
- `createFile(rawPath: string, content?: string): VFSFile`
- `createDirectory(rawPath: string): VFSDirectory`
- `readFile(rawPath: string): string | null`
- `writeFile(rawPath: string, content: string): boolean`
- `deleteNode(rawPath: string): boolean`
- `renameNode(oldPath: string, newPath: string): boolean`
- `listDirectory(path?: string): VFSNode[]`
- `listAllFiles(): VFSFile[]`
- `searchFiles(query: string, isRegex?: boolean): Array<{ file: string; line: number; text: string }>`
- `exportToZip(): Promise<Blob>`
- `importFromZip(data: Blob | ArrayBuffer): Promise<number>`

## Invariants
1. La ruta raíz `/` siempre existe y no puede ser eliminada ni renombrada.
2. Todas las rutas se normalizan sin barra final redundante ni dobles barras.
3. Al eliminar un directorio, se eliminan recursivamente todos sus descendientes.
4. Todo cambio emite el evento correspondiente en el EventBus.

## Examples
- **Ejemplo 1 (Creación y lectura básica):**
  ```ts
  import { vfs } from './src/core/vfs';
  vfs.createFile('/src/index.js', 'console.log("ok");');
  const content = vfs.readFile('/src/index.js');
  ```
- **Ejemplo 2 (Búsqueda en archivos):**
  ```ts
  import { vfs } from './src/core/vfs';
  const matches = vfs.searchFiles('function', false);
  console.log('Coincidencias encontradas:', matches.length);
  ```

## Do / Don't
- **DO:** Usar `normalizePath` en cada método antes de acceder a la estructura interna.
- **DO:** Asegurar que los directorios padre existan al crear un archivo profundo.
- **DON'T:** Permitir rutas relativas sin normalizar que escapen de la raíz virtual.
- **DON'T:** Sobrescribir directorios como si fueran archivos de texto.

## Tests
El oráculo formal de pruebas está congelado bajo el archivo [tests/vfs.test.ts](../../tests/vfs.test.ts) y verificado por el hash SHA-256 declarado en el Frontmatter.

## Constraints
- PARAR y reportar si se intenta acceder al sistema de archivos local mediante módulos de Node.
- Ejecución pura en cliente (navegador web o entorno Node sin dependencias nativas del sistema operativo).
- Complejidad ciclomática acotada al presupuesto declarado en `budget.cyclomatic_max`.
