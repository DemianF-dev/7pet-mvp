import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, Heart, Sparkles } from 'lucide-react';

interface RecurrenceCelebrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (frequency: 'SEMANAL' | 'QUINZENAL' | 'MENSAL', discount: number) => void;
}

export default function RecurrenceCelebrationModal({ isOpen, onClose, onConfirm }: RecurrenceCelebrationModalProps) {
    const [step, setStep] = useState<'select' | 'celebrate'>('select');
    const [selectedFreq, setSelectedFreq] = useState<'SEMANAL' | 'QUINZENAL' | 'MENSAL' | null>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setStep('select');
            setSelectedFreq(null);
        }
    }, [isOpen]);

    const handleSelect = (freq: 'SEMANAL' | 'QUINZENAL' | 'MENSAL') => {
        setSelectedFreq(freq);
        // Calculate discount
        const discount = freq === 'SEMANAL' ? 10 : freq === 'QUINZENAL' ? 7 : 5;

        // Small delay then celebrate
        setTimeout(() => {
            setStep('celebrate');
            // Auto complete after celebration
            setTimeout(() => {
                onConfirm(freq, discount);
            }, 3500);
        }, 300);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden relative"
                    >
                        {/* Background Decorations */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-purple-500 to-pink-500" />
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white p-4 rounded-full shadow-lg">
                            {step === 'select' ? (
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    <Heart size={48} className="text-pink-500 fill-current" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1.2, rotate: 360 }}
                                >
                                    <PartyPopper size={48} className="text-yellow-500" />
                                </motion.div>
                            )}
                        </div>

                        <div className="pt-32 pb-8 px-8 text-center">
                            <AnimatePresence mode='wait'>
                                {step === 'select' ? (
                                    <motion.div
                                        key="select"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                    >
                                        <h2 className="text-2xl font-bold text-secondary mb-2">Família Crescendo! 🐶</h2>
                                        <p className="text-gray-500 mb-8 font-medium">O cliente decidiu virar recorrente! Qual será a frequência de visitas desse anjo?</p>

                                        <div className="space-y-3">
                                            {[
                                                { value: 'SEMANAL', label: 'Semanal (mín 4 banhos/mês)', discount: '10% OFF' },
                                                { value: 'QUINZENAL', label: 'Quinzenal (mín 2 banhos/mês)', discount: '7% OFF' },
                                                { value: 'MENSAL', label: 'Mensal (mín 2 banhos em 2 meses)', discount: '5% OFF' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => handleSelect(opt.value as any)}
                                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${selectedFreq === opt.value ? 'border-primary bg-primary/10' : 'border-gray-100 hover:border-pink-500 hover:bg-pink-50'}`}
                                                >
                                                    <span className={`font-bold group-hover:text-pink-600 ${selectedFreq === opt.value ? 'text-primary' : 'text-gray-700'}`}>{opt.label}</span>
                                                    <span className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${selectedFreq === opt.value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-pink-200 group-hover:text-pink-700'}`}>
                                                        {opt.discount}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>

                                        <button onClick={onClose} className="mt-6 text-xs text-gray-400 font-bold hover:text-gray-600">
                                            Cancelar (Não mudar para recorrente)
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="celebrate"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="py-8"
                                    >
                                        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
                                            PARABÉNS EQUIPE!
                                        </h2>
                                        <p className="text-lg text-gray-600 font-bold mb-6">
                                            Mais um cliente feliz fazendo parte da nossa família! 💖
                                        </p>

                                        <div className="flex justify-center gap-2 mb-8">
                                            {[...Array(5)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ y: 0 }}
                                                    animate={{ y: -20 }}
                                                    transition={{
                                                        y: { yoyo: Infinity, duration: 0.5, delay: i * 0.1 }
                                                    }}
                                                >
                                                    <Sparkles className="text-yellow-400" size={24} />
                                                </motion.div>
                                            ))}
                                        </div>

                                        <p className="text-sm text-gray-400 animate-pulse">Aplicando descontos e salvando...</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
