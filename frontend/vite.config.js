import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  envDir: "../",
  plugins: [react()],
  server: {
    proxy: {
      // React에서 /api/cars로 요청하면 Express 서버의 /api/cars API로 전달합니다.
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
