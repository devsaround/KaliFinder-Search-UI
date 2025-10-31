import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import autoprefixer from 'autoprefixer';
import path from 'path';
import { defineConfig } from 'vite';
import { shadowCssPlugin } from './vite-plugin-shadow-css';
import { inlineCssPlugin } from './vite-plugin-inline-css';

export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [react(), tailwindcss(), shadowCssPlugin(), inlineCssPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(
      process.env.VITE_BACKEND_URL || 'https://api.kalifinder.com'
    ),
    'import.meta.env.VITE_WIDGET_CDN_URL': JSON.stringify(
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
    esbuild: {
      // Strip debug statements from the final CDN bundle
      drop: ['console', 'debugger'],
    },
    cssMinify: true,
    // Enable CSS asset emission so shadowCssPlugin can capture processed CSS
    cssCodeSplit: true,
    reportCompressedSize: false,
    emptyOutDir: true,
    outDir: 'dist',
    lib:
      process.env.BUILD_TARGET === 'esm'
        ? {
            entry: path.resolve(__dirname, 'src/esm.tsx'),
            name: 'KalifinderESM',
            fileName: () => `index.es.js`,
            formats: ['es'],
          }
        : {
            entry: path.resolve(__dirname, 'src/embed/bootstrap.tsx'),
            name: 'Kalifinder',
            fileName: () => `kalifind-search.js`,
            formats: ['umd'],
          },
    rollupOptions:
      process.env.BUILD_TARGET === 'esm'
        ? {
            output: {
              entryFileNames: 'index.es.js',
            },
          }
        : {
            output: {
              inlineDynamicImports: true,
              entryFileNames: 'kalifind-search.js',
              assetFileNames: (assetInfo) => {
                if (assetInfo.name && assetInfo.name.endsWith('.css')) {
                  return 'kalifind-search.css';
                }
                return assetInfo.name || 'assets/[name][extname]';
              },
            },
          },
  },
}));
