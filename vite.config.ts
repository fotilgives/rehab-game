import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Absolute base (served at domain root on Vercel). Required for correct
  // code-split chunk resolution — relative base breaks dynamic imports.
  base: '/',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    // Без ручного manualChunks: воно створювало циклічну залежність
    // react ↔ framer-motion між чанками й ламало запуск у Safari.
    // Стандартне пакування Vite надійне; чат усе одно вантажиться lazy.
    chunkSizeWarningLimit: 900,
  },
  server: {
    port: Number(process.env.PORT) || 3000,
    host: '0.0.0.0',
  },
});
