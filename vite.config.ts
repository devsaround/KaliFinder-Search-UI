import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import autoprefixer from 'autoprefixer';
import { componentTagger } from 'lovable-tagger';
import path from 'path';
import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
    tailwindcss(), // <-- add this
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
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
    // Production optimizations for widget
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: true,
    reportCompressedSize: false,
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/embed-search.tsx'),
      name: 'KalifindSearch',
      formats: ['umd'],
      fileName: (format) => `kalifind-search.js`,
    },
    rollupOptions: {
      external: [],
      output: {
        // Ensure all dependencies are bundled for standalone widget
        globals: {},
        inlineDynamicImports: true,
      },
    },
    outDir: 'dist',
  },
}));
