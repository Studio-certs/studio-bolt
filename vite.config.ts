import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    'process.env': process.env,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        // Add the function entry point
        'create-payment-intent': resolve(__dirname, 'src/functions/create-payment-intent.js'),
      },
      output: {
        entryFileNames: '[name].js', // Keep the original names
        chunkFileNames: 'chunks/[name].js',
      },
    },
  },
});
