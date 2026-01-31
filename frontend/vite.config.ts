import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            includeAssets: ['favicon.ico', 'logo.png'],
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                // 🛡️ CRITICAL: Do not cache API or Socket.io routes
                navigateFallbackDenylist: [/^\/api/, /^\/socket.io/],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/7pet-backend-production\.up\.railway\.app\/api/,
                        handler: 'NetworkOnly',
                    },
                    {
                        urlPattern: /^https:\/\/7pet-realtime-production\.up\.railway\.app\/socket\.io/,
                        handler: 'NetworkOnly',
                    }
                ]
            },
            manifest: {
                name: '7Pet',
                short_name: '7Pet',
                description: 'Sistema de gestão pet',
                theme_color: '#0071E3',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        }),
        visualizer({
            filename: 'dist/bundle-analysis.html',
            open: false,
            gzipSize: true,
            brotliSize: true,
        })
    ],
    server: {
        host: true,
        port: 5173,
        strictPort: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    ui: ['framer-motion', 'lucide-react'],
                    charts: ['recharts'],
                    utils: ['axios'],
                    state: ['zustand', '@tanstack/react-query']
                }
            }
        }
    }
})
