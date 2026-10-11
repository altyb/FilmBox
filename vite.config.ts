import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import net from "node:net";

// Node gives each resolved address only 250ms to connect before trying the
// next; on a slow link TMDB never answers in time and the dev proxy 500s.
net.setDefaultAutoSelectFamilyAttemptTimeout(5000);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Dev-only passthrough: production serves /api/tmdb from the Vercel
  // function (with cache); `vite dev` forwards straight to TMDB so the app
  // runs without `vercel dev`. Uses the server-side TMDB_TOKEN, never baked
  // into the bundle.
  const env = loadEnv(mode, process.cwd(), "");
  const devToken = env.TMDB_TOKEN || env.VITE_TMDB_TOKEN || "";

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api/tmdb": {
          target: "https://api.themoviedb.org/3",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/tmdb/, ""),
          headers: { Authorization: `Bearer ${devToken}` },
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Vendor code changes far less often than the app: separate chunks
          // stay cached across deploys and download in parallel.
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            data: ["@tanstack/react-query", "axios", "zustand"],
            motion: ["gsap", "@gsap/react"],
          },
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
