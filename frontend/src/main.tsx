import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.tsx'
import './index.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes (data remains fresh)
            gcTime: 24 * 60 * 60 * 1000, // 24 hours (how long it stays in cache)
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
})

const persister = createSyncStoragePersister({
    storage: window.localStorage,
})

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <PersistQueryClientProvider
                client={queryClient}
                persistOptions={{ persister }}
            >
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </PersistQueryClientProvider>
        </GoogleOAuthProvider>
    </StrictMode>,
)
