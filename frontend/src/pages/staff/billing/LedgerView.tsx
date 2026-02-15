
import { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function LedgerView() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [ledger, setLedger] = useState<any>(null);

    useEffect(() => {
        api.get('/customers?limit=100').then(res => setCustomers(res.data.data || []));
    }, []);

    useEffect(() => {
        if (!selectedCustomer) return;
        api.get(`/billing/ledger?customerId=${selectedCustomer}`).then(res => setLedger(res.data));
    }, [selectedCustomer]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <label className="font-medium">Filtrar Cliente:</label>
                <select
                    className="p-2 border rounded-lg bg-white dark:bg-zinc-800"
                    onChange={e => setSelectedCustomer(e.target.value)}
                    value={selectedCustomer}
                >
                    <option value="">Selecione...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {ledger ? (
                <div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-6">
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Saldo Atual</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                            R$ {Number(ledger.balance).toFixed(2)}
                            <span className="text-sm font-medium text-gray-500 ml-2">({ledger.balance > 0 ? 'Devedor' : 'Credor/Zerado'})</span>
                        </p>
                    </div>

                    <table className="w-full text-sm">
                        <thead className="text-left text-xs uppercase text-gray-500 bg-gray-50 dark:bg-zinc-800">
                            <tr>
                                <th className="px-4 py-3">Data</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3">Referência</th>
                                <th className="px-4 py-3 text-right">Débito</th>
                                <th className="px-4 py-3 text-right">Crédito</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger.entries.map((entry: any) => (
                                <tr key={entry.id} className="border-b dark:border-zinc-800">
                                    <td className="px-4 py-3">{new Date(entry.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">{entry.type}</td>
                                    <td className="px-4 py-3 text-gray-500">{entry.reference}</td>
                                    <td className="px-4 py-3 text-right text-red-600 font-mono">
                                        {entry.direction === 'DEBIT' ? `R$ ${Number(entry.amount).toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right text-green-600 font-mono">
                                        {entry.direction === 'CREDIT' ? `R$ ${Number(entry.amount).toFixed(2)}` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-gray-500">Selecione um cliente para ver o extrato.</p>
            )}
        </div>
    );
}
