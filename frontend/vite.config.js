import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlEntries = (() => {
  const input = {
    index: path.resolve(__dirname, "index.html"),
  };
  const pagesDir = path.resolve(__dirname, "src/pages");
  if (!fs.existsSync(pagesDir)) return input;

  const files = fs.readdirSync(pagesDir).filter((name) => name.endsWith(".html"));
  files.forEach((name) => {
    const key = `pages/${name.replace(/\.html$/i, "")}`;
    input[key] = path.resolve(pagesDir, name);
  });
  return input;
})();

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: htmlEntries,
    },
  },
});
