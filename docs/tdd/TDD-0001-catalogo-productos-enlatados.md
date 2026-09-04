---
id: 0001
estado: Propuesto
autor: Joaco Rodriguez
fecha: 2026-07-09
titulo: Catálogo de productos enlatados
jira: MAPS-55
---

# TDD-0001: Catálogo de productos enlatados

## Seguimiento en Jira

* Tarjeta principal: [`MAPS-55`](https://santitalavera.atlassian.net/browse/MAPS-55)
* Épica/Principal: `MAPS-9` — Gestión de catálogo
* El estado del frontmatter (`Propuesto` / `En revisión` / `Aprobado` / `Implementado`) debe reflejar el estado real de la tarjeta en el tablero (actualmente **Por hacer**).

## Contexto de Negocio (PRD)

### Objetivo

Permitir que cualquier visitante, sin necesidad de estar autenticado, navegue una grilla con los productos enlatados disponibles (precio fijo, sin cotización personalizada) para poder comparar las opciones antes de iniciar una contratación.

### User Persona

* Nombre: Visitante (usuario anónimo, sin sesión iniciada).
* Necesidad: comparar de forma rápida los productos enlatados disponibles — nombre, precio y datos principales — antes de decidir avanzar hacia el detalle o la contratación de uno de ellos.

### Criterios de Aceptación

* El visitante puede ver una grilla con los productos enlatados activos, sin necesidad de iniciar sesión.
* Cada card de la grilla muestra al menos: nombre del producto, precio fijo y una breve descripción/resumen.
* La grilla es responsive y se adapta correctamente a mobile, tablet y desktop.
* Los productos dados de baja (inactivos) no se muestran en la grilla pública.
* Si no hay productos disponibles, se muestra un estado vacío claro en lugar de una grilla en blanco o un error.
* La información se obtiene desde un endpoint público (no requiere autenticación).

## Diseño Técnico (RFC)

### Modelo de Datos

* `Producto`
  * `id`: identificador único.
  * `nombre`: texto, obligatorio.
  * `slug`: identificador legible para URL, único.
  * `descripcion`: texto breve para la card de la grilla.
  * `precio`: valor fijo, decimal (no float binario, para evitar errores de redondeo), en pesos argentinos (ARS), mayor a cero.
  * `categoria`: referencia a `Categoria` (relación `Categoria 1 — * Producto`).
  * `estado`: `ACTIVO` / `INACTIVO`, determina si aparece en la grilla pública.
  * `imagen`: referencia opcional (URL) a un recurso visual de la card — se guarda como enlace a un almacenamiento de objetos/CDN, no como archivo binario en la base de datos.
  * `deletedAt`: marca de baja lógica, si aplica.
  * `createdAt` / `updatedAt`: marcas de auditoría temporal.

* `Categoria`
  * `id`: identificador único.
  * `nombre`: texto, obligatorio.
  * `slug`: identificador legible para URL, único, inmutable una vez creado.

* `Atributo` (atributo adicional de un producto — ej. cobertura, exclusión, requisito, peso, presentación)
  * `id`: identificador único.
  * `nombre`: texto, obligatorio.
  * `descripcion`: texto.
  * `productoId`: referencia a `Producto` (relación `Producto 1 — 0..* Atributo`).

> **Nota de modelado**: se optó por una entidad genérica `Atributo` en lugar de entidades fijas (`Coverage`, `Exclusion`, `Requirement`) porque cada seguro enlatado puede tener un conjunto distinto de atributos — un modelo fijo obligaría a agregar columnas o entidades nuevas cada vez que MAPS defina un tipo de atributo no contemplado. Esta decisión reemplaza el modelo de `Coverage`/`Exclusion`/`Requirement` propuesto en `docs/estructura.md` (documento ya actualizado en consecuencia). `Atributo` no se muestra en la grilla pública — se consume en la vista de detalle de producto, a definir en un TDD aparte.

> **Fuera de alcance de este TDD**: el modelado de `Usuario`, `Suscripcion`, `Pago` y `Poliza` corresponde al flujo de autenticación/contratación, no a la grilla pública sin sesión que cubre este documento. Se van a definir en un TDD aparte. Al modelarlos, aplicar las mismas correcciones detectadas en esta revisión: fechas como tipo `date` (no `int`), montos con soporte decimal (no `int`), textos como `string` (no `int`/`char`), `foto`/`documento` como `url` (no `archivo`), y evitar duplicar `precio` fuera de `Producto` — si se necesita un precio congelado al momento de la contratación, modelarlo como un campo explícito (`precioHistorico`) y no repetir `precio`.

### Contrato de la interfaz expuesta

* Operación: `listar productos` — expuesta públicamente como `GET /api/products`, sin requerir autenticación. Este endpoint solo devuelve productos activos, siempre (ver "Componentes y responsabilidades" para el listado administrativo).
* Entrada:

```txt
page?: number      // opcional, default 1
pageSize?: number  // opcional, default 12, máximo 50 (valores fuera de rango se clampean)
categoria?: string // opcional, filtro por slug de categoría
```

* Salida esperada (éxito):

```txt
{
  items: [
    {
      id: string,
      nombre: string,
      slug: string,
      descripcion: string,
      precio: number,
      categoria: { nombre: string, slug: string },
      imagen?: string
    },
    ...
  ],
  page: number,
  pageSize: number,
  total: number
}
```

* Orden: los items se devuelven ordenados por `nombre` ascendente, para garantizar un orden determinístico entre páginas.
* Salida esperada (sin resultados): mismo contrato, con `items: []` y `total: 0` — no es un error.
* Solo se incluyen productos con `estado = ACTIVO` y sin baja lógica.

### Componentes y responsabilidades

1. **Puerto de dominio**: contrato que define la operación "listar productos activos", con soporte de paginación y filtro por categoría, sin conocer el mecanismo de persistencia.
2. **Caso de uso**: aplica la regla de negocio de excluir productos inactivos o dados de baja, y arma la respuesta paginada.
3. **Adaptador de persistencia**: implementación concreta del puerto contra el motor de base de datos definido para el proyecto.
4. **Adaptador de entrada**: expone la operación como endpoint HTTP público (`GET /api/products`), traduce query params a la entrada del caso de uso.
5. **Grilla en frontend**: componente de listado responsive (`features/catalogo`) que consume el endpoint y renderiza cards reutilizables (`components/cards`) por cada producto, manejando estados de carga, vacío y error.

> **Decisión: separación público/admin**. `GET /api/products` es público y devuelve **solo activos, siempre**, sin excepción ni condicional por rol. El listado administrativo, que incluye productos inactivos, se expondrá en una ruta separada (`GET /api/admin/products`), protegida estructuralmente por un router con middleware de autenticación + rol — no por una condición dentro del mismo handler. Se prefiere esta separación porque una frontera de seguridad condicional (mismo endpoint, comportamiento según token) es más fácil de romper por error humano — un bug en el guard, un refactor descuidado — y expondría productos inactivos al público de forma silenciosa. El detalle de `/api/admin/products` se define en el TDD del panel admin (`MAPS-9`).

## Casos de Borde y Errores

### Formato estándar de error

Toda respuesta de error del endpoint sigue el mismo envelope, sin exponer detalles internos (stack traces, mensajes de motor de BD, etc.):

```txt
{
  error: string,   // código estable, ej. "INTERNAL_SERVER_ERROR"
  message: string  // mensaje explícito y accionable para quien consume la API
}
```

### Tabla de casos

| Escenario | Resultado Esperado | Código HTTP | Respuesta |
|---|---|---|---|
| No hay productos activos | Grilla muestra estado vacío ("No hay productos disponibles") | `200 OK` | No es error — `{ items: [], page, pageSize, total: 0 }` |
| Producto inactivo o dado de baja | Excluido del listado público | `200 OK` | No es error — regla de negocio, no aparece en `items` |
| Parámetros de paginación inválidos (`page`/`pageSize` no numéricos, negativos o fuera de rango) | Se ignoran y se usan los valores por defecto; `pageSize` se clampea al máximo de 50 | `200 OK` | No es error — solicitud tolerada, se responde con los defaults/clamp aplicados |
| `page` solicitada más allá de la última página disponible | Listado vacío, sin error | `200 OK` | No es error — `{ items: [], page, pageSize, total }` (`total` refleja el conteo real) |
| Filtro de categoría inexistente | Listado vacío, sin error | `200 OK` | No es error — `{ items: [], page, pageSize, total: 0 }` |
| Método HTTP no soportado en el recurso (ej. `POST /api/products`) | Solicitud rechazada | `405 Method Not Allowed` | `{ error: "METHOD_NOT_ALLOWED", message: "El método <método> no está permitido en /api/products. Métodos soportados: GET." }` |
| Recurso/ruta inexistente | Solicitud rechazada | `404 Not Found` | `{ error: "NOT_FOUND", message: "El recurso solicitado no existe." }` |
| Falla de la capa de persistencia (BD caída, error de conexión) | Mensaje genérico de reintento, la grilla muestra estado de error | `500 Internal Server Error` | `{ error: "INTERNAL_SERVER_ERROR", message: "Ocurrió un error inesperado al obtener los productos. Por favor, intentá nuevamente en unos minutos." }` |
| Persistencia u otra dependencia temporalmente no disponible (timeout, sobrecarga) | Mensaje de reintento, la grilla muestra estado de error | `503 Service Unavailable` | `{ error: "SERVICE_UNAVAILABLE", message: "El servicio no está disponible en este momento. Intentá nuevamente más tarde." }` |
| Imagen del producto no disponible | Card se renderiza con un placeholder | No aplica | Se resuelve en el frontend, no es un error de la API |

## Plan de Implementación

1. Definir las entidades `Producto`, `Categoria` (con `slug`) y `Atributo`, y su relación, en el modelo de datos (alineado con `MAPS-9`).
2. Implementar el puerto y caso de uso de listado de productos activos, con paginación (orden determinístico por `nombre`, `pageSize` clampeado a 50) y filtro opcional por slug de categoría.
3. Implementar el adaptador de persistencia y el endpoint público `GET /api/products`, con rate limiting básico y headers de cache.
4. Construir la grilla responsive y las cards reutilizables en el frontend (`features/catalogo`, `components/cards`), consumiendo el endpoint.
5. Manejar estados de carga, vacío y error en la UI.
6. Pruebas unitarias, de integración y verificación manual en staging.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Volumen de productos crece y la grilla se vuelve lenta | Degradación de la experiencia de navegación | Paginación desde el backend, evitar traer el catálogo completo en una sola respuesta |
| Precio fijo mostrado inconsistente con el definido en el panel admin | Confusión comercial, pérdida de confianza | El precio se lee siempre desde el mismo campo `precio` de `Producto`, sin duplicarlo en otras capas |
| Cards no reutilizables terminan duplicando estilos/lógica en otras vistas (detalle, admin) | Deuda técnica, inconsistencia visual | Diseñar la card como componente compartido en `components/cards` desde el inicio |
| Endpoint público sin autenticación expuesto a scraping o carga excesiva | Degradación de servicio, sobrecosto de infraestructura | Rate limiting básico en el adaptador de entrada, más headers de cache (`Cache-Control`) dado que el catálogo cambia con poca frecuencia |

## Plan de pruebas

* **Unitario**: caso de uso de listado — excluye inactivos/dados de baja, pagina correctamente, filtra por slug de categoría, ordena por `nombre` ascendente, clampea `pageSize` al máximo permitido.
* **Integración**: adaptador de persistencia contra la base de datos de test, validando que solo devuelve productos activos.
* **Frontend**: renderizado de la grilla con 0, 1 y N productos; comportamiento responsive en los breakpoints definidos; estado de carga y de error.
* **Manual en staging**: navegación de la grilla como visitante sin sesión iniciada, verificando que el endpoint es público y que los datos mostrados coinciden con los cargados desde el panel admin.

## Referencias

* `docs/estructura.md` — estructura técnica general del proyecto y módulo `products`.
* Documentación relacionada en `docs/03-tecnico/` (pendiente de completar: `api.md`, `modelo-datos.md`).
