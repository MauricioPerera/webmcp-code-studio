---
type: 'Architecture'
title: 'Diseño del Virtual File System (VFS)'
description: 'Especificación técnica de la estructura de árbol, normalización y persistencia del VFS.'
tags: ['kdd', 'architecture', 'vfs']
---

# Diseño del Virtual File System (VFS)

El Virtual File System (VFS) provee una abstracción en memoria de un sistema de archivos tradicional POSIX con rutas absolutas normalizadas iniciadas en barra (`/`).

## 1. Estructura de Datos
Cada nodo del VFS es un archivo (`VFSFile`) o un directorio (`VFSDirectory`), según se define en [vfs-node.md](../data_models/vfs-node.md).

## 2. Operaciones Fundamentales
- **Normalización de Rutas:** Cualquier separador inverso (`\`) se convierte en barra estándar (`/`), se colapsan barras repetidas y se eliminan barras finales (salvo para la raíz `/`).
- **Creación Recursiva:** La creación de un archivo en una ruta profunda (ej. `/src/core/utils.ts`) crea automáticamente los directorios intermedios necesarios.
- **Eliminación en Cascada:** Al eliminar un directorio, todos sus archivos y subdirectorios descendientes son purgados del mapa de nodos.
- **Exportación e Importación:** Empaquetado automático en formato ZIP mediante JSZip.

## 3. Enlaces Relacionados
- [Modelo de Datos VFS](../data_models/vfs-node.md)
- [Contrato de Tarea VFS](../contracts/vfs-contract.md)
- [Visión General](./overview.md)
