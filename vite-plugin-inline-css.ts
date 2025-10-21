import fs from 'fs';
import { Plugin } from 'vite';

/**
 * Custom Vite plugin to inline CSS into the bundle for Shadow DOM
 * This plugin processes CSS imports with ?inline query and converts them to string exports
 */
export function inlineCssPlugin(): Plugin {
  return {
    name: 'vite-plugin-inline-css',
    enforce: 'pre',

    async transform(code, id) {
      // Only process CSS files with ?inline query
      if (!id.includes('?inline')) {
        return null;
      }

      // Remove the ?inline query to get the actual file path
      const filePath = id.split('?')[0];

      // Only process CSS files
      if (!filePath.endsWith('.css')) {
        return null;
      }

      try {
        // Read the CSS file
        const cssContent = fs.readFileSync(filePath, 'utf-8');

        // For development, return the CSS as-is
        // In production, Tailwind CSS will be compiled by @tailwindcss/vite plugin first
        // This plugin runs after that compilation
        return {
          code: `export default ${JSON.stringify(cssContent)};`,
          map: null,
        };
      } catch (error) {
        console.error(`Failed to inline CSS from ${filePath}:`, error);
        return null;
      }
    },

    // Run after other CSS processing plugins
    configResolved(config) {
      // Ensure this plugin runs after Tailwind CSS compilation
      const tailwindPluginIndex = config.plugins.findIndex((p) => p.name === '@tailwindcss/vite');
      const thisPluginIndex = config.plugins.findIndex((p) => p.name === 'vite-plugin-inline-css');

      if (
        tailwindPluginIndex > -1 &&
        thisPluginIndex > -1 &&
        thisPluginIndex < tailwindPluginIndex
      ) {
        console.warn(
          'vite-plugin-inline-css should run after @tailwindcss/vite plugin. ' +
            'Please adjust plugin order in vite.config.ts'
        );
      }
    },
  };
}
