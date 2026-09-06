# WebMCP Code Studio ⚡

> **IDE Web estilo Visual Studio Code impulsado por la metodología KDD (Knowledge-Driven Development) y WebMCP mediante `fastwebmcp`, listo para despliegue en GitHub Pages.**

[![KDD Compliant](https://img.shields.io/badge/Methodology-KDD%20Level%201-blue)](https://github.com/MauricioPerera/KDD)
[![fastwebmcp](https://img.shields.io/badge/WebMCP-fastwebmcp%20v0.4.2-brightgreen)](https://github.com/MauricioPerera/fastwebmcp)
[![Monaco Editor](https://img.shields.io/badge/Editor-Monaco%20(VS%20Code)-007acc)](https://microsoft.github.io/monaco-editor/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Visión del Proyecto

**WebMCP Code Studio** es un entorno de desarrollo integrado (IDE) que recrea la experiencia de usuario de **Visual Studio Code** directamente en el navegador, funcionando 100% en el cliente como una aplicación web estática (SPA).

A diferencia de los editores web tradicionales, este IDE incorpora capacidades nativas de **WebMCP** gracias a la librería [`fastwebmcp`](https://github.com/MauricioPerera/fastwebmcp) de Mauricio Perera:
1. Permite que **agentes de IA externos** (a través del origin trial de Chrome `document.modelContext`) o agentes integrados en la página inspeccionen el proyecto, lean y escriban archivos en el sistema de archivos virtual (VFS) y evalúen código en el sandbox.
2. Incorpora un **WebMCP Inspector & Agent Playground** que permite probar y auditar cualquier herramienta con esquemas Zod en tiempo real.
3. Se desarrolla bajo los estándares formales de **[Knowledge-Driven Development (KDD)](https://github.com/MauricioPerera/KDD)**: base de conocimiento en **Open Knowledge Format (OKF)**, contratos de tareas CCDD híbridos con oráculos de pruebas congelados (SHA-256) y validadores deterministas.
4. Es **100% compatible con GitHub Pages**: compilación estática mediante Vite con enlaces de activos relativos (`./`), sin necesidad de servidor de backend ni bases de datos remotas.

---

## 🚀 Características Principales

- **Editor Monaco Oficial de VS Code:**
  - Resaltado de sintaxis para JavaScript, TypeScript, HTML, CSS, JSON, Markdown, Python y más.
  - Autocompletado inteligente (IntelliSense), minimapa, números de línea, plegado de código y múltiples cursores.
  - Atajos de teclado familiares: `Ctrl+S` (guardar), `F1` / `Ctrl+Shift+P` (paleta de comandos de Monaco), `Ctrl+P` (apertura rápida de archivos), `Ctrl+\`` (alternar terminal).
  - Selector de temas: VS Code Dark+ (`vs-dark`) y Light+ (`vs`).

- **Sistema de Archivos Virtual (VFS):**
  - Estructura jerárquica de árbol con normalización de rutas POSIX (`/src/index.js`).
  - Creación, edición, renombrado y eliminación en cascada de archivos y carpetas.
  - Persistencia automática en el almacenamiento local del navegador (`localStorage`).
  - Búsqueda global de texto y expresiones regulares en todo el proyecto.
  - Exportación con 1 clic a archivo `.zip` comprimido (mediante JSZip) e importación de proyectos locales.

- **Integración WebMCP con `fastwebmcp`:**
  - Detección automática del soporte nativo de `document.modelContext`.
  - Fallback y polyfill interactivo usando `createWebMcpMock()` para garantizar operatividad universal en cualquier navegador.
  - 8 herramientas centrales expuestas:
    - `ide_get_active_file`: Ruta y contenido del archivo activo.
    - `ide_list_files`: Lista de archivos y metadatos del workspace.
    - `ide_read_file`: Lectura puntual de un archivo en el VFS.
    - `ide_write_file`: Creación y sobrescritura de archivos.
    - `ide_delete_file`: Eliminación de archivos o directorios.
    - `ide_execute_code`: Evaluación asíncrona en el sandbox.
    - `ide_search_files`: Búsqueda de patrones en archivos.
    - `ide_get_workspace_summary`: Resumen estadístico del proyecto.
  - Inspector de herramientas con formulario interactivo de parámetros y visor de resultados JSON.
  - Registro de auditoría (logs) de todas las ejecuciones de herramientas con marcas de tiempo y estado.
  - Asistente / Agente IA interactivo que ejecuta herramientas en bucle.

- **Sandbox & Live Preview:**
  - Vista previa en vivo en iframe aislado con inyección automática de estilos y scripts vinculados.
  - Captura y redirección de `console.log`, `console.warn`, `console.error` hacia la terminal del IDE mediante `postMessage`.
  - Terminal REPL interactiva (`> ...`) para evaluar expresiones JavaScript en vivo.

- **Plantillas Preinstaladas:**
  - *WebMCP Demo App*: Aplicación interactiva con contador y logs controlados por herramientas WebMCP.
  - *HTML5 Canvas Playground*: Simulación de partículas con físicas en tiempo real.
  - *KDD Knowledge Base*: Repositorio de especificaciones OKF y contratos de tareas.

---

## 📐 Estructura del Repositorio (Estándar KDD)

```
webmcp-code-studio/
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD automatizado para GitHub Pages
├── knowledge/                    # Base de conocimiento OKF
│   ├── index.md                  # Catálogo raíz (sin huérfanos)
│   ├── validacion.md             # Guía y niveles de validación KDD
│   ├── glosario.md               # Glosario de términos
│   ├── architecture/             # Especificaciones de arquitectura
│   │   ├── overview.md
│   │   ├── vfs-design.md
│   │   └── webmcp-integration.md
│   ├── data_models/              # Modelos de datos
│   │   ├── vfs-node.md
│   │   └── tool-definition.md
│   └── contracts/                # Contratos CCDD híbridos OKF+CCDD
│       ├── vfs-contract.md       # Oráculo congelado VFS
│       ├── webmcp-contract.md    # Oráculo congelado WebMCP
│       └── sandbox-contract.md   # Oráculo congelado Sandbox
├── scripts/                      # Validadores deterministas KDD (Python stdlib)
│   ├── validate_contracts.py     # Validador formal de contratos CCDD
│   ├── validate_okf.py           # Validador de conformidad OKF
│   └── lint_ascii.py             # Verificador de pureza ASCII
├── src/                          # Código fuente TypeScript
│   ├── core/                     # Núcleo lógico del IDE
│   │   ├── types.ts              # Tipos e interfaces
│   │   ├── event-bus.ts          # Bus de eventos reactivo
│   │   ├── vfs.ts                # Motor del Virtual File System
│   │   ├── webmcp-service.ts     # Integración fastwebmcp
│   │   └── sandbox.ts            # Ejecutor sandbox y Live Preview
│   ├── ui/                       # Interfaz estilo VS Code
│   │   ├── layout.ts             # Disposición, splitters y atajos
│   │   ├── editor.ts             # Integración de Monaco Editor
│   │   ├── explorer.ts           # Árbol de archivos y búsqueda
│   │   ├── webmcp-panel.ts       # Inspector y Agente WebMCP
│   │   ├── preview-panel.ts      # Panel de vista previa
│   │   ├── terminal-panel.ts     # Consola y REPL
│   │   └── status-bar.ts         # Barra de estado inferior
│   ├── templates/                # Plantillas de inicio
│   │   └── starter-projects.ts
│   ├── style.css                 # Hoja de estilos VS Code (Dark+/Light+)
│   └── main.ts                   # Bootstrap de la aplicación
├── tests/                        # Pruebas automatizadas (Vitest)
│   ├── vfs.test.ts
│   ├── webmcp.test.ts
│   └── sandbox.test.ts
├── index.html                    # Shell HTML
├── package.json                  # Dependencias y scripts
├── tsconfig.json                 # Configuración de TypeScript
└── vite.config.ts                # Configuración de Vite (base: './')
```

---

## 🛠️ Instalación y Uso Local

### Prerrequisitos
- Node.js v18+ y npm v9+
- Python 3.8+ (para ejecutar los validadores deterministas de KDD)

### 1. Clonar e Instalar
```bash
cd webmcp-code-studio
npm install
```

### 2. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
Abre tu navegador en `http://localhost:3000`.

### 3. Ejecutar Pruebas Automatizadas
```bash
npm test
```

### 4. Ejecutar Suite de Validación KDD (Nivel 1)
```bash
npm run kdd:validate
```
Ejecuta secuencialmente:
1. `validate_contracts.py` (contratos CCDD, oráculos SHA-256, touch_only, constraints).
2. `validate_okf.py` (conformidad de nodos OKF y enlaces del grafo).
3. `lint_ascii.py` (verificación de codificación ASCII).
4. `vitest` (ejecución de pruebas oráculo).

### 5. Compilar para Producción
```bash
npm run build
```
Genera la carpeta `dist/` con el bundle estático y rutas relativas lista para servir desde cualquier servidor estático o GitHub Pages.

---

## 🌐 Despliegue en GitHub Pages

El proyecto incluye el flujo de trabajo automatizado `.github/workflows/deploy.yml`:

1. Sube este repositorio a GitHub en la rama `main`.
2. En GitHub, ve a **Settings** > **Pages**.
3. En **Build and deployment** > **Source**, selecciona **GitHub Actions**.
4. Cada vez que hagas un push a `main`, el workflow:
   - Validará todos los contratos KDD.
   - Ejecutará la suite de pruebas unitarias.
   - Compilará la aplicación estática.
   - La desplegará automáticamente en `https://<tu-usuario>.github.io/<tu-repositorio>/`.

---

## 📜 Licencia

Distribuido bajo la licencia MIT.
Construido con el estándar [KDD](https://github.com/MauricioPerera/KDD) y [fastwebmcp](https://github.com/MauricioPerera/fastwebmcp).
