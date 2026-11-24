import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Brauzer himoyasi (GitHub Pages server sarlavhalarini qo'yish imkonini bermaydi, shuning uchun meta orqali)
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-src https://www.openstreetmap.org",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
].join("; ");

export default defineConfig({
  // GitHub Pages'da sayt /Wild-heaven/ yo'lida turadi, lokalda esa ildizda
  base: process.env.GITHUB_ACTIONS ? "/Wild-heaven/" : "/",
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "inject-csp",
      transformIndexHtml(html, ctx) {
        if (ctx.server) return html;
        return html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
