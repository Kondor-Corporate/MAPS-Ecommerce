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
  * `precio`: valor fijo, numérico, mayor a cero.
  * `categoria`: referencia a la entidad de categoría del producto.
  * `estado`: `ACTIVO` / `INACTIVO`, determina si aparece en la grilla pública.
  * `imagen`: referencia opcional a un recurso visual de la card.
  * `deletedAt`: marca de baja lógica, si aplica.
  * `createdAt` / `updatedAt`: marcas de auditoría temporal.

### Contrato de la interfaz expuesta

* Operación: `listar productos` (expuesto públicamente, ej. `GET /products`, sin requerir autenticación).
* Entrada:

```txt
page?: number      // opcional, default 1
pageSize?: number  // opcional, default definido por el servidor
categoria?: string // opcional, filtro por categoría
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
      categoria: string,
      imagen?: string
    },
    ...
  ],
  page: number,
  pageSize: number,
  total: number
}
```

* Salida esperada (sin resultados): mismo contrato, con `items: []` y `total: 0` — no es un error.
* Solo se incluyen productos con `estado = ACTIVO` y sin baja lógica.

### Componentes y responsabilidades

1. **Puerto de dominio**: contrato que define la operación "listar productos activos", con soporte de paginación y filtro por categoría, sin conocer el mecanismo de persistencia.
2. **Caso de uso**: aplica la regla de negocio de excluir productos inactivos o dados de baja, y arma la respuesta paginada.
3. **Adaptador de persistencia**: implementación concreta del puerto contra el motor de base de datos definido para el proyecto.
4. **Adaptador de entrada**: expone la operación como endpoint HTTP público (`GET /products`), traduce query params a la entrada del caso de uso.
5. **Grilla en frontend**: componente de listado responsive (`features/catalogo`) que consume el endpoint y renderiza cards reutilizables (`components/cards`) por cada producto, manejando estados de carga, vacío y error.

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Categoría de error |
|---|---|---|
| No hay productos activos | Grilla muestra estado vacío ("No hay productos disponibles") | No aplica (caso válido) |
| Producto inactivo o dado de baja | Excluido del listado público | No aplica (regla de negocio) |
| Parámetros de paginación inválidos | Se ignoran y se usan los valores por defecto | Solicitud inválida (tolerante) |
| Filtro de categoría inexistente | Listado vacío, sin error | No aplica (caso válido) |
| Falla de la capa de persistencia | Mensaje genérico de reintento, la grilla muestra estado de error | Error interno |
| Imagen del producto no disponible | Card se renderiza con un placeholder | No aplica |

## Plan de Implementación

1. Definir la entidad `Producto` y su relación con `Categoria` en el modelo de datos (alineado con `MAPS-9`).
2. Implementar el puerto y caso de uso de listado de productos activos, con paginación y filtro opcional por categoría.
3. Implementar el adaptador de persistencia y el endpoint público `GET /products`.
4. Construir la grilla responsive y las cards reutilizables en el frontend (`features/catalogo`, `components/cards`), consumiendo el endpoint.
5. Manejar estados de carga, vacío y error en la UI.
6. Pruebas unitarias, de integración y verificación manual en staging.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Volumen de productos crece y la grilla se vuelve lenta | Degradación de la experiencia de navegación | Paginación desde el backend, evitar traer el catálogo completo en una sola respuesta |
| Precio fijo mostrado inconsistente con el definido en el panel admin | Confusión comercial, pérdida de confianza | El precio se lee siempre desde el mismo campo `precio` de `Producto`, sin duplicarlo en otras capas |
| Cards no reutilizables terminan duplicando estilos/lógica en otras vistas (detalle, admin) | Deuda técnica, inconsistencia visual | Diseñar la card como componente compartido en `components/cards` desde el inicio |

## Plan de pruebas

* **Unitario**: caso de uso de listado — excluye inactivos/dados de baja, pagina correctamente, filtra por categoría.
* **Integración**: adaptador de persistencia contra la base de datos de test, validando que solo devuelve productos activos.
* **Frontend**: renderizado de la grilla con 0, 1 y N productos; comportamiento responsive en los breakpoints definidos; estado de carga y de error.
* **Manual en staging**: navegación de la grilla como visitante sin sesión iniciada, verificando que el endpoint es público y que los datos mostrados coinciden con los cargados desde el panel admin.

## Referencias

* `docs/estructura.md` — estructura técnica general del proyecto y módulo `products`.
* Documentación relacionada en `docs/03-tecnico/` (pendiente de completar: `api.md`, `modelo-datos.md`).
