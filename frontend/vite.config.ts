import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'prompt',
            includeAssets: ['favicon.ico', 'logo.png', 'pwa-192x192.png', 'pwa-512x512.png'],
            devOptions: {
                enabled: true,
                type: 'module'
            },
            manifest: {
                name: '7Pet - Gestão Inteligente',
                short_name: '7Pet',
                description: 'Sistema completo de gestão para centros estéticos e logística pet.',
                theme_color: '#0071E3',
                background_color: '#FAFAFA',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                orientation: 'portrait',
                categories: ['business', 'productivity'],
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ],
                shortcuts: [
                    {
                        name: 'Agenda',
                        short_name: 'Agenda',
                        description: 'Ver agendamentos do dia',
                        url: '/staff/agenda-spa',
                        icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
                    },
                    {
                        name: 'Orçamentos',
                        short_name: 'Orçamentos',
                        description: 'Gerenciar orçamentos',
                        url: '/staff/quotes',
                        icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
                    },
                    {
                        name: 'Clientes',
                        short_name: 'Clientes',
                        description: 'Lista de clientes',
                        url: '/staff/users',
                        icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
                    },
                    {
                        name: 'Pausa',
                        short_name: 'Pausa',
                        description: 'Modo pausa e jogos',
                        url: '/pausa',
                        icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
                    }
                ]
            },
            workbox: {
                cleanupOutdatedCaches: true,
                navigateFallback: '/index.html',
                navigateFallbackAllowlist: [/^\/(?!api|socket\.io).*/],
                navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/.*\/api\/.*/i,
                        handler: 'NetworkOnly'
                    },
                    {
                        urlPattern: /\/api\/.*/i,
                        handler: 'NetworkOnly'
                    },
                    {
                        urlPattern: /\/socket\.io\/.*/i,
                        handler: 'NetworkOnly'
                    },
                    {
                        urlPattern: /\.(?:js|css)$/i,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'assets-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30
                            }
                        }
                    },
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30
                            }
                        }
                    },
                    {
                        urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'fonts-cache',
                            expiration: {
                                maxEntries: 20,
                                maxAgeSeconds: 60 * 60 * 24 * 365
                            }
                        }
                    }
                ]
            }
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
    },
    esbuild: {
        drop: ['console', 'debugger']
    }
})
