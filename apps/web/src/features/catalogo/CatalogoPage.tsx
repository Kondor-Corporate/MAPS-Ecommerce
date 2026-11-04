import { useEffect, useState } from 'react';

import { listPublishedProducts, type PublicProduct } from './api';
import { formatPrice, groupByCategory } from './catalogo';

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; products: PublicProduct[] };

// PUB-01 Catálogo (F2): Products publicados agrupados por categoría, con precio fijo vigente.
// Estados: cargando, vacío y error. "No disponible" llega con el módulo de formularios.
export function CatalogoPage() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    listPublishedProducts(controller.signal)
      .then((page) => setState({ status: 'ready', products: page.items }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="catalogo">
      <header className="catalogo__header">
        <h1>Catálogo de seguros</h1>
        <p className="catalogo__subtitle">Seguros con precio fijo, gestionados por productores MAPS.</p>
      </header>

      <div aria-live="polite">
        {state.status === 'loading' && <p className="catalogo__info">Cargando catálogo…</p>}

        {state.status === 'error' && (
          <p role="alert" className="catalogo__error">
            No pudimos cargar el catálogo. Reintentá en unos minutos.
          </p>
        )}

        {state.status === 'ready' && state.products.length === 0 && (
          <p className="catalogo__info">Todavía no hay seguros publicados.</p>
        )}
      </div>

      {state.status === 'ready' &&
        groupByCategory(state.products).map(({ category, products }) => (
          <section key={category.id} className="catalogo__categoria" aria-labelledby={`cat-${category.id}`}>
            <h2 id={`cat-${category.id}`}>{category.name}</h2>
            <ul className="catalogo__grilla">
              {products.map((product) => (
                <li key={product.id}>
                  <article className="producto" aria-label={product.name}>
                    <p className="producto__categoria">{category.name}</p>
                    <h3 className="producto__nombre">{product.name}</h3>
                    <p className="producto__resumen">{product.summary}</p>
                    <p className="producto__precio">
                      <span className="producto__precio-label">Precio fijo</span>
                      {formatPrice(product.price)}
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </main>
  );
}
