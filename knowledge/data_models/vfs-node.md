---
type: 'Data Model'
title: 'Modelo de Datos: Nodo VFS'
description: 'Estructura de tipos e interfaces para archivos y directorios en el Virtual File System.'
tags: ['kdd', 'data-model', 'vfs']
---

# Modelo de Datos: Nodo VFS

Define la estructura de representación en memoria y almacenamiento local para los nodos del VFS.

## 1. Interfaz VFSFile
Representa un archivo de texto plano o código fuente:
- `type`: literal `'file'`.
- `path`: string con la ruta absoluta normalizada (ej: `'/src/index.js'`).
- `name`: string con el nombre del archivo (ej: `'index.js'`).
- `content`: string con el contenido textual completo.
- `updatedAt`: timestamp numérico en milisegundos.

## 2. Interfaz VFSDirectory
Representa un directorio o carpeta en el árbol:
- `type`: literal `'directory'`.
- `path`: string con la ruta absoluta normalizada (ej: `'/src'`).
- `name`: string con el nombre del directorio (ej: `'src'`).
- `children`: lista de strings con las rutas de sus hijos directos.
- `updatedAt`: timestamp numérico en milisegundos.

## 3. Enlaces Relacionados
- [Diseño del VFS](../architecture/vfs-design.md)
- [Contrato VFS](../contracts/vfs-contract.md)
