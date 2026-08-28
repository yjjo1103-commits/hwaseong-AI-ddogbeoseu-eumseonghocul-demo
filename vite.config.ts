import { defineConfig } from 'vite';
import react from '@vitejs.plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/hwaseong-AI-ddogbeoseu-eumseonghocul-demo/',
  server: {
    port: 3000,
    host: true,
  },
});
