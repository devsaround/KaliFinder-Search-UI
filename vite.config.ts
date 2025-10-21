import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import autoprefixer from 'autoprefixer';
import { componentTagger } from 'lovable-tagger';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

// Custom plugin to inline CSS for Shadow DOM
function shadowDomCssPlugin(): Plugin {
  let cssContent = '';

  return {
    name: 'shadow-dom-css',
    enforce: 'post',

    // Capture generated CSS
    generateBundle(options, bundle) {
      for (const [fileName, file] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && file.type === 'asset') {
          cssContent = file.source as string;
          // Remove the CSS file from the bundle since we'll inline it
          delete bundle[fileName];
        }
      }

      // Inject CSS into the JS bundle
      for (const [fileName, file] of Object.entries(bundle)) {
        if (fileName.endsWith('.js') && file.type === 'chunk') {
          // Replace the placeholder import with actual CSS
          file.code = file.code.replace(
            /import\s+widgetStyles\s+from\s+['"]\.\.\/index\.css\?inline['"];?/g,
            `const widgetStyles = ${JSON.stringify(cssContent)};`
          );
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [
    react(),
    tailwindcss(),
    mode === 'development' && componentTagger(),
    shadowDomCssPlugin(), // Custom plugin to inline CSS into Shadow DOM
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
    // Disable CSS code splitting - inline all CSS into the JS bundle
    cssCodeSplit: false,
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
        // Inline all assets (including CSS)
        assetFileNames: 'assets/[name][extname]',
      },
    },
    outDir: 'dist',
  },
}));
