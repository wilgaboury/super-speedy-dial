import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import fg from "fast-glob";

export default defineConfig({
  plugins: [
    solidPlugin(),
    {
      name: "watch-external",
      async buildStart() {
        const files = await fg("public/**");
        for (let file of files) {
          this.addWatchFile(file);
        }
      },
    },
  ],
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
    outDir: "build",
  },
});
