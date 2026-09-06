/**
 * Starter project templates pre-loaded into the IDE
 */

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  files: Record<string, string>;
}

export const starterTemplates: Record<string, ProjectTemplate> = {
  'webmcp-demo': {
    id: 'webmcp-demo',
    name: 'WebMCP + FastWebMCP Demo',
    description: 'Aplicación web interactiva que demuestra el registro de herramientas WebMCP en el navegador.',
    files: {
      '/index.html': `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebMCP Demo App</title>
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  <div class="card">
    <header>
      <h1>⚡ WebMCP Interactive Demo</h1>
      <p class="subtitle">Herramientas nativas para agentes IA en el navegador con <code>fastwebmcp</code></p>
    </header>

    <main>
      <section class="counter-section">
        <h2>Contador Controlado por Agente</h2>
        <div class="counter-display" id="counter-val">0</div>
        <div class="btn-group">
          <button id="btn-dec" class="btn secondary">-1</button>
          <button id="btn-reset" class="btn secondary">Reset</button>
          <button id="btn-inc" class="btn primary">+1</button>
        </div>
      </section>

      <section class="log-section">
        <h2>Registro de Acciones WebMCP</h2>
        <div id="log-list" class="log-box">
          <div class="log-item info">Página lista. Esperando invocaciones de herramientas...</div>
        </div>
      </section>
    </main>
  </div>

  <script src="./app.js"></script>
</body>
</html>`,

      '/style.css': `body {
  margin: 0;
  padding: 2rem;
  background: #0f141c;
  color: #e6edf3;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  display: flex;
  justify-content: center;
}

.card {
  width: 100%;
  max-width: 520px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}

h1 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: #58a6ff;
}

.subtitle {
  color: #8b949e;
  font-size: 0.9rem;
  margin: 0 0 1.5rem 0;
}

code {
  background: #21262d;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
}

.counter-section {
  text-align: center;
  margin-bottom: 2rem;
}

.counter-display {
  font-size: 3.5rem;
  font-weight: 700;
  color: #3fb950;
  margin: 1rem 0;
}

.btn-group {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn {
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  border: 1px solid transparent;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn.primary {
  background: #238636;
  color: white;
}
.btn.primary:hover { background: #2ea043; }

.btn.secondary {
  background: #21262d;
  color: #c9d1d9;
  border-color: #30363d;
}
.btn.secondary:hover { background: #30363d; }

.log-box {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 0.75rem;
  height: 120px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.82rem;
}

.log-item {
  margin-bottom: 0.4rem;
}
.log-item.info { color: #58a6ff; }
.log-item.tool { color: #d2a8ff; }`,

      '/app.js': `// Demo de aplicación con herramientas WebMCP
let count = 0;
const counterEl = document.getElementById('counter-val');
const logList = document.getElementById('log-list');

function addLog(msg, type = 'tool') {
  const item = document.createElement('div');
  item.className = 'log-item ' + type;
  const time = new Date().toLocaleTimeString();
  item.textContent = '[' + time + '] ' + msg;
  logList.appendChild(item);
  if (logList.children.length > 50) {
    logList.removeChild(logList.children[0]);
  }
  logList.scrollTop = logList.scrollHeight;
}

function updateDisplay() {
  counterEl.textContent = count;
}

document.getElementById('btn-inc').addEventListener('click', () => {
  count++;
  updateDisplay();
  addLog('Increment manual: ' + count, 'info');
});

document.getElementById('btn-dec').addEventListener('click', () => {
  if (count > 0) {
    count--;
    updateDisplay();
    addLog('Decrement manual: ' + count, 'info');
  } else {
    addLog('El contador no puede ser menor a 0', 'info');
  }
});

document.getElementById('btn-reset').addEventListener('click', () => {
  count = 0;
  updateDisplay();
  addLog('Reset manual: ' + count, 'info');
});

console.log('WebMCP Demo App iniciada correctamente.');
`,

      '/README.md': `# WebMCP Demo Application

Esta aplicación demuestra cómo un proyecto en el IDE expone componentes interactivos y herramientas WebMCP.
`,
    },
  },

  'canvas-game': {
    id: 'canvas-game',
    name: 'HTML5 Canvas Playground',
    description: 'Animación interactiva de partículas con HTML5 Canvas y física en tiempo real.',
    files: {
      '/index.html': `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Canvas Particle Playground</title>
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  <div class="header">
    <h1>Canvas Particles Playground</h1>
    <p>Haz clic y mueve el cursor para generar partículas.</p>
  </div>
  <canvas id="canvas"></canvas>
  <script src="./main.js"></script>
</body>
</html>`,

      '/style.css': `body {
  margin: 0;
  overflow: hidden;
  background: #0d1117;
  color: #fff;
  font-family: sans-serif;
}

.header {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 10;
  pointer-events: none;
}

h1 { margin: 0; font-size: 1.25rem; color: #58a6ff; }
p { margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #8b949e; }

canvas {
  display: block;
  width: 100vw;
  height: 100vh;
}`,

      '/main.js': `const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

const particles = [];
const colors = ['#58a6ff', '#3fb950', '#d2a8ff', '#f0883e', '#ff7b72'];

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 5;
    this.vy = (Math.random() - 0.5) * 5;
    this.radius = Math.random() * 4 + 2;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.alpha = 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 0.015;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function spawn(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push(new Particle(x, y));
  }
}

window.addEventListener('mousemove', (e) => spawn(e.clientX, e.clientY));
window.addEventListener('touchmove', (e) => {
  if (e.touches[0]) spawn(e.touches[0].clientX, e.touches[0].clientY);
});

function loop() {
  ctx.fillStyle = 'rgba(13, 17, 23, 0.2)';
  ctx.fillRect(0, 0, width, height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw();
    if (p.alpha <= 0) particles.splice(i, 1);
  }

  requestAnimationFrame(loop);
}

loop();
console.log('Playground de partículas canvas iniciado.');`,
    },
  },

  'kdd-knowledge': {
    id: 'kdd-knowledge',
    name: 'KDD Knowledge Base',
    description: 'Estructura OKF con especificaciones y contratos según la metodología KDD.',
    files: {
      '/knowledge/index.md': `---
type: 'Index'
title: 'Base de Conocimiento OKF'
description: 'Índice de especificaciones y contratos KDD.'
tags: ['kdd', 'okf']
---

# Base de Conocimiento del Proyecto

Bienvenido al espacio de conocimiento estructurado bajo el estándar Open Knowledge Format (OKF).

- [Arquitectura](./architecture/system.md)
- [Contrato de Tarea](./contracts/sample-task.md)
`,
      '/knowledge/architecture/system.md': `---
type: 'Architecture'
title: 'Arquitectura del Sistema'
description: 'Diseño conceptual de componentes.'
tags: ['kdd', 'architecture']
---

# Arquitectura

El sistema se compone de capas independientes comunicadas mediante contratos estrictos.
`,
      '/knowledge/contracts/sample-task.md': `---
type: 'Task Contract'
title: 'Tarea de Ejemplo'
description: 'Contrato híbrido OKF+CCDD.'
tags: ['ccdd', 'task']
task: 'sample_task'
intent: 'Validar ejecución de tareas'
target: 'src/main.js'
signature: 'function run(): void'
test_command: 'npm test'
budget:
  max_cyclomatic_complexity: 5
tests: 'tests/main.test.js'
touch_only: ['src/main.js']
deps_allowed: []
---

## Intent
Definición formal de la tarea.

## Interface
Firma y tipos.

## Invariants
Reglas invariantes del sistema.

## Examples
Casos de uso.

## Do / Don't
Buenas y malas prácticas.

## Tests
Pruebas congeladas.

## Constraints
Presupuesto de tokens y dependencias.
`,
      '/src/main.js': `export function run() {
  console.log('KDD Task running.');
}
`,
    },
  },
};
