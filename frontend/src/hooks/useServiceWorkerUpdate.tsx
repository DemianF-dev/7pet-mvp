import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export function useServiceWorkerUpdate() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        immediate: true, // Force immediate activation
        onRegistered(r) {
            console.log('✅ Service Worker registered');
            // In development, skip the cache and force reload
            if (import.meta.env.DEV && r) {
                console.log('🔧 DEV MODE: Unregistering SW to avoid cache issues');
                r.unregister();
            } else {
                // Check for updates every 60 seconds in production
                r && setInterval(() => {
                    console.log('🔍 Checking for SW update...');
                    r.update();
                }, 60000);
            }
        },
        onRegisterError(error) {
            console.error('❌ SW registration error:', error);
        },
    });

    useEffect(() => {
        if (offlineReady) {
            toast.success('Aplicativo pronto para funcionar offline!', {
                duration: 3000,
                icon: '📱',
            });
            setOfflineReady(false);
        }
    }, [offlineReady, setOfflineReady]);

    useEffect(() => {
        if (needRefresh) {
            toast(
                (t) => (
                    <div className="flex flex-col gap-2">
                        <div className="font-bold">🎉 Nova versão disponível!</div>
                        <div className="text-sm text-gray-600">
                            Clique em "Atualizar" para obter as últimas melhorias.
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => {
                                    updateServiceWorker(true);
                                    toast.dismiss(t.id);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition"
                            >
                                Atualizar Agora
                            </button>
                            <button
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    setNeedRefresh(false);
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition"
                            >
                                Depois
                            </button>
                        </div>
                    </div>
                ),
                {
                    duration: Infinity,
                    position: 'bottom-center',
                }
            );
        }
    }, [needRefresh, updateServiceWorker, setNeedRefresh]);

    return { offlineReady, needRefresh, updateServiceWorker };
}
