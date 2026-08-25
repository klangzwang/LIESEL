import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  clearScreen: false,
  root: 'src',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'img/*', dest: './' },
        { src: 'img/icons/*', dest: './' },
      ]
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@css": path.resolve(__dirname, "./src/css"),
      "store": path.resolve(__dirname, "./src/store"),
      "components": path.resolve(__dirname, "./src/components"),
      "widgets": path.resolve(__dirname, "./src/components/widgets"),
      "flow": path.resolve(__dirname, "./src-flow/src"),
      "nodes": path.resolve(__dirname, "./src-flow/src/nodes"),
      "llm": path.resolve(__dirname, "./src-llm/src")
    },
  },
  base: './',
  build: {
    minify: false,
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        editor: resolve(__dirname, 'src/index.html')
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: 'js/[name][extname]',
      }
    }
  },
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version),
  },
});
