
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { format } from 'date-fns';

export default function InvoicesList() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/billing/invoices');
            setInvoices(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleIssue = async (id: string) => {
        if (!confirm('Emitir fatura? Isso gerará débito para o cliente.')) return;
        try {
            await api.post(`/billing/invoices/${id}/issue`);
            fetchInvoices();
        } catch (e) {
            alert('Erro ao emitir');
        }
    };

    const handleVoid = async (id: string) => {
        if (!confirm('Anular fatura?')) return;
        try {
            await api.post(`/billing/invoices/${id}/void`);
            fetchInvoices();
        } catch (e) {
            alert('Erro ao anular');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Últimas Faturas</h2>
                <button onClick={fetchInvoices} className="text-sm text-blue-600 hover:underline">Atualizar</button>
            </div>

            {isLoading ? (
                <p>Carregando...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-zinc-800">
                            <tr>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Vencimento</th>
                                <th className="px-4 py-3 text-right">Valor</th>
                                <th className="px-4 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="border-b dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                                    <td className="px-4 py-3 font-medium">{inv.customer?.name || 'Cliente Removido'}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={inv.status} />
                                    </td>
                                    <td className="px-4 py-3">
                                        {format(new Date(inv.dueDate), 'dd/MM/yyyy')}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono">
                                        R$ {inv.amount.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-center flex justify-center gap-2">
                                        {inv.status === 'DRAFT' && (
                                            <button onClick={() => handleIssue(inv.id)} className="text-green-600 hover:underline font-bold text-xs">EMITIR</button>
                                        )}
                                        {inv.status === 'ISSUED' && (
                                            <>
                                                <button onClick={() => handleVoid(inv.id)} className="text-red-500 hover:underline text-xs">Anular</button>
                                                <button onClick={() => api.post('/billing/payments', { customerId: inv.customerId, amount: inv.amount, reference: `Auto Pay ${inv.id}` }).then(fetchInvoices)} className="text-blue-500 hover:underline text-xs ml-2">Pagar (Dev)</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        DRAFT: 'bg-gray-100 text-gray-800',
        ISSUED: 'bg-blue-100 text-blue-800',
        PAID: 'bg-green-100 text-green-800',
        VOID: 'bg-red-100 text-red-800'
    };
    return (
        <span className={`px-2 py-1 rounded text-xs font-bold ${styles[status] || 'bg-gray-100'}`}>
            {status}
        </span>
    );
}
