import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico'],
            devOptions: {
                enabled: true, // Habilita PWA em desenvolvimento
                type: 'module'
            },
            manifest: {
                name: '7Pet - Sistema de Gestão',
                short_name: '7Pet',
                description: '7Pet - Sistema Completo para Gestão de Pets',
                theme_color: '#4B96C3',
                background_color: '#ffffff',
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
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                // Background Sync para operações offline
                cleanupOutdatedCaches: true,
                navigateFallback: 'index.html',
                navigateFallbackAllowlist: [/^\/client/, /^\/staff/, /^\/$/], // Allow SPA routes
                navigateFallbackDenylist: [/^\/api/], // Don't fallback for API routes
                skipWaiting: true,
                clientsClaim: true,

                // Cache strategies otimizadas
                runtimeCaching: [
                    // API Calls - Network First com fallback
                    {
                        urlPattern: ({ url }) => url.pathname.startsWith('/api'),
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 dias
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            },
                            networkTimeoutSeconds: 10,
                            // Background Sync para requisições falhadas
                            backgroundSync: {
                                name: 'api-sync-queue',
                                options: {
                                    maxRetentionTime: 24 * 60 // 24 horas
                                }
                            }
                        }
                    },
                    // Imagens - Cache First
                    {
                        urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|avif)$/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
                            }
                        }
                    },
                    // Fontes - Cache First
                    {
                        urlPattern: /\.(woff|woff2|ttf|eot)$/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'fonts-cache',
                            expiration: {
                                maxEntries: 20,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
                            }
                        }
                    },
                    // Google Fonts
                    {
                        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365
                            }
                        }
                    }
                ]
            }
        })
    ],
    server: {
        host: true, // Listen on all addresses
        port: 5173,
        strictPort: true, // Fail if port is in use
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
