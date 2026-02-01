import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { queryClient } from './lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'

// Theme System - Base tokens + all themes
import './styles/tokens.base.css'
import './styles/apple-tokens.css'  // Apple HIG tokens
import './styles/themes/default-light.css'
import './styles/themes/default-dark.css'
import './styles/themes/apple-light.css'   // Apple Light Theme
import './styles/themes/apple-dark.css'    // Apple Dark Theme
import './styles/themes/cyberpunk-neon.css'
import './styles/themes/ocean-calm.css'
import './styles/themes/forest-nature.css'
import './styles/themes/candy-pop.css'
import './styles/design-system-base.css'   // Design system reusable classes
import './styles/sidebar-collapsible.css'   // Collapsible sidebar support
import './styles/sidebar.glass.css'
import './styles/mobile-fixes.css'          // Mobile-specific fixes (iOS/Android)
import './styles/mobile-performance.css'   // Mobile performance optimizations
import './index.css'

import { initChunkRecovery } from './utils/chunkRecovery';
import { installGlobalErrorHandlers } from './utils/globalErrorHandlers';
import { initializePerformance } from './store/uiPerfStore';
import ErrorBoundary from './components/ErrorBoundary';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';

// import { SocketProvider } from './context/SocketContext' // Removed in favor of SocketManager singleton

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// 🛡️ Initialize chunk error recovery system BEFORE rendering
initChunkRecovery();

// 🛡️ Install global error handlers
installGlobalErrorHandlers();

// 🚀 Initialize performance monitoring
initializePerformance().catch(console.error);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ErrorBoundary>
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <QueryClientProvider client={queryClient}>
                    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <App />
                    </BrowserRouter>
                </QueryClientProvider>
            </GoogleOAuthProvider>
        </ErrorBoundary>
    </StrictMode>,
)
