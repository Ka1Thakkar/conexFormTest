import { defineConfig } from "vite";
import vitePluginString from "vite-plugin-string";

export default defineConfig({
  plugins: [vitePluginString({ include: "**/*.yml" })],
  root: "./src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true,
  },
});
