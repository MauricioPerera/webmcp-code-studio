---
type: 'Architecture'
title: 'Integración WebMCP y fastwebmcp'
description: 'Especificación de la integración de WebMCP, registro de herramientas tipadas con Zod y fallback seguro.'
tags: ['kdd', 'architecture', 'webmcp']
---

# Integración WebMCP y fastwebmcp

WebMCP es el estándar emergente para otorgar a las aplicaciones web una "voz de herramientas" reconocible por modelos de inteligencia artificial en el navegador.

## 1. Biblioteca fastwebmcp
El IDE integra la biblioteca `fastwebmcp` de Mauricio Perera para registrar herramientas mediante esquemas fuertemente tipados con Zod.

## 2. Catálogo de Herramientas Expuestas
1. `ide_get_active_file`: Consulta del archivo abierto.
2. `ide_list_files`: Exploración de archivos del proyecto.
3. `ide_read_file`: Lectura puntual de código.
4. `ide_write_file`: Creación y edición de archivos.
5. `ide_delete_file`: Eliminación de archivos y carpetas.
6. `ide_execute_code`: Evaluación en sandbox.
7. `ide_search_files`: Búsqueda de patrones en archivos.
8. `ide_get_workspace_summary`: Resumen global del espacio de trabajo.

## 3. Fallback y Polyfill en Navegadores
Si el navegador no cuenta con la bandera experimental de Chrome 149+ para `document.modelContext`, la aplicación utiliza `createWebMcpMock()` de `fastwebmcp` para inicializar el contexto en memoria, permitiendo que la interfaz del IDE y el agente interactivo funcionen con 100% de operatividad.

## 4. Enlaces Relacionados
- [Definición de Herramientas](../data_models/tool-definition.md)
- [Contrato WebMCP](../contracts/webmcp-contract.md)
- [Visión General](./overview.md)
