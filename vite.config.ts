import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({ fastRefresh: false })],
  resolve: {
    alias: {
      // Keep only this alias if it's generally needed, otherwise remove
      './runtimeConfig': './runtimeConfig.browser',
    },
  },
  optimizeDeps: {
    // Removing include as we'll handle this in build.rollupOptions
    exclude: ['lucide-react', 'react-datepicker'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase_app: ['firebase/app'],
          firebase_auth: ['firebase/auth'],
        },
      },
    },
  },
});
