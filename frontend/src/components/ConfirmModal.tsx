import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { useRef } from 'react';
import { useModalKeyboard, useModalFocusTrap } from '../hooks/useModalKeyboard';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    confirmColor?: string;
    cancelText?: string;
    children?: React.ReactNode;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirmar",
    confirmColor = "bg-primary",
    cancelText = "Cancelar",
    children
}: ConfirmModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    useModalKeyboard(isOpen, onClose);
    useModalFocusTrap(isOpen, modalRef);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
                    />
                    <motion.div
                        ref={modalRef}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden"
                        style={{
                            backgroundColor: 'var(--color-bg-surface)',
                            border: '1px solid var(--color-border)'
                        }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirm-modal-title"
                        aria-describedby="confirm-modal-description"
                    >
                        <div className="p-8 text-center">
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                                style={{ backgroundColor: 'var(--color-error)', opacity: 0.1 }}
                            >
                                <AlertCircle size={32} style={{ color: 'var(--color-error)' }} />
                            </div>

                            <h3
                                id="confirm-modal-title"
                                className="text-2xl font-bold mb-3 leading-tight"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                {title}
                            </h3>
                            <p
                                id="confirm-modal-description"
                                className="font-medium text-sm leading-relaxed mb-6"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                {description}
                            </p>

                            {children}

                            <div className="flex flex-col gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={`w-full py-4 ${confirmColor} text-white font-bold rounded-2xl shadow-xl shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-[10px]`}
                                    aria-label={`${confirmText} - ${title}`}
                                >
                                    {confirmText}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 font-bold rounded-2xl hover:opacity-80 transition-all uppercase tracking-widest text-[10px]"
                                    style={{
                                        backgroundColor: 'var(--color-fill-secondary)',
                                        color: 'var(--color-text-secondary)'
                                    }}
                                    aria-label="Cancelar e fechar modal"
                                >
                                    {cancelText}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 hover:opacity-70 transition-opacity"
                            style={{ color: 'var(--color-text-tertiary)' }}
                            aria-label="Fechar modal"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
