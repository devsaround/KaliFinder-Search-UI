import react from '@vitejs/plugin-react-swc';
import { componentTagger } from 'lovable-tagger';
import path from 'path';
import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [react(), cssInjectedByJsPlugin(), mode === 'development' && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    // Define default values that will be replaced during build
    __VITE_BACKEND_URL__: JSON.stringify(
      process.env.VITE_BACKEND_URL || 'https://api.kalifinder.com'
    ),
    __VITE_WIDGET_CDN_URL__: JSON.stringify(
      process.env.VITE_WIDGET_CDN_URL || 'https://cdn.kalifinder.com'
    ),
  },
  build: {
    sourcemap: false,
    lib: {
      entry: path.resolve(__dirname, 'src/embed-search.tsx'),
      name: 'KalifindSearch',
      formats: ['umd'],
      fileName: (format) => `kalifind-search.js`,
    },
    outDir: 'dist',
    // emptyOutDir: true,
    // Bundle React and ReactDOM into the output so it works standalone on WordPress
    // (do not externalize react/react-dom)
  },
}));
