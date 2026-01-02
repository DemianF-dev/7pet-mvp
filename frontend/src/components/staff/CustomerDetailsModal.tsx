import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import CustomerDetail from '../../pages/staff/CustomerDetail';

interface CustomerDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerId: string | null;
    onUpdate?: () => void;
}

export default function CustomerDetailsModal({ isOpen, onClose, customerId, onUpdate }: CustomerDetailsModalProps) {
    if (!isOpen || !customerId) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 text-left">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-50 p-2 bg-white/50 hover:bg-white rounded-full text-gray-400 hover:text-red-500 transition-all shadow-sm"
                >
                    <X size={24} />
                </button>
                <CustomerDetail
                    customerId={customerId}
                    onClose={() => {
                        onClose();
                        if (onUpdate) onUpdate();
                    }}
                />
            </motion.div>
        </div>
    );
}
