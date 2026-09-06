---
type: 'Data Model'
title: 'Modelo de Datos: Control de Versiones Git'
description: 'Estructura de datos para commits, estados de archivo, ramas y staging area en el motor Git cliente.'
tags: ['kdd', 'data-model', 'git', 'vcs']
---

# Modelo de Datos: Control de Versiones Git

Define las estructuras y modelos de datos para el seguimiento de versiones, commits atómicos y ramas locales.

## 1. Interfaz GitCommit
Representa una captura congelada del estado del repositorio:
- `hash`: SHA de 40 caracteres identificador del commit.
- `parentHash`: SHA del commit padre, o `null` si es el commit inicial.
- `message`: Descripcion del cambio realizado.
- `author`: Identidad del autor en formato `Nombre <correo>`.
- `timestamp`: Marca de tiempo en milisegundos.
- `branch`: Nombre de la rama en la que se creo el commit.
- `snapshot`: Mapa llave-valor de rutas de archivo hacia su contenido textual (`Record<string, string>`).

## 2. Interfaz GitFileChange
Representa un archivo con diferencias respecto al commit actual:
- `path`: Ruta absoluta en el VFS.
- `status`: Estado del cambio: `'M'` (Modificado), `'A'` (Añadido) o `'D'` (Eliminado).
- `staged`: Booleano que indica si el cambio esta en el area de preparacion.

## 3. Interfaz GitStatusResult
Representa el resumen del area de trabajo:
- `branch`: Rama activa actual.
- `staged`: Lista de `GitFileChange` preparados para commit.
- `unstaged`: Lista de `GitFileChange` pendientes de preparacion.
- `totalChanges`: Cantidad total de archivos con modificaciones.

## 4. Enlaces Relacionados
- [Contrato Git](../contracts/git-contract.md)
- [Modelo de Nodo VFS](./vfs-node.md)
- [Indice de Conocimiento](../index.md)
