// Config de los fixtures de arquitectura: las mismas reglas que eslint.config.mjs aplica a
// apps/api/src (apiArchitecture), apuntadas al árbol de fixtures.
import tseslint from 'typescript-eslint';

import { apiArchitecture } from '../../../../../eslint/architecture.mjs';

export default tseslint.config(
  tseslint.configs.base,
  ...apiArchitecture({ root: 'apps/api/tests/architecture/fixtures/src' }),
);
