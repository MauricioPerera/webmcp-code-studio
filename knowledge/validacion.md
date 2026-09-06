---
type: 'Concept'
title: 'Guía y Niveles de Validación KDD'
description: 'Criterios deterministas de verificación para contratos, oráculos de pruebas y conformidad OKF.'
tags: ['kdd', 'validation']
---

# Guía y Niveles de Validación KDD

El estándar KDD establece niveles deterministas de control de calidad:

## 1. Nivel 1: Validación Determinista Local
Obligatorio para dar por aceptado cualquier contrato:
1. `python scripts/validate_contracts.py knowledge/contracts`
   - Valida la presencia de campos obligatorios en el Frontmatter.
   - Comprueba la coincidencia exacta del hash SHA-256 en `tests_sha256`.
   - Verifica el perímetro de modificación en `touch_only`.
   - Exige las 7 secciones obligatorias en el cuerpo Markdown.
2. `python scripts/validate_okf.py knowledge`
   - Verifica que todo nodo OKF tenga frontmatter conforme.
   - Comprueba que todos los enlaces relativos resuelvan a archivos existentes.
   - Detecta y rechaza nodos huérfanos no alcanzables desde `index.md`.
3. `python scripts/lint_ascii.py scripts`
   - Asegura que los scripts de soporte mantengan codificación ASCII pura.
4. `npm test`
   - Ejecución de la suite completa de pruebas oráculo.

## 2. Enlaces Relacionados
- [Índice de la Base de Conocimiento](../knowledge/index.md)
- [Glosario KDD](./glosario.md)
