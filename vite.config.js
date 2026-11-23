import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" so the built dist/ folder works when dragged onto Netlify Drop or opened from any path.
export default defineConfig({ plugins: [react()], base: "./", server: { port: 5190 } });
