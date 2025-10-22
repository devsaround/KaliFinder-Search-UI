import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import autoprefixer from 'autoprefixer';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    __VITE_BACKEND_URL__: JSON.stringify(
      process.env.VITE_BACKEND_URL || 'https://api.kalifinder.com/api'
    ),
    __VITE_WIDGET_CDN_URL__: JSON.stringify(
      process.env.VITE_WIDGET_CDN_URL || 'https://cdn.kalifinder.com'
    ),
  },
  css: {
    postcss: {
      plugins: [autoprefixer()],
    },
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: true,
    reportCompressedSize: false,
    emptyOutDir: true,
    outDir: 'dist',
    rollupOptions: {
      // Support building both dev and embed entry points
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash][extname]',
      },
    },
  },
});
