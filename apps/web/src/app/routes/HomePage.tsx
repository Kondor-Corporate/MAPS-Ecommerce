import { useEffect, useState } from 'react';

import { getHealth } from '../../services/health';

type ApiStatus = 'loading' | 'ok' | 'error';

export function HomePage() {
  const [status, setStatus] = useState<ApiStatus>('loading');

  useEffect(() => {
    const controller = new AbortController();

    getHealth(controller.signal)
      .then(() => setStatus('ok'))
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="home">
      <h1>MAPS — Portal de Solicitudes</h1>
      <p className="home__subtitle">Seguros con precio fijo, gestionados por productores MAPS.</p>

      <section className="home__status" aria-live="polite">
        {status === 'loading' && <p>Verificando la API…</p>}
        {status === 'ok' && <p className="status status--ok">API operativa</p>}
        {status === 'error' && (
          <p role="alert" className="status status--error">
            No pudimos conectar con la API. Reintentá en unos minutos.
          </p>
        )}
      </section>
    </main>
  );
}
