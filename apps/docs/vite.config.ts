import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { diezel } from "diezel/vite";

export default defineConfig({
  plugins: [diezel(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@ai-sdk/react"],
  },
  ssr: {
    // Bundle these packages during SSR to ensure they use the same React instance
    noExternal: ["@ai-sdk/react", "@ai-sdk/ui-utils", "ai"],
  },
});
