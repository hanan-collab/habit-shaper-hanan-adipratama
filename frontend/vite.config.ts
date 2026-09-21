import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('motion')) return 'vendor-motion';
          if (id.includes('zod') || id.includes('hookform')) return 'vendor-forms';
          if (id.includes('@tanstack')) return 'vendor-query';
          if (id.includes('react')) return 'vendor-react';
          return 'vendor';
        },
      },
    },
  },
});
