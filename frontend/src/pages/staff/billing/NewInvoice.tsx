
import { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function NewInvoice({ onSuccess }: { onSuccess: () => void }) {
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [appointments, setAppointments] = useState<any[]>([]);
    const [selectedAppts, setSelectedAppts] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        api.get('/customers?limit=100').then(res => setCustomers(res.data.data || []));
    }, []);

    useEffect(() => {
        if (!selectedCustomer) {
            setAppointments([]);
            return;
        }
        api.get(`/appointments?customerId=${selectedCustomer}&billingStatus=UNBILLED&limit=50`).then(res => {
            setAppointments(res.data.data || []);
        });
    }, [selectedCustomer]);

    const handleCreate = async () => {
        if (selectedAppts.length === 0) return alert('Selecione pelo menos um agendamento');

        try {
            setIsLoading(true);
            await api.post('/billing/invoices/draft', {
                customerId: selectedCustomer,
                appointmentIds: selectedAppts,
                notes: 'Gerado via Billing V2'
            });
            alert('Fatura rascunho criada!');
            onSuccess();
        } catch (e) {
            alert('Erro ao criar fatura. Verifique se o backend está rodando.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div>
                <label className="block text-sm font-medium mb-2">Cliente</label>
                <select
                    className="w-full p-2 border rounded-lg bg-white dark:bg-zinc-800 dark:border-zinc-700"
                    onChange={e => setSelectedCustomer(e.target.value)}
                    value={selectedCustomer}
                >
                    <option value="">Selecione...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {selectedCustomer && (
                <div>
                    <h3 className="font-bold mb-3">Agendamentos Pendentes</h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto border p-2 rounded-lg">
                        {appointments.length === 0 ? <p className="text-gray-500 text-sm">Nenhum item pendente.</p> :
                            appointments.map(app => (
                                <label key={app.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded cursor-pointer border-b last:border-0 border-gray-100 dark:border-zinc-800">
                                    <input
                                        type="checkbox"
                                        checked={selectedAppts.includes(app.id)}
                                        onChange={e => {
                                            if (e.target.checked) setSelectedAppts([...selectedAppts, app.id]);
                                            else setSelectedAppts(selectedAppts.filter(id => id !== app.id));
                                        }}
                                        className="w-4 h-4 rounded text-blue-600"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{new Date(app.startAt).toLocaleDateString()} - {app.pet?.name}</div>
                                        <div className="text-xs text-gray-500">{app.services?.map((s: any) => s.name).join(', ')}</div>
                                    </div>
                                    <div className="font-bold text-sm">
                                        {/* Placeholder price */}
                                    </div>
                                </label>
                            ))
                        }
                    </div>
                </div>
            )}

            <div className="pt-4 border-t flex justify-end">
                <button
                    onClick={handleCreate}
                    disabled={isLoading || selectedAppts.length === 0}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                    {isLoading ? 'Gerando...' : 'Gerar Rascunho'}
                </button>
            </div>
        </div>
    );
}
