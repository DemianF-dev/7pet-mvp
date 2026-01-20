import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Download } from 'lucide-react';

export function useServiceWorkerUpdate() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        immediate: true,
        onRegistered(r) {
            console.log('✅ Service Worker registered');
            if (import.meta.env.DEV && r) {
                console.log('🔧 DEV MODE: Unregistering SW');
                r.unregister();
            } else {
                r && setInterval(() => {
                    r.update();
                }, 60 * 1000);
            }
        },
    });

    useEffect(() => {
        if (offlineReady) {
            toast.success('Pronto para uso offline!', {
                icon: '📱',
                style: {
                    borderRadius: '16px',
                    background: '#1D1D1F',
                    color: '#fff',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600'
                }
            });
            setOfflineReady(false);
        }
    }, [offlineReady, setOfflineReady]);

    useEffect(() => {
        if (needRefresh) {
            toast(
                (t) => (
                    <div className="flex flex-col gap-3 min-w-[280px]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                <Download size={20} />
                            </div>
                            <div>
                                <h4 className="font-black text-secondary text-sm">Nova versão pronta!</h4>
                                <p className="text-xs text-gray-400">Clique para atualizar o 7Pet.</p>
                            </div>
                        </div>
                        <div className="flex gap-2 h-10">
                            <button
                                onClick={() => {
                                    updateServiceWorker(true);
                                    toast.dismiss(t.id);
                                }}
                                className="flex-1 bg-primary text-white text-[10px] uppercase tracking-widest font-black rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
                            >
                                Atualizar
                            </button>
                            <button
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    setNeedRefresh(false);
                                }}
                                className="px-4 bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest font-black rounded-xl"
                            >
                                Depois
                            </button>
                        </div>
                    </div>
                ),
                {
                    duration: Infinity,
                    position: 'bottom-center',
                    style: {
                        borderRadius: '24px',
                        padding: '16px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                        border: '1px solid rgba(0,0,0,0.05)'
                    }
                }
            );
        }
    }, [needRefresh, updateServiceWorker, setNeedRefresh]);

    return { offlineReady, needRefresh, updateServiceWorker };
}
