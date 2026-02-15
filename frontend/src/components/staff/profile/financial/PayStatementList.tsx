import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PayStatementListProps {
    staffId: string;
}

export const PayStatementList: React.FC<PayStatementListProps> = ({ staffId }) => {
    const [statements, setStatements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!staffId) return;
        setLoading(true);
        api.get(`/staff/${staffId}/payroll/history`)
            .then(res => setStatements(res.data))
            .catch(err => {
                console.error(err);
                toast.error('Erro ao carregar histórico');
            })
            .finally(() => setLoading(false));
    }, [staffId]);

    if (loading) return <div className="p-4 text-center text-slate-400">Carregando histórico...</div>;

    if (statements.length === 0) {
        return (
            <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileText className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-slate-500 font-medium">Nenhum fechamento encontrado.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {statements.map((statement) => (
                <div key={statement.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-indigo-100 transition-colors">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${statement.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                {statement.status === 'PAID' ? 'PAGO' : 'EMITIDO'}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                #{statement.id.slice(0, 8)}
                            </span>
                        </div>
                        <h4 className="font-bold text-slate-700">
                            {format(new Date(statement.staffPayPeriod.startDate), "dd/MM", { locale: ptBR })} à {format(new Date(statement.staffPayPeriod.endDate), "dd/MM/yyyy", { locale: ptBR })}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                            Emitido em {format(new Date(statement.createdAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-lg font-bold text-slate-800">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(statement.totalDue)}
                        </p>
                        <div className="flex items-center gap-2 mt-2 justify-end">
                            <button
                                onClick={() => navigate(`/staff/hr/pay-statements/${statement.id}`)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Ver Detalhes"
                            >
                                <Eye size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
