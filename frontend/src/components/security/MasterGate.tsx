import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useDevCockpitStore } from '../../store/devCockpitStore';
import { toast } from 'react-hot-toast';

interface MasterGateProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const MasterGate: React.FC<MasterGateProps> = ({ children, fallback }) => {
    const { user } = useAuthStore();
    const cockpitStore = useDevCockpitStore();
    const [challengeText, setChallengeText] = useState('');

    // Auto-check TTL on mount and periodically
    useEffect(() => {
        const check = () => {
            if (cockpitStore.unlocked) {
                cockpitStore.isUnlocked();
            }
        };
        check();
        const interval = setInterval(check, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, [cockpitStore]);

    if (user?.role !== 'MASTER') {
        return <>{fallback || null}</>;
    }

    const isUnlocked = cockpitStore.isUnlocked();

    if (!isUnlocked) {
        return (
            <div className="w-full">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900/90 backdrop-blur-2xl border border-red-500/20 rounded-[40px] p-10 md:p-16 text-center shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden relative"
                >
                    {/* Background Highlight */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 blur-[100px] pointer-events-none" />

                    <div className="relative z-10">
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                                opacity: [0.8, 1, 0.8]
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="w-24 h-24 bg-red-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-red-500/20 shadow-inner"
                        >
                            <Lock className="text-red-500" size={44} />
                        </motion.div>

                        <h2 className="text-3xl font-bold text-white mb-3 uppercase tracking-tighter">
                            Shield L4 Protocol <span className="text-red-500">Locked</span>
                        </h2>
                        <p className="text-slate-400 text-sm mb-12 max-w-sm mx-auto leading-relaxed font-medium">
                            Esta é uma área de administração de baixo nível. O acesso requer autorização temporária e é monitorado em tempo real.
                        </p>

                        <div className="max-w-sm mx-auto bg-black/40 p-8 rounded-[32px] border border-white/5 shadow-2xl">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">
                                Security Challenge: Type <span className="text-red-500">MASTER</span>
                            </label>
                            <input
                                type="text"
                                value={challengeText}
                                onChange={(e) => setChallengeText(e.target.value.toUpperCase())}
                                placeholder="••••••"
                                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl px-6 py-4 text-center text-white font-mono font-bold text-xl tracking-[0.6em] focus:border-red-500/50 focus:bg-slate-800 focus:outline-none transition-all mb-6 placeholder:text-slate-800"
                            />

                            <button
                                type="button"
                                onClick={() => {
                                    if (challengeText === 'MASTER') {
                                        cockpitStore.unlock('MASTER');
                                        toast.success('Master session established (15min established)');
                                    } else {
                                        toast.error('Invalid challenge response');
                                        setChallengeText('');
                                    }
                                }}
                                disabled={challengeText !== 'MASTER'}
                                className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all ${challengeText === 'MASTER'
                                    ? 'bg-red-600 text-white shadow-xl shadow-red-600/30 hover:scale-[1.02] active:scale-95'
                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5'
                                    }`}
                            >
                                <Unlock size={18} />
                                Unlock Interface
                            </button>
                        </div>

                        <div className="mt-10 flex items-center justify-center gap-4 text-[10px] text-slate-600 font-mono uppercase tracking-widest font-bold">
                            <span className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                15m Auto-TTL
                            </span>
                            <span className="flex items-center gap-2 border-l border-white/10 pl-4">
                                <ShieldAlert size={12} className="text-red-900" />
                                Full Auditing Active
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
        >
            {children}
        </motion.div>
    );
};
