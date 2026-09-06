---
type: 'Data Model'
title: 'Modelo de Datos: Terminal Unix y Shell VFS'
description: 'Estructuras de datos para ejecucion de comandos de shell, pipelines, redirecciones y resultados en el VFS.'
tags: ['okf', 'data_model', 'terminal', 'shell', 'vfs', 'posix']
version: '1.0.0'
author: 'Mauricio Perera'
created: '2026-09-06'
updated: '2026-09-06'
---

# Modelo de Datos: Terminal Unix y Shell VFS

Este nodo modela las estructuras de datos que gobiernan el motor de emulacion de terminal Unix (`TerminalShell`) sobre el Virtual File System (VFS) y el motor de control de versiones Git en WebMCP Code Studio.

## Entidades Principales

### 1. TerminalExecutionResult
Estructura de respuesta estandarizada producida tras la ejecucion de una linea de comandos o pipeline en la shell:

```typescript
export interface TerminalExecutionResult {
  stdout: string;       // Salida estandar capturada
  stderr: string;       // Salida de error capturada
  exitCode: number;     // 0 para exito, > 0 para fallos (POSIX standard)
  cwd: string;          // Directorio de trabajo tras la ejecucion
}
```

### 2. ParsedCommand
Representacion de un comando individual parseado con sus argumentos y flags:

```typescript
export interface ParsedCommand {
  command: string;      // Nombre del comando (ej: 'ls', 'cat', 'git')
  args: string[];       // Argumentos y flags procesados sin comillas
  raw: string;          // Fragmento de texto original
}
```

### 3. ParsedPipeline
Representacion de una cadena de comandos unidos por pipes (`|`) y posibles destinos de redireccion de salida (`>`, `>>`):

```typescript
export interface ParsedPipeline {
  commands: ParsedCommand[];
  redirection?: {
    type: 'overwrite' | 'append';  // '>' = overwrite, '>>' = append
    targetPath: string;            // Ruta del archivo destino en VFS
  };
}
```

### 4. ShellEnvironment
Estado contextual del entorno de ejecucion de la shell en el cliente:

```typescript
export interface ShellEnvironment {
  cwd: string;                     // Directorio de trabajo activo (ej: '/')
  lastExitCode: number;            // Codigo de retorno del ultimo comando ($?)
  envVars: Record<string, string>; // Variables de entorno virtuales ($PWD, $USER)
  history: string[];               // Historial de comandos ejecutados
}
```

## Relaciones con Otros Nodos
- Complementa a [vfs-node.md](vfs-node.md) proporcionando una interfaz de linea de comandos para las operaciones POSIX del VFS.
- Se integra con [git-model.md](git-model.md) permitiendo comandos `git status`, `git commit`, etc.
- Gobernado por el contrato de tareas [terminal-contract.md](../contracts/terminal-contract.md).
