import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import autoprefixer from 'autoprefixer';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
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
    cssCodeSplit: false, // Bundle all CSS into one file
    reportCompressedSize: false,
    emptyOutDir: true,
    outDir: 'dist',
    lib: {
      entry: path.resolve(__dirname, 'src/embed/bootstrap.tsx'),
      name: 'Kalifinder',
      fileName: () => `kalifind-search.js`,
      formats: ['umd'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        // Force .js extension for UMD format
        entryFileNames: 'kalifind-search.js',
        // Output CSS as separate file that we'll inline
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
