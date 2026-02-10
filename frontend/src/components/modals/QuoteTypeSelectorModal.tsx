import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scissors, Truck, Layers } from 'lucide-react';
import { Button, IconButton } from '../ui';

interface QuoteTypeSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: 'SPA' | 'TRANSPORTE' | 'SPA_TRANSPORTE') => void;
}

export default function QuoteTypeSelectorModal({ isOpen, onClose, onSelect }: QuoteTypeSelectorModalProps) {
    if (!isOpen) return null;

    const cards = [
        {
            id: 'SPA',
            title: 'SPA (Banho & Tosa)',
            description: 'Serviços de estética, banho, tosa, hidratação e desembolo.',
            icon: Scissors,
            color: 'bg-pink-500',
            bg: 'bg-pink-50',
            borderColor: 'border-pink-200',
            hoverBorder: 'hover:border-pink-400',
            textColor: 'text-pink-600'
        },
        {
            id: 'TRANSPORTE',
            title: 'Transporte (Leva & Traz)',
            description: 'Apenas transporte (Táxi Pet/Uber Pet) sem serviços de SPA.',
            icon: Truck,
            color: 'bg-blue-500',
            bg: 'bg-blue-50',
            borderColor: 'border-blue-200',
            hoverBorder: 'hover:border-blue-400',
            textColor: 'text-blue-600'
        },
        {
            id: 'SPA_TRANSPORTE',
            title: 'Combo (SPA + Transporte)',
            description: 'Pacote completo: busca, realiza serviços de SPA e entrega.',
            icon: Layers,
            color: 'bg-purple-500',
            bg: 'bg-purple-50',
            borderColor: 'border-purple-200',
            hoverBorder: 'hover:border-purple-400',
            textColor: 'text-purple-600'
        }
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                >
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div>
                            <h2 className="text-xl font-bold text-secondary tracking-tight">Novo Orçamento</h2>
                            <p className="text-sm text-gray-500 font-medium">Selecione o tipo de serviço para iniciar</p>
                        </div>
                        <IconButton
                            icon={X}
                            onClick={onClose}
                            variant="ghost"
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="Fechar"
                        />
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {cards.map((card) => (
                            <button
                                key={card.id}
                                onClick={() => onSelect(card.id as any)}
                                className={`group relative flex flex-col items-center text-center p-8 rounded-2xl border-2 transition-all duration-200 ${card.bg} ${card.borderColor} ${card.hoverBorder} hover:shadow-lg hover:-translate-y-1`}
                            >
                                <div className={`w-16 h-16 rounded-2xl ${card.color} text-white flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                    <card.icon size={32} strokeWidth={2.5} />
                                </div>
                                <h3 className={`text-lg font-bold mb-3 ${card.textColor} tracking-tight`}>
                                    {card.title}
                                </h3>
                                <p className="text-sm font-medium text-gray-500 leading-relaxed">
                                    {card.description}
                                </p>

                                <div className={`mt-6 py-2 px-6 rounded-full text-xs font-bold uppercase tracking-wider bg-white/50 border border-transparent group-hover:border-current/20 ${card.textColor} transition-all`}>
                                    Selecionar
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
