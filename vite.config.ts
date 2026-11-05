import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // GitHub Pages'da sayt /Wild-heaven/ yo'lida turadi, lokalda esa ildizda
  base: process.env.GITHUB_ACTIONS ? "/Wild-heaven/" : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
