---
type: 'Task Contract'
title: 'Contrato de Sandbox y Live Preview'
description: 'Especificación y pruebas congeladas para la ejecución en vivo e iframe aislado del IDE.'
tags: ['ccdd', 'sandbox', 'preview', 'contract']
task: 'sandbox_manager'
intent: 'Proveer un ejecutor de scripts JS seguro y empaquetado HTML con inyección de hooks de consola'
target: 'src/core/sandbox.ts'
signature: 'export class SandboxManager'
test_command: 'npm test'
budget:
  cyclomatic_max: 15
tests: 'tests/sandbox.test.ts'
tests_sha256: '9a95dc79c4dbf69d43d28defe8156b9dea45f0cf35f5c730fad0157a4225e92c'
touch_only: ['src/core/sandbox.ts']
deps_allowed: []
forbids: ['document.write']
---

## Intent
Gestionar la vista previa en vivo y la ejecución interactiva de código en el navegador mediante un iframe aislado con intercepción de consola (`postMessage`) y evaluación controlada de funciones asíncronas. Ver arquitectura general en [overview.md](../architecture/overview.md).

## Interface
La clase `SandboxManager` expone:
- `setIframe(iframe: HTMLIFrameElement): void`
- `generatePreviewHtml(): string`
- `updatePreview(): void`
- `executeJs(code: string): Promise<ExecutionResult>`

## Invariants
1. El código evaluado mediante `executeJs` no debe propagar excepciones no controladas al hilo del IDE.
2. Los mensajes de `console.log`, `console.warn` y `console.error` dentro del sandbox son capturados y canalizados al EventBus.
3. Los enlaces relativos a hojas de estilo `.css` y scripts `.js` dentro de `/index.html` son resueltos e inyectados en línea.

## Examples
- **Ejemplo 1 (Evaluación de código seguro):**
  ```ts
  import { sandboxManager } from './src/core/sandbox';
  const result = await sandboxManager.executeJs('console.log("hello"); return 42;');
  ```
- **Ejemplo 2 (Generación de HTML de vista previa):**
  ```ts
  import { sandboxManager } from './src/core/sandbox';
  const html = sandboxManager.generatePreviewHtml();
  ```

## Do / Don't
- **DO:** Inyectar el script de captura de consola al inicio de `<head>` o `<html>`.
- **DO:** Medir el tiempo de ejecución de las expresiones en milisegundos.
- **DON'T:** Confiar en la ejecución directa en el contexto global de la ventana principal.

## Tests
El oráculo formal de pruebas está congelado bajo el archivo [tests/sandbox.test.ts](../../tests/sandbox.test.ts) y verificado por el hash SHA-256 declarado en el Frontmatter.

## Constraints
- PARAR y reportar si se produce una fuga de excepciones en la evaluación que congele el IDE.
- Sin dependencias externas de ejecución.
- Iframe sandbox configurado con `allow-scripts allow-modals allow-same-origin`.
