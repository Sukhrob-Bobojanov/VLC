
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Bridges the environment variable for compatibility with the Gemini SDK requirements
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
