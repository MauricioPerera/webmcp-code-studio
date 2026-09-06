---
type: 'Architecture'
title: 'Arquitectura General de WebMCP Code Studio'
description: 'Visión general de componentes, flujo de datos y ejecución en cliente de WebMCP Code Studio.'
tags: ['kdd', 'architecture', 'overview']
---

# Arquitectura General de WebMCP Code Studio

WebMCP Code Studio es un entorno de desarrollo integrado (IDE) web ligero, moderno y completo diseñado con el estilo y ergonomía de Visual Studio Code. Funciona íntegramente en el navegador web del usuario como una aplicación de una sola página (SPA) estática, sin depender de servidores backend dedicados.

## 1. Principios de Diseño
- **100% Client-Side:** Toda la lógica, compilación, evaluación de scripts y persistencia se ejecuta en el navegador.
- **Despliegue Estático:** Compatible con GitHub Pages mediante rutas relativas (`./`).
- **Integración WebMCP:** Expone las herramientas internas del editor a agentes de IA mediante `fastwebmcp` y la API `document.modelContext`.
- **Rigor KDD:** Especificado bajo el estándar Knowledge-Driven Development (KDD).

## 2. Capas del Sistema
1. **Interfaz de Usuario (VS Code UI):**
   - Barra de actividad lateral (Activity Bar).
   - Barra lateral primaria con vistas de Explorador, Búsqueda, Inspector WebMCP, KDD y Configuración.
   - Editor principal basado en Monaco Editor con gestión multi-pestaña.
   - Panel inferior con Vista Previa (Live Preview), Terminal REPL interactiva y Registro de Auditoría WebMCP.
   - Barra de estado inferior con métricas de cursor, lenguaje y estado de WebMCP.
2. **Núcleo Lógico:**
   - **VFS (Virtual File System):** Sistema de archivos virtual jerárquico con persistencia en `localStorage`.
   - **WebMCP Service:** Capa de registro de herramientas construida con `fastwebmcp` y Zod.
   - **Sandbox Manager:** Iframe aislado con inyección de hooks de consola y evaluador JavaScript.
   - **EventBus:** Bus de eventos desacoplado para comunicación reactiva.

## 3. Enlaces Relacionados
- [Diseño del VFS](./vfs-design.md)
- [Integración WebMCP](./webmcp-integration.md)
- [Contrato VFS](../contracts/vfs-contract.md)
- [Contrato WebMCP](../contracts/webmcp-contract.md)
