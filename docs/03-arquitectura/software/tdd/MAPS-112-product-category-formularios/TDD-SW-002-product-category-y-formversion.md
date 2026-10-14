# TDD — Product, Category, formularios y FormVersion

| Dato | Valor |
| --- | --- |
| ID | `TDD-SW-002` |
| Título | Product, Category, formularios y FormVersion |
| Estado | `APROBADO` |
| Fecha | 2026-10-12 |
| Autor | Joaquin Rodriguez |
| Revisores | Santiago Talavera (revisión cruzada cloud sobre publicación, almacenamiento y consistencia); pendiente de validación final |
| Work item | [MAPS-112](https://santitalavera.atlassian.net/browse/MAPS-112) · subtarea pendiente de identificar |
| URL del work item | https://santitalavera.atlassian.net/browse/MAPS-112 |
| Fase origen | [F0 §0.2/0.3](../../../../00-proyecto/Fase_0__Kickoff__Gobierno_del_proyecto_.md), [F1 §4/7, RN-08/09/13, RF-PROD-01, RF-CAT-01, RF-FORM-01, RF-SOL-04](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md), [F2 §9/10](../../../../02-diseno/Fase_2__Design_Handoff.md) |
| Decisiones relacionadas | [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md); [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md); [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md); [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md); [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md); [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md); TDD-SW-004, TDD-SW-006 y TDD-SW-008 (previstos, sin redactar) |
| Depende de | ADR-SW-001, ADR-SW-002 y ADR-SW-003 (`ACEPTADO`); TDD-SW-001 (`APROBADO`). Contrato definitivo de formularios: `PENDIENTE FUNCIONAL MAPS` |
| Reemplaza | No aplica |
| Reemplazado por | No aplica |

> Estados válidos: `BORRADOR`, `EN REVISIÓN`, `APROBADO`, `REEMPLAZADO`.

## Propósito y límites

Diseña los módulos **Catalog** (Category, Product, precio y publicación) y **Forms** (FormDefinition, FormVersion y su esquema) con sus reglas de versionado, retiro, disponibilidad y precio. Define los puertos de lectura que [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md) consume desde Requests (`CatalogQueryPort`, `FormsQueryPort`).

No fija:

- el conjunto definitivo de propiedades de los campos de formulario, que depende de validar 1–2 casos reales con MAPS;
- el almacenamiento binario de los campos tipo `file` (TDD-SW-006);
- el RBAC detallado de Admin (TDD-SW-004) ni el contrato HTTP (TDD-SW-008).

## Baseline y dependencias

| Regla / dependencia | Fuente y estado | Impacto en el diseño |
| --- | --- | --- |
| Product con precio fijo vigente, información comercial y publicación administradas por MAPS | RF-PROD-01 — CONFIRMADO | Product con precio como revisión histórica y bandera de publicación |
| Categorías con ABM (crear, editar y renombrar) sin cambios de código | RN-13, RF-CAT-01 — CONFIRMADO | Category con ABM. F2 ADM-06 muestra además "estado" y "conflicto de uso", sin definir su semántica; ver [Decisiones abiertas](#decisiones-abiertas) |
| FormVersion PUBLICADA inmutable; un cambio produce una versión nueva | RN-08, [F2 §10](../../../../02-diseno/Fase_2__Design_Handoff.md) — CONFIRMADO | El esquema sólo es editable en BORRADOR |
| Product disponible o publicado requiere al menos una versión utilizable | [F2 §10](../../../../02-diseno/Fase_2__Design_Handoff.md), tabla de versionado F1 §4 — CONFIRMADO | Disponibilidad derivada; el retiro normal de la última versión se bloquea |
| Retiro urgente deja el Product no disponible hasta publicar reemplazo | F2 §10 — CONFIRMADO | Disponibilidad derivada sin escritura cruzada entre módulos |
| Precio cambiado con BORRADOR se informa y reconfirma; ENVIADA conserva el precio confirmado | RN-09, RF-SOL-04 — CONFIRMADO | Revisión de precio con referencia estable (ver [Precio](#precio)) |
| Tipos y propiedades de campos | F1 §4 — preliminar/candidato; `PENDIENTE FUNCIONAL MAPS` | Se modelan tipos del contrato candidato y estructura de versionado; las propiedades finales quedan condicionadas |
| Enlatados del prototipo (PR #19, pendiente de merge): Combinado Familiar, Incendio, Mascotas y Retiro | PR #19 — en revisión | Hay productos sin formulario propio en el prototipo; ver [Decisiones abiertas](#decisiones-abiertas) |
| Listado público sólo de productos activos, sin autenticación, ordenado por nombre | Antecedente TDD-0001 (MAPS-55, rama `docs/MAPS-55-tdd-catalogo-productos-enlatados`, sin merge) | Sólo antecedente. La baseline vigente es F2 §7 (PUB-01): catálogo público de Products publicados con categoría, precio y disponibilidad. Paginación, búsqueda y filtro se detallan en TDD-SW-008 |
| PostgreSQL histórico de MAPS descartado como dependencia | [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md) | Catálogo y formularios viven en la base nueva del Portal |

## Vista de componentes y responsabilidades

```text
Catalog (owner de Category, Product, ProductAttribute y ProductPriceRevision)
├── domain/
│   ├── Product                  agregado: publicación, ficha, referencia de precio vigente, versión de concurrencia
│   ├── ProductPriceRevision     registro inmutable de monto ARS y fecha de vigencia
│   ├── Category                 agrupación ABM
│   └── ProductAvailability      regla pura: disponible = publicado ∧ precio vigente ∧ versión utilizable
├── application/                 ABM de Category, ABM de Product, publicar, cambiar precio, consulta pública
├── ports/in/
│   ├── CatalogQueryPort         precio vigente, disponibilidad y snapshot comercial (lo usa Requests)
│   └── CatalogPublicQuery       listado público de productos publicados
└── ports/out/                   ProductRepository, CategoryRepository, FormsQueryPort, AuditPort

Forms (owner de FormDefinition y FormVersion)
├── domain/
│   ├── FormVersion              agregado: estados BORRADOR / PUBLICADA / RETIRADA
│   ├── FormSchema               validación estructural del esquema al publicar
│   └── FieldDefinition          tipo, requerido, opciones, rangos y orden
├── application/                 crear BORRADOR, editar, publicar, retiro normal, retiro urgente
├── ports/in/
│   ├── FormsQueryPort           versión vigente, utilizabilidad y validación de completitud (lo usa Requests)
│   └── FormsAdminPort           gestión de versiones desde el panel Admin
└── ports/out/                   FormVersionRepository, AuditPort, OutboxPort (aviso de retiro urgente, ADR-SW-004)
```

**Dirección de dependencias.** Catalog consulta a Forms para calcular disponibilidad y validar publicación. Forms **no** consulta a Catalog: la existencia del Product se garantiza con la clave foránea `FormDefinition.productId`, que ADR-SW-003 permite para integridad. Así no hay ciclos de llamada entre módulos.

Esta dependencia Catalog → Forms **no figura** en la dirección esperada de [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), que sólo lista Requests → Catalog/Forms/Identity y Assignment → Requests/Identity. No es circular, pero es una adición que ADR-SW-001 debe registrar antes de aceptarse. La alternativa sin dependencia entre ambos es que Requests o la capa de consulta compongan `publicado` (Catalog) con `versión utilizable` (Forms); se descarta como propuesta porque ADR-SW-001 asigna "disponibilidad" a Catalog. Ver [Decisiones abiertas](#decisiones-abiertas).

**Disponibilidad calculada, no almacenada.** Catalog no guarda un flag de "disponible". Lo calcula al leer. Como Forms nunca escribe en la tabla de Product, un retiro urgente no requiere escritura cruzada: el Product deja de estar disponible en la misma transacción que retira la versión, sin un segundo cambio que pueda quedar desincronizado.

## Modelo de datos

### Category

| Campo | Regla |
| --- | --- |
| `id` | Identificador interno |
| `nombre` | Obligatorio; editable y renombrable (RF-CAT-01) |
| `slug` | Único e inmutable tras la creación (decisión técnica heredada de TDD-0001) |
| `estado` | F2 ADM-06 lo muestra en pantalla. Valores y efectos sin definir en F1/F2; no se modela hasta cerrarlo |
| `createdAt`, `updatedAt` | Auditoría temporal |

RF-CAT-01 sólo confirma crear, editar y renombrar. No hay eliminación física de Category y todo Product tiene una Category. El "conflicto de uso" de ADM-06 se interpreta, como mínimo, como nombre o `slug` duplicado.

### Product

| Campo | Regla |
| --- | --- |
| `id` | Identificador interno |
| `nombre` | Obligatorio |
| `resumenComercial` | Texto breve para la grilla y el snapshot de la solicitud |
| `categoryId` | Obligatorio (`Category 1 — * Product`) |
| `publicado` | Bandera administrada por MAPS. Publicar exige precio vigente y versión utilizable en ese momento |
| `currentPriceRevisionId` | Referencia a la revisión de precio vigente |
| `imagenRef` | Opcional; referencia a almacenamiento de objetos, nunca binario |
| `version` | Control optimista de concurrencia |

**Disponibilidad (derivada, no persistida):**

```text
disponible(Product) = publicado
                    ∧ existe currentPriceRevisionId
                    ∧ existe FormVersion PUBLICADA y no RETIRADA para su FormDefinition
```

El catálogo público y `CreateDraft` de Requests usan esta misma regla. Un Product no `publicado` nunca sale en la consulta pública. Un Product `publicado` y no disponible no admite iniciar una solicitud; si además se lista con la marca "no disponible" o se oculta es una decisión de UX abierta (F2 PUB-01 menciona "disponibilidad" y un estado "no disponible").

### ProductAttribute (ficha)

Entidad genérica, como en TDD-0001: `id`, `productId`, `nombre` (p. ej. "Qué cubre", "Exclusiones", "Respaldo"), `descripcion`, `orden`. Permite que cada enlatado tenga un conjunto distinto de atributos sin agregar columnas por tipo. La ficha se muestra en el detalle y se copia al snapshot de la solicitud al enviar.

### ProductPriceRevision

| Campo | Regla |
| --- | --- |
| `id` | Es la **referencia de precio** que usan Requests (`draftPriceRef`, `confirmedPriceRef`, `priceSnapshot`) |
| `productId` | Obligatorio |
| `monto` | Decimal con 2 decimales. Nunca `float` |
| `moneda` | `ARS` en el MVP |
| `vigenteDesde`, `creadoPor` | Auditoría |

**Inmutable:** una revisión nunca se actualiza. Cambiar el precio inserta una revisión nueva y apunta `currentPriceRevisionId` a ella. Por eso una solicitud compara por **referencia**, no por monto: un precio que vuelve a un valor anterior (A → B → A) sigue siendo un cambio detectable.

### FormDefinition

| Campo | Regla |
| --- | --- |
| `id` | Identificador interno |
| `productId` | Único (`Product 1 — 0..1 FormDefinition`); clave foránea a Product |

### FormVersion

| Campo | Regla |
| --- | --- |
| `id` | Identificador interno; es la `formVersionId` que fija Requests al crear el BORRADOR |
| `formDefinitionId` | Obligatorio |
| `numero` | Nulo en `BORRADOR`. Se asigna al publicar como el siguiente entero de la FormDefinition; único cuando no es nulo |
| `estado` | `BORRADOR`, `PUBLICADA` o `RETIRADA` |
| `schema` | Documento JSON validado (ver [Esquema candidato](#esquema-candidato)). Editable sólo en `BORRADOR` |
| `schemaVersion` | Versión del contrato de esquema (`1` en el MVP) |
| `publicadaAt`, `publicadaPor` | Se fijan al publicar |
| `retiradaAt`, `retiradaPor`, `tipoRetiro`, `motivoRetiro` | `tipoRetiro`: `NORMAL` o `URGENTE`; `motivoRetiro`: legal, seguridad, comercial, vigencia u otro crítico aprobado |
| `version` | Control optimista de concurrencia |

### Esquema candidato

El esquema es un documento versionado por `schemaVersion`, con pasos y campos. Las propiedades de los campos siguen el contrato candidato de F1 §4 y **no son definitivas**:

```text
{
  "schemaVersion": 1,
  "pasos": [
    {
      "key": "datos-del-riesgo",
      "titulo": "Datos del riesgo",
      "orden": 1,
      "campos": [
        {
          "key": "direccion",
          "tipo": "text",
          "label": "Dirección del inmueble",
          "helpText": "Calle, número y localidad",
          "placeholder": "",
          "requerido": true,
          "orden": 1
        }
      ]
    }
  ]
}
```

- **Tipos cerrados** del contrato candidato: `text`, `textarea`, `number`, `date`, `select`, `radio`, `checkbox`, `file`.
- `key` es estable dentro de una FormDefinition. Una versión nueva puede conservar las mismas claves, pero **no se migran ni copian respuestas** (RN-08): cada `RequestAnswer` apunta a la FormVersion con la que se creó el BORRADOR.
- `opciones` sólo en `select`, `radio` y `checkbox`. `min`/`max` sólo en `number` y `date`. `file` referencia reglas de TDD-SW-006.

**Persistencia.** El esquema se guarda como JSON dentro de `FormVersion`. Es una excepción documental deliberada: el esquema es un documento versionado e inmutable tras publicar, que nunca se consulta relacionalmente. Las respuestas siguen siendo relacionales (`RequestAnswer`, TDD-SW-001). Esta excepción debe revisarse con ADR-SW-003.

## Contratos y flujos

### Puertos que consume Requests

| Puerto | Operación | Devuelve |
| --- | --- | --- |
| `CatalogQueryPort` | `obtenerParaSolicitud(productId)` | `disponible`, `precioRef`, `monto`, `moneda`, `productSnapshot` (nombre, categoría, resumen comercial, ficha) |
| `CatalogQueryPort` | `precioVigente(productId)` | `precioRef`, `monto`, `moneda`; lo usa `ConfirmPrice` y `Submit` |
| `FormsQueryPort` | `versionVigente(productId)` | `formVersionId` de la versión PUBLICADA y no retirada de mayor `numero` |
| `FormsQueryPort` | `esUtilizable(formVersionId)` | `true` si su estado es `PUBLICADA` |
| `FormsQueryPort` | `validarRespuestasParciales(formVersionId, respuestas)` | Verifica que cada respuesta corresponda a un campo de esa versión y a su tipo, **sin** exigir requeridos. Lo usa `SaveDraft` (RN-03, F2 §9) |
| `FormsQueryPort` | `validarCompletitud(formVersionId, respuestas)` | Resultado `ok` o lista de errores por `key`, para `SOLICITUD_INCOMPLETA` |

### Flujos de Forms

**Crear BORRADOR de versión.** Puede partir de una copia del esquema de la última versión. La copia es una versión nueva, no una migración de respuestas.

**Publicar FormVersion** (una transacción):

1. Validar el esquema (ver reglas de validación más abajo). Si falla, `ESQUEMA_INVALIDO` con detalle por campo y sin cambios.
2. Verificar `version` de concurrencia.
3. Marcar `PUBLICADA`, fijar `numero`, `publicadaAt` y `publicadaPor`.
4. Registrar `AuditEvent`.

Publicar no retira la versión anterior: los BORRADOR existentes conservan su versión mientras siga utilizable (F2 §10).

**Retiro normal** (una transacción): sólo si existe **otra** versión PUBLICADA y no retirada. Si no, `RETIRO_BLOQUEADO_ULTIMA_VERSION`. Efecto: `RETIRADA`, `tipoRetiro = NORMAL`, auditoría.

**Retiro urgente** (una transacción, con confirmación fuerte del Admin: motivo y confirmación explícita):

1. `RETIRADA`, `tipoRetiro = URGENTE`, motivo, auditoría.
2. Si era la única versión utilizable, el Product queda no disponible por la regla derivada, sin escribirlo.
3. Los BORRADOR que la usan pasan a no utilizables por la misma regla (`FormsQueryPort.esUtilizable`), sin estado nuevo.
4. `OutboxEvent` de aviso (ADR-SW-004, catálogo de eventos), **sujeto a validación funcional de MAPS**.

Una versión `RETIRADA` no se restaura ni reactiva en el MVP.

**Cambiar precio** (una transacción): insertar `ProductPriceRevision`, apuntar `currentPriceRevisionId`, auditar monto anterior y nuevo. No modifica solicitudes existentes: ENVIADA conserva su snapshot y BORRADOR detecta la diferencia de referencia.

**Publicar Product** (una transacción): exige precio vigente y versión utilizable en ese momento; si no, `PRODUCTO_SIN_VERSION_UTILIZABLE` o `PRECIO_NO_CONFIGURADO`.

**Consulta pública** (F2 PUB-01/PUB-02, sin autenticación): devuelve productos `publicado` con categoría, precio vigente y el indicador `disponible`, en orden determinístico por `nombre`. No expone versiones, esquemas ni precios históricos.

### Reglas de validación del esquema (al publicar)

- `key` único dentro de la versión, entre campos y pasos.
- `tipo` dentro del conjunto cerrado.
- `select`, `radio` y `checkbox` con al menos una opción; valores de opción únicos.
- `min` ≤ `max` cuando ambos existen.
- Al menos un paso con al menos un campo.
- `schemaVersion` soportada.

### Errores observables

| Código | Cuándo |
| --- | --- |
| `ESQUEMA_INVALIDO` | Falla alguna regla de validación; incluye detalle por campo |
| `VERSION_NO_EDITABLE` | Intento de editar una versión `PUBLICADA` o `RETIRADA` |
| `PRODUCTO_SIN_VERSION_UTILIZABLE` | Publicar un Product sin versión utilizable |
| `RETIRO_BLOQUEADO_ULTIMA_VERSION` | Retiro normal de la única versión utilizable |
| `CONFIRMACION_RETIRO_REQUERIDA` | Retiro urgente sin confirmación fuerte |
| `PRECIO_NO_CONFIGURADO` | Publicar un Product sin precio vigente |
| `PRECIO_INVALIDO` | Monto ≤ 0 o moneda distinta de ARS |
| `CATEGORIA_REQUERIDA` | Product sin Category |
| `CONFLICTO_CONCURRENCIA` | `version` leída distinta de la actual |

## Datos, consistencia y migraciones

### Tablas lógicas

`category`, `product`, `product_attribute`, `product_price_revision`, `form_definition`, `form_version`.

### Restricciones

- `category.slug` único e inmutable.
- `form_definition.product_id` único.
- `form_version (form_definition_id, numero)` único cuando `numero` no es nulo. Es lo que resuelve dos publicaciones concurrentes.
- `product_price_revision`: sin `UPDATE`; reforzado con permisos o trigger, a validar en TDD-CLD-003.
- `form_version.schema` sólo modificable si `estado = 'BORRADOR'`; reforzado con trigger además de la regla de dominio, a validar en TDD-CLD-003.

### Transacciones

Cada operación de la sección [Flujos de Forms](#flujos-de-forms) y de Catalog es **una** unidad de trabajo que incluye auditoría y, cuando corresponde, el `OutboxEvent`. Ninguna escribe en otro módulo: Forms y Catalog sólo leen entre sí por puertos.

### Migraciones

Esquema versionado con expand/contract ([ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md)). Sin migración de datos desde el PostgreSQL histórico de MAPS. Los productos del prototipo se cargan como datos semilla controlados, no como migración.

### Retención

Sin borrado físico de Product, FormVersion ni ProductPriceRevision en el MVP. Retirar y despublicar son marcas. Plazos de retención: `PENDIENTE FUNCIONAL MAPS`.

## Seguridad y privacidad

- Escritura sólo para el rol Admin, aplicada en la capa de aplicación según [ADR-SW-005](../../adr/MAPS-111-identidad-autorizacion/ADR-SW-005-identidad-y-autorizacion.md) y TDD-SW-004 (previsto).
- La consulta pública no expone versiones, esquemas ni precios históricos.
- El esquema de una versión publicada sólo lo ve un Cliente cuando crea o retoma un BORRADOR (F2 §9), a través de Requests.
- Auditoría con actor, acción, entidad y fecha. Sin PII: estos registros no contienen datos de clientes.
- Campos `file`: el acceso y almacenamiento de archivos los define TDD-SW-006.

## Operación y observabilidad

- Auditoría de publicar, editar esquema, retirar (normal y urgente), cambiar precio y publicar/despublicar Product.
- Métrica: Products `publicado` sin versión utilizable (debe ser cero; si no, alerta).
- Métrica: retiros urgentes ejecutados (evento de baja frecuencia que requiere atención).
- Cache del listado público y encabezados HTTP: TDD-SW-008 y TDD-CLD-007.

## Pruebas y criterios de fallo

Unitarias sobre el dominio, sin infraestructura:

- Transiciones válidas e inválidas de `FormVersion`; `PUBLICADA` y `RETIRADA` rechazan edición.
- Validación del esquema: cada regla de la lista, con un caso positivo y uno negativo.
- Retiro normal bloqueado cuando es la última versión utilizable.
- Retiro urgente deja el Product no disponible y los BORRADOR no utilizables, sin escribir Product.
- Precio A → B → A: cada cambio produce una referencia distinta; un snapshot anterior no se altera.
- Disponibilidad derivada: un Product publicado sin versión utilizable devuelve `disponible = false` y `CreateDraft` lo rechaza.
- Consulta pública: nunca incluye productos no publicados; orden por `nombre`.

De aplicación (con dobles de puertos) e integración (con base real):

- Publicar con error de esquema no deja la versión en `PUBLICADA` ni registra auditoría.
- Publicar Product y auditoría quedan atómicos: un fallo intermedio no deja cambios parciales.
- Retiro urgente: el `OutboxEvent` existe si y sólo si la transacción confirma.
- Dos publicaciones concurrentes de versiones distintas de la misma FormDefinition: ambas quedan `PUBLICADA` con `numero` distinto; la que choca con el índice único reintenta con el siguiente. Dos publicaciones de la misma versión: una gana y la otra recibe `CONFLICTO_CONCURRENCIA`.
- Cambio de precio concurrente con la creación de un BORRADOR: el BORRADOR queda con la referencia que realmente vio.

## Implementación y handoff a F4

Secuencia sugerida: validador de esquema y máquina de estados de `FormVersion` → Category ABM → Product y revisiones de precio → publicación y disponibilidad → puertos para Requests → aviso de retiro urgente (tras validación MAPS).

Dependencias: TDD-SW-006 para campos `file`; TDD-SW-004 para RBAC; TDD-SW-008 para el contrato HTTP. No se definen Epic ni Issues F4 en este documento.

## Decisiones abiertas

| Tema | Responsable | Qué puede avanzar | Condición de cierre |
| --- | --- | --- | --- |
| Propiedades definitivas de los campos de formulario | MAPS + Kondor | Tipos, versionado, `key` estable y referencia de respuestas | Validar 1–2 formularios reales (`PENDIENTE FUNCIONAL MAPS`) |
| Productos sin formulario en el prototipo (Incendio y Retiro) frente a "publicado requiere versión utilizable" (F2 §10) | MAPS | Modelo de disponibilidad y consulta pública | MAPS decide si esos productos tienen formulario, o se publican sólo como informativos. Cambiaría la regla de publicación |
| Dependencia Catalog → Forms para calcular disponibilidad | Software | Puertos y regla derivada | Registrarla en ADR-SW-001 antes de su aceptación, o mover la composición fuera de Catalog |
| `estado` de Category y "conflicto de uso" (F2 ADM-06) | Kondor (F2) + MAPS | Crear, editar y renombrar | Definir valores del estado y su efecto sobre los Products de la categoría |
| Products publicados y no disponibles en el catálogo público | Kondor (F2) | Indicador `disponible` en la consulta | Decidir si se listan con la marca "no disponible" o se ocultan |
| Aviso de retiro urgente a los BORRADOR afectados | MAPS | Outbox y plantilla técnica | Validación funcional del aviso (ADR-SW-004 lo marca como propuesta) |
| Precio en la ficha: el prototipo muestra texto de ficha; el dominio modela monto ARS | MAPS | Modelo numérico con 2 decimales | Confirmar formato, impuestos incluidos o no, y moneda |
| Bandera `publicado` del prototipo (`active:false`) frente a `publicado` del dominio | Kondor | Mismo significado de ocultar y publicar | Confirmar equivalencia al mergear el prototipo |
| Retención de versiones, precios y productos despublicados | MAPS | Marcas sin borrado físico | Plazos y eliminación aprobados |

## Referencias y trazabilidad

- ADR y TDD relacionados: [ADR-SW-001](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-001-monolito-modular-y-limites.md), [ADR-SW-002](../../adr/MAPS-107-estilo-arquitectonico-limites/ADR-SW-002-arquitectura-hexagonal-y-capas.md), [ADR-SW-003](../../adr/MAPS-108-persistencia-fronteras-transaccionales/ADR-SW-003-persistencia-y-fronteras-transaccionales.md), [ADR-SW-004](../../adr/MAPS-110-asincronia-outbox-idempotencia/ADR-SW-004-outbox-asincronia-e-idempotencia.md), [TDD-SW-001](../MAPS-109-modelo-dominio-datos/TDD-SW-001-modelo-de-dominio-y-datos.md), [TDD-SW-003](../MAPS-113-insurance-request-estados/TDD-SW-003-insurance-request-y-maquina-de-estados.md); previstos TDD-SW-004, TDD-SW-006, TDD-SW-008.
- Antecedente sin mergear: `docs/tdd/TDD-0001-catalogo-productos-enlatados.md` (rama `docs/MAPS-55-tdd-catalogo-productos-enlatados`). Aporta `Atributo` y el listado público; este documento lo reemplaza para el modelo de Product y FormVersion cuando se mergee.
- Fuentes F0/F1/F2: [F1 §4/7, RN-08/09/13, RF-PROD-01, RF-CAT-01, RF-FORM-01, RF-SOL-04](../../../../01-producto/Fase_1__Discovery_y_Relevamiento.md); [F2 §9/10](../../../../02-diseno/Fase_2__Design_Handoff.md).
- Filas de [traceability.md](../../../traceability.md): Product/FormVersion; contrato dinámico de formularios; ABM de categorías.

## Criterio de aprobación

Puede pasar a `EN REVISIÓN` cuando Santiago complete la revisión cruzada de publicación y almacenamiento, y la decisión sobre productos sin formulario esté registrada. Pasa a `APROBADO` cuando ADR-SW-001/002/003 estén `ACEPTADO`, TDD-SW-001 esté `APROBADO` y las propiedades de formularios estén validadas con MAPS.
