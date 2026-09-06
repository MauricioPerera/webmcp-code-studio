---
type: 'Data Model'
title: 'Modelo de Datos: Sincronizacion Remota Git'
description: 'Estructuras de datos para configuracion remota, respuestas de Push y Pull para GitHub y Codeberg.'
tags: ['kdd', 'data-model', 'remote', 'github', 'codeberg']
---

# Modelo de Datos: Sincronizacion Remota Git

Define los esquemas y tipos de datos para la integracion de WebMCP Code Studio con forjas remotas de codigo.

## 1. Interfaz RemoteConfig
Almacena las credenciales y el repositorio remoto:
- `provider`: Proveedor remoto (`'github'` o `'codeberg'`).
- `repo`: Ruta del repositorio en formato `'usuario/repositorio'`.
- `branch`: Rama remota de trabajo (ej: `'main'`).
- `token`: Personal Access Token (PAT) opcional con permisos de lectura/escritura.
- `customBaseUrl`: URL base opcional para instancias corporativas o autohospedadas.

## 2. Interfaz RemotePushResult
Resultado tras completar una operacion de Push:
- `success`: Booleano que indica si el push fue exitoso.
- `provider`: Proveedor destino.
- `repo`: Repositorio destino.
- `branch`: Rama actualizada.
- `commitSha`: Identificador SHA del commit generado en el servidor remoto.
- `url`: Enlace URL web para visualizar el commit en la forja.
- `filesCount`: Cantidad de archivos publicados en el arbol.

## 3. Interfaz RemotePullResult
Resultado tras completar una operacion de Pull:
- `success`: Booleano que confirma la descarga exitosa.
- `provider`: Proveedor origen.
- `repo`: Repositorio origen.
- `branch`: Rama descargada.
- `filesUpdated`: Cantidad de archivos inyectados o actualizados en el VFS local.
- `message`: Mensaje descriptivo del resultado.

## 4. Enlaces Relacionados
- [Contrato Sincronizacion Remota](../contracts/remote-contract.md)
- [Modelo Git VCS](./git-model.md)
- [Indice de Conocimiento](../index.md)
