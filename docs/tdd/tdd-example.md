---
id: 0000
estado: Propuesto
autor: Nombre del autor
fecha: AAAA-MM-DD
titulo: Título descriptivo del cambio
jira: PROJ-000 # clave de la tarjeta en Jira (epic, story o task)
---

# TDD-0000: Título descriptivo del cambio

> Este archivo es una plantilla de referencia. Cada nuevo TDD debe copiarse a partir de esta estructura, numerarse (`TDD-0001`, `TDD-0002`, ...) y renombrarse con un slug descriptivo, por ejemplo `TDD-0004-leads-abandono.md`. El diseño debe describirse en términos de responsabilidades y contratos, sin acoplarse a una tecnología, framework o proveedor concreto — esos detalles pueden cambiar en el futuro sin que el TDD deje de ser válido.

## Seguimiento en Jira

* Tarjeta principal: [`PROJ-000`](https://jira.example.com/browse/PROJ-000)
* Sub-tareas relacionadas: `PROJ-001`, `PROJ-002`, ...
* El estado del frontmatter (`Propuesto` / `En revisión` / `Aprobado` / `Implementado`) debe reflejar el estado real de la tarjeta en el tablero.

## Contexto de Negocio (PRD)

### Objetivo

Qué necesidad de negocio origina este diseño y qué se busca lograr. Un objetivo concreto y verificable.

### User Persona

* Nombre: rol o tipo de usuario que interactúa con esta funcionalidad.
* Necesidad: qué problema concreto resuelve para esa persona.

### Criterios de Aceptación

* Condición observable que el sistema debe cumplir.
* Condición observable que el sistema debe cumplir.
* Regla de negocio que no debe poder violarse.

## Diseño Técnico (RFC)

### Modelo de Datos

Descripción de la entidad (o entidades) involucradas, en términos conceptuales — no como definición de un ORM ni motor de base de datos particular.

* `<entidad>`
  * `id`: identificador único.
  * `<atributo>`: tipo y restricciones de negocio.
  * `<relación>`: referencia a otra entidad del dominio.
  * `deletedAt` / equivalente: marca de baja lógica, si aplica.
  * `createdAt` / `updatedAt`: marcas de auditoría temporal.

### Contrato de la interfaz expuesta

Definir el contrato de entrada/salida de forma agnóstica al protocolo de transporte (podría ser HTTP, mensajería, RPC, CLI). Formato sugerido: **éxito** devuelve el dato solicitado; **error** devuelve un mensaje en español identificable por código.

* Operación: `<verbo> <recurso>` (ej. "actualizar póliza", independiente de si se expone como `PUT /recurso/:id` u otro mecanismo).
* Entrada:

```txt
<campo>?: <tipo>   // opcional, se conserva el valor actual si se omite
<campo>?: <tipo>
```

* Salida esperada:

```txt
{
  <campos de la entidad actualizada>
}
```

Los campos omitidos en la entrada conservan su valor actual (actualización parcial).

### Componentes y responsabilidades

Describir el diseño por responsabilidad, no por clase o archivo concreto, para que sea portable entre stacks:

1. **Puerto de dominio**: contrato que define qué operaciones necesita el caso de uso sobre la entidad, sin conocer el mecanismo de persistencia.
2. **Caso de uso**: lógica de negocio — valida existencia, coherencia del estado final y reglas de negocio antes de persistir.
3. **Adaptador de persistencia**: implementación concreta del puerto (el motor de base de datos o almacenamiento es un detalle de implementación, no de diseño).
4. **Adaptador de entrada**: punto de entrada que traduce la interacción externa (HTTP, cola de mensajes, CLI, etc.) a una invocación del caso de uso.

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Categoría de error |
|---|---|---|
| Recurso inexistente | Mensaje de error indicando que no existe | No encontrado |
| Solicitud sin campos a actualizar | Mensaje pidiendo al menos un campo | Solicitud inválida |
| Estado final inconsistente (ej. fechas, relaciones) | Mensaje describiendo la regla violada | Solicitud inválida |
| Datos con formato inválido | Mensaje de formato inválido | Solicitud inválida |
| Falla de la capa de persistencia | Mensaje genérico de reintento | Error interno |
| Recurso dado de baja lógicamente | Mensaje indicando que no se puede editar un recurso desactivado | Solicitud inválida |

## Plan de Implementación

1. Tarea concreta (vincular con la sub-tarea de Jira correspondiente).
2. Tarea concreta.
3. Tarea concreta.
4. Integración con la interfaz de usuario o consumidor final.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| ... | ... | ... |

## Plan de pruebas

Qué se va a testear y cómo (unitario del caso de uso, integración del adaptador de persistencia, prueba manual en staging).

## Referencias

* Documentación relacionada en `docs/03-tecnico/`.
