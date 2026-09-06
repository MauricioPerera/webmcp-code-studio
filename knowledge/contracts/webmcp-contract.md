---
type: 'Task Contract'
title: 'Contrato de Integración WebMCP con fastwebmcp'
description: 'Especificación y pruebas congeladas para el servicio de herramientas WebMCP en el navegador.'
tags: ['ccdd', 'webmcp', 'fastwebmcp', 'contract']
task: 'webmcp_service'
intent: 'Registrar y despachar herramientas del IDE usando fastwebmcp con validación tipada Zod y registro de auditoría'
target: 'src/core/webmcp-service.ts'
signature: 'export class WebMcpService'
test_command: 'npm test'
budget:
  cyclomatic_max: 15
tests: 'tests/webmcp.test.ts'
tests_sha256: '1cf3be50482b2be7fb6a8ff971ab2107a3dca6a20b4d0eb0745e1c403c9be09e'
touch_only: ['src/core/webmcp-service.ts']
deps_allowed: ['fastwebmcp', 'zod']
forbids: ['eval', 'Function']
---

## Intent
Definir, registrar y exponer las capacidades del IDE a agentes locales y externos usando la especificación WebMCP y la biblioteca `fastwebmcp`. Ver especificación en [webmcp-integration.md](../architecture/webmcp-integration.md).

## Interface
La clase `WebMcpService` ofrece:
- `getIsNativeSupported(): boolean`
- `getRegisteredTools(): WebMcpToolMetadata[]`
- `getToolMetadata(toolName: string): WebMcpToolMetadata | undefined`
- `getExecutionLogs(): WebMcpExecutionLog[]`
- `executeTool(toolName: string, args: Record<string, unknown>): Promise<unknown>`
- `registerCustomTool(options: unknown): void`
- `exposePublicBridge(): void`

## Invariants
1. Toda herramienta expuesta debe tener un nombre válido según el estándar WebMCP.
2. Cada argumento recibido debe ser validado por su esquema Zod correspondiente antes de la ejecución.
3. Toda ejecución es registrada con un identificador único, marca temporal, argumentos y resultado/error.
4. En ausencia de soporte nativo de `document.modelContext`, se activa el entorno mock sin arrojar excepciones fatales.

## Examples
- **Ejemplo 1 (Ejecutar herramienta ide_list_files):**
  ```ts
  import { webMcpService } from './src/core/webmcp-service';
  const result = await webMcpService.executeTool('ide_list_files', {});
  ```
- **Ejemplo 2 (Escribir archivo mediante herramienta WebMCP):**
  ```ts
  import { webMcpService } from './src/core/webmcp-service';
  await webMcpService.executeTool('ide_write_file', { path: '/hello.txt', content: 'World' });
  ```

## Do / Don't
- **DO:** Usar esquemas Zod explícitos para validar entradas y producir metadatos.
- **DO:** Marcar herramientas de solo lectura con `readOnlyHint: true`.
- **DON'T:** Invocar métodos destructivos sin registrar la auditoría correspondiente.
- **DON'T:** Exponer APIs que requieran acceso a backend en la especificación cliente.

## Tests
El oráculo formal de pruebas está congelado bajo el archivo [tests/webmcp.test.ts](../../tests/webmcp.test.ts) y verificado por el hash SHA-256 declarado en el Frontmatter.

## Constraints
- PARAR y reportar si se viola la sanitización de argumentos o si el registro de herramientas arroja error fatal.
- Dependencias estrictamente acotadas a `fastwebmcp` y `zod`.
- Aislamiento de ejecución para evitar caídas del hilo principal del navegador.
