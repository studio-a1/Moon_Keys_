import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // These are dependencies loaded via <script type="importmap">
      // We tell Vite not to bundle them, as they will be loaded by the browser from the CDN.
      external: [
        'react',
        'react-dom/client',
        'recharts',
        'lucide-react',
        '@google/genai',
        'suncalc'
      ]
    }
  }
});
