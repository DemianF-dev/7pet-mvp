import {
    User,
    History,
    CheckCircle2,
    Save,
    Send,
    Calendar,
    RefreshCcw,
    ChevronLeft
} from 'lucide-react';
import Breadcrumbs from '../Breadcrumbs';
import BackButton from '../../BackButton';
import { getQuoteStatusColor } from '../../../utils/statusColors';

interface QuoteHeaderProps {
    isModal: boolean;
    quoteId?: string;
    seqId?: number;
    status: string;
    customerName: string;
    customerId: string;
    onClose?: () => void;
    onViewAppointment: () => void;
    onOpenCustomer: (id: string) => void;
    onShowAuditLog: () => void;
    onApproveAndSchedule: () => void;
    isApprovePending: boolean;
    onSchedule?: () => void;
    onSave: () => void;
    onSendToClient: () => void;
    isSaving: boolean;
    isAutoSaving?: boolean;
    lastSaved?: Date | null;
}

const QuoteHeader: React.FC<QuoteHeaderProps> = ({
    isModal,
    seqId,
    status,
    customerName,
    customerId,
    onClose,
    onViewAppointment,
    onOpenCustomer,
    onShowAuditLog,
    onApproveAndSchedule,
    isApprovePending,
    onSchedule,
    onSave,
    onSendToClient,
    isSaving,
    isAutoSaving,
    lastSaved
}) => {
    return (
        <header className="mb-10 bg-white dark:bg-gray-800 rounded-[40px] p-8 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

            {!isModal && (
                <div className="mb-6">
                    <Breadcrumbs />
                </div>
            )}
            <div className="relative z-10 flex flex-col gap-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-50 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        {!isModal && <BackButton className="" />}
                        {isModal && (
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors mr-2">
                                <ChevronLeft size={24} className="text-secondary dark:text-white" />
                            </button>
                        )}
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    OR-{String(seqId || 0).padStart(4, '0')}
                                </span>
                                <button
                                    onClick={onViewAppointment}
                                    className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${status === 'AGENDADO' ? 'hover:ring-2 hover:ring-offset-1 hover:ring-green-500 cursor-pointer' : 'cursor-default'} ${getQuoteStatusColor(status)}`}
                                >
                                    {status}
                                </button>
                                {isAutoSaving ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                        <RefreshCcw size={10} className="animate-spin" /> Salvando...
                                    </span>
                                ) : lastSaved ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                        <CheckCircle2 size={10} className="text-green-500" /> Salvo às {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                ) : null}
                            </div>
                            <h1 className="text-3xl font-black text-secondary dark:text-white mt-2">
                                {customerName}
                            </h1>
                            <div className="flex flex-col gap-1 mt-1">
                                <button
                                    onClick={() => onOpenCustomer(customerId)}
                                    className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    <User size={12} /> Ver ficha completa do cliente
                                </button>
                                <button
                                    onClick={onShowAuditLog}
                                    className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-purple-600 transition-colors flex items-center gap-1"
                                >
                                    <History size={12} /> Ver histórico de alterações
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {(status !== 'AGENDADO' && status !== 'ENCERRADO' && status !== 'APROVADO') && (
                            <button
                                onClick={onApproveAndSchedule}
                                disabled={isApprovePending}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                            >
                                {isApprovePending ? (
                                    <RefreshCcw size={16} className="animate-spin" />
                                ) : (
                                    <CheckCircle2 size={16} />
                                )}
                                Aprovar & Agendar
                            </button>
                        )}
                        {status === 'APROVADO' && onSchedule && (
                            <button
                                onClick={onSchedule}
                                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-black rounded-2xl shadow-xl shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest"
                            >
                                <Calendar size={16} /> Agendar Agora
                            </button>
                        )}
                        <button
                            onClick={onSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-secondary dark:text-white font-bold rounded-2xl shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-50 text-xs uppercase tracking-widest"
                        >
                            <Save size={16} /> Salvar Alterações
                        </button>
                        <button
                            onClick={onSendToClient}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-xs uppercase tracking-widest"
                        >
                            <Send size={16} /> Validar & Enviar
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default QuoteHeader;
