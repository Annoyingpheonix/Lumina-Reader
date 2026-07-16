import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(), 
        tailwindcss(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
          manifest: {
            name: 'Lumina Reader',
            short_name: 'Lumina',
            description: 'A beautiful, immersive web reader',
            theme_color: '#4f46e5',
            background_color: '#ffffff',
            display: 'standalone',
            icons: [
              {
                src: 'logo.jpg',
                sizes: '192x192',
                type: 'image/jpeg'
              },
              {
                src: 'logo.jpg',
                sizes: '512x512',
                type: 'image/jpeg'
              },
              {
                src: 'logo.jpg',
                sizes: '512x512',
                type: 'image/jpeg',
                purpose: 'any maskable'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
