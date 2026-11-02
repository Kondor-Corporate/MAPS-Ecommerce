# AGENTS.md — apps/web

Complementa el [AGENTS.md raíz](../../AGENTS.md). Leelo cuando trabajes en el front.

- React + Vite + TypeScript. Una carpeta por feature en `src/features/` (auth, catalogo, solicitudes,
  admin, productor); componentes compartidos en `src/components/`.
- Referencia visual y de comportamiento: [prototipo](../../docs/02-diseno/ui-ux/prototipos/maps-seguros-portal-standalone.html)
  y [F2 — Design Handoff](../../docs/02-diseno/Fase_2__Design_Handoff.md). Si el prototipo y F2 difieren, manda F2.
- Cada pantalla contempla los estados de F2: cargando, vacío, error, sin permiso.
- El front oculta acciones según rol, pero **la autorización real vive en la API**. Nunca confíes
  sólo en el front para permisos.
- Verificación visual: al terminar una pantalla, abrila en el navegador y adjuntá una captura al PR.
