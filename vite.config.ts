import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
  build: {
    emptyOutDir: true,
    // lib: {
    //   entry: path.resolve(__dirname, "src/embed.tsx"),
    //   name: "KalifindSearch",
    //   formats: ["umd"],
    //   fileName: (format) => `kalifind-search.js`,
    // },
    // outDir: "search-cdn",
    outDir: "dist",
  },
}));
