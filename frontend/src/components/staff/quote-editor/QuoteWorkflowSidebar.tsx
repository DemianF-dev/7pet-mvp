import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface QuoteWorkflowSidebarProps {
    status: string;
    setStatus: (s: string) => void;
}

const QuoteWorkflowSidebar: React.FC<QuoteWorkflowSidebarProps> = ({
    status,
    setStatus
}) => {
    const statuses = [
        'SOLICITADO',
        'EM_PRODUCAO',
        'CALCULADO',
        'ENVIADO',
        'APROVADO',
        'REJEITADO',
        'AGENDAR',
        'AGENDADO',
        'ENCERRADO'
    ];

    return (
        <section className="bg-secondary text-white rounded-[40px] p-8 shadow-xl">
            <h3 className="text-lg font-black mb-6 uppercase tracking-widest text-primary">Status do Workflow</h3>

            <div className="space-y-3">
                {statuses.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`w-full py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between ${status === s ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        {s}
                        {status === s && <CheckCircle2 size={16} />}
                    </button>
                ))}
            </div>
        </section>
    );
};

export default QuoteWorkflowSidebar;
