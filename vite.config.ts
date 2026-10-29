import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Sur GitHub Pages, le site est servi sous /<nom-du-dépôt>/ (défini par le workflow).
  base: process.env.BASE_PATH ?? '/',
});
