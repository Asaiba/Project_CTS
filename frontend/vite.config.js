import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDir = path.resolve(__dirname, "src/pages");

const pageFiles = fs.existsSync(pagesDir)
  ? fs.readdirSync(pagesDir).filter((name) => name.endsWith(".html"))
  : [];

const htmlEntries = (() => {
  const input = {
    index: path.resolve(__dirname, "index.html"),
  };
  pageFiles.forEach((name) => {
    const key = name.replace(/\.html$/i, "");
    input[key] = path.resolve(pagesDir, name);
  });
  return input;
})();

export default defineConfig({
  plugins: [
    react(),
    {
      name: "dev-page-rewrites",
      configureServer(server) {
        if (!pageFiles.length) return;
        server.middlewares.use((req, _res, next) => {
          if (!req.url) return next();
          const [pathname] = req.url.split("?");
          if (!pathname.endsWith(".html")) return next();
          const fileName = pathname.replace(/^\//, "");
          if (pageFiles.includes(fileName)) {
            req.url = `/src/pages/${fileName}`;
          }
          next();
        });
      },
    },
    {
      name: "copy-pages-to-root",
      apply: "build",
      closeBundle() {
        const distDir = path.resolve(__dirname, "dist");
        const builtPagesDir = path.join(distDir, "src/pages");
        if (!fs.existsSync(builtPagesDir)) return;
        const builtPages = fs.readdirSync(builtPagesDir).filter((name) => name.endsWith(".html"));
        builtPages.forEach((name) => {
          const source = path.join(builtPagesDir, name);
          const dest = path.join(distDir, name);
          fs.copyFileSync(source, dest);
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: htmlEntries,
    },
  },
});
