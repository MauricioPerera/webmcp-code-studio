---
type: 'Data Model'
title: 'Modelo de Datos: Definición de Herramienta WebMCP'
description: 'Esquema y metadatos de las herramientas expuestas a través de fastwebmcp.'
tags: ['kdd', 'data-model', 'webmcp']
---

# Modelo de Datos: Definición de Herramienta WebMCP

Define los metadatos y la estructura de registro para las herramientas expuestas a agentes de IA.

## 1. Campos de Metadatos
- `name`: Identificador único de la herramienta (de 1 a 128 caracteres, alfanumérico con guiones y puntos).
- `description`: Descripción concisa para el modelo de IA.
- `parameters`: Lista de parámetros de entrada con su tipo, descripción y obligatoriedad.
- `readOnlyHint`: Booleano opcional indicando si la herramienta no produce efectos colaterales de escritura.

## 2. Enlaces Relacionados
- [Integración WebMCP](../architecture/webmcp-integration.md)
- [Contrato WebMCP](../contracts/webmcp-contract.md)
