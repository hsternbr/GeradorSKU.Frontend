import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Proxy para API backend local (quando rodando em dev)
      '/api': {
        target: 'http://10.1.0.49:4020',
        changeOrigin: true,
      },
      // Proxy opcional para serviço de imagem em dev
      // Se em dev você quiser que `${import.meta.env.VITE_API_IMAGEM}` aponte para Vite
      // e este redirecione para o serviço real, use algo como:
      // '/imagem': {
      //   target: 'http://10.1.0.49:3000',
      //   changeOrigin: true,
      // },
    },
  },
});
