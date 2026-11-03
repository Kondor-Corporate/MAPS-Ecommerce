import { createApp } from './app.js';
import { loadEnv } from './config/env.js';

const { port } = loadEnv();

createApp().listen(port, () => {
  console.info(`API escuchando en el puerto ${port}`);
});
