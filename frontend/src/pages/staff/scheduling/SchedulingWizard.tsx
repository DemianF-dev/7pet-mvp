
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Check, ArrowRight, Save, Trash2, Wand2, List } from 'lucide-react';
import api from '../../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TransportLeg {
    id: string;
    legType: string;
    providerId: string | null;
}

interface AppointmentDraft {
    id: string;
    startAt: string | null;
    performerId: string | null;
    status: string;
    services: { name: string }[];
    performer?: { name: string };
    category?: string;
    transportMode?: string;
    transportLegs?: TransportLeg[];
    providerLevaId?: string | null;
    providerTrazId?: string | null;
}

interface Plan {
    id: string;
    status: string;
    customer: { name: string };
    appointments: AppointmentDraft[];
}

export default function SchedulingWizard() {
    const { quoteId } = useParams();
    const navigate = useNavigate();
    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [batchDate, setBatchDate] = useState('');
    const [batchTime, setBatchTime] = useState('09:00');
    const [batchStaff, setBatchStaff] = useState('');
    const [staffList, setStaffList] = useState<any[]>([]);

    useEffect(() => {
        const initPlan = async () => {
            try {
                // Try to create plan from quote or get existing
                const resp = await api.post(`/scheduling/plans/from-quote/${quoteId}`).catch((e: any) => {
                    if (e.response?.data?.planId) {
                        return api.get(`/scheduling/plans/${e.response.data.planId}`);
                    }
                    throw e;
                });

                // If the post returned the plan directly (newly created) or we refetched it
                const planData = resp.data.id ? resp.data : (await api.get(`/scheduling/plans/${resp.data.id}`)).data;

                // Final fetch to ensure we have all relations
                const finalResp = await api.get(`/scheduling/plans/${planData.id}`);
                const enrichedPlan = {
                    ...finalResp.data,
                    appointments: finalResp.data.appointments.map((a: any) => ({
                        ...a,
                        providerLevaId: (a.transportLegs || []).find((l: any) => l.legType === 'LEVA')?.providerId,
                        providerTrazId: (a.transportLegs || []).find((l: any) => l.legType === 'TRAZ')?.providerId
                    }))
                };
                setPlan(enrichedPlan);

                // Fetch staff for dropdown
                const staffResp = await api.get('/users/staff');
                setStaffList(staffResp.data);

            } catch (error) {
                console.error('Error initializing wizard:', error);
                alert('Erro ao carregar o wizard. Verifique se o backend está atualizado.');
            } finally {
                setLoading(false);
            }
        };
        if (quoteId) {
            initPlan();
        } else {
            setLoading(false);
        }
    }, [quoteId]);

    const handleUpdateAppointment = (id: string, field: string, value: any) => {
        if (!plan) return;
        setPlan({
            ...plan,
            appointments: plan.appointments.map(a => a.id === id ? { ...a, [field]: value } : a)
        });
    };

    const applyBatchTools = () => {
        if (!plan || !batchDate) return;

        const newAppts = plan.appointments.map((a, index) => {
            // Apply logic: Weekly from start date
            const date = new Date(`${batchDate}T${batchTime}`);
            date.setDate(date.getDate() + (index * 7));

            return {
                ...a,
                startAt: date.toISOString(),
                performerId: batchStaff || a.performerId
            };
        });

        setPlan({ ...plan, appointments: newAppts });
    };

    const saveChanges = async () => {
        if (!plan) return;
        setSaving(true);
        try {
            await api.patch(`/scheduling/plans/${plan.id}/appointments/bulk`, {
                updates: plan.appointments.map(a => ({
                    id: a.id,
                    startAt: a.startAt,
                    performerId: a.performerId,
                    providerLevaId: a.providerLevaId,
                    providerTrazId: a.providerTrazId
                }))
            });
            alert('Alterações salvas!');
            const finalResp = await api.get(`/scheduling/plans/${plan.id}`);
            setPlan(finalResp.data);
        } catch (e) {
            alert('Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const confirmPlan = async () => {
        if (!plan) return;
        try {
            await api.post(`/scheduling/plans/${plan.id}/confirm`);
            alert('Plano confirmado e agendamentos criados!');
            navigate('/staff/agenda');
        } catch (e: any) {
            alert(e.response?.data?.error || 'Erro ao confirmar');
        }
    };

    if (loading) return <div className="p-8 text-center text-zinc-500">Iniciando Wizard...</div>;

    if (!quoteId && !plan) {
        return (
            <div className="p-12 text-center max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wand2 size={32} />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Wizard de Agendamento</h2>
                <p className="text-zinc-500 text-sm">Este wizard serve para programar orçamentos aprovados de pacotes/recorrentes.</p>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs text-zinc-400">Para começar, abra o wizard a partir de um orçamento ou use a aba de "Orçamentos".</p>
                </div>
                <button onClick={() => navigate('/staff/quotes')} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm">
                    Ir para Orçamentos
                </button>
            </div>
        );
    }

    if (!plan) return <div className="p-8 text-center text-red-500">Não foi possível carregar o plano ou orçamento especificado.</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <header className="flex justify-between items-center bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Wand2 className="text-blue-500" /> Programar Pacote: {plan.customer.name}
                    </h1>
                    <p className="text-zinc-500 text-sm">Status: <span className="font-bold underline uppercase">{plan.status}</span></p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={saveChanges}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-bold transition-all text-sm"
                    >
                        <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Rascunho'}
                    </button>
                    <button
                        onClick={confirmPlan}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg shadow-green-600/20 transition-all text-sm"
                    >
                        <Check size={18} /> Confirmar Todo Pacote
                    </button>
                </div>
            </header>

            {/* Batch Tools Panel */}
            <section className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
                <h2 className="text-sm font-bold text-blue-800 dark:text-blue-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <List size={16} /> Ferramentas em Lote (Preenchimento Rápido)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1">Data de Início</label>
                        <input
                            type="date"
                            className="w-full p-2 rounded-lg border dark:bg-zinc-800 dark:border-zinc-700 text-sm"
                            value={batchDate}
                            onChange={(e) => setBatchDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1">Horário Padrão</label>
                        <input
                            type="time"
                            className="w-full p-2 rounded-lg border dark:bg-zinc-800 dark:border-zinc-700 text-sm"
                            value={batchTime}
                            onChange={(e) => setBatchTime(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1">Responsável</label>
                        <select
                            className="w-full p-2 rounded-lg border dark:bg-zinc-800 dark:border-zinc-700 text-sm"
                            value={batchStaff}
                            onChange={(e) => setBatchStaff(e.target.value)}
                        >
                            <option value="">Nenhum selec.</option>
                            {staffList.map(s => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={applyBatchTools}
                        className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs"
                    >
                        APLICAR PADRÃO SEMANAL
                    </button>
                </div>
            </section>

            {/* Appointments List */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 text-xs font-bold uppercase border-b dark:border-zinc-800">
                        <tr>
                            <th className="px-6 py-4">#</th>
                            <th className="px-6 py-4">Serviço</th>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4">Hora</th>
                            <th className="px-6 py-4">Responsável</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {plan.appointments.map((appt, idx) => (
                            <tr key={appt.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs text-zinc-400">{idx + 1}</td>
                                <td className="px-6 py-4 font-bold text-sm">{appt.services.map(s => s.name).join(', ')}</td>
                                <td className="px-6 py-4">
                                    <input
                                        type="date"
                                        className="p-1 rounded bg-transparent border-b border-zinc-200 dark:border-zinc-700 text-sm focus:border-blue-500 outline-none"
                                        value={appt.startAt ? format(new Date(appt.startAt), 'yyyy-MM-dd') : ''}
                                        onChange={(e) => {
                                            const oldTime = appt.startAt ? format(new Date(appt.startAt), 'HH:mm') : '09:00';
                                            handleUpdateAppointment(appt.id, 'startAt', `${e.target.value}T${oldTime}`);
                                        }}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="time"
                                        className="p-1 rounded bg-transparent border-b border-zinc-200 dark:border-zinc-700 text-sm focus:border-blue-500 outline-none"
                                        value={appt.startAt ? format(new Date(appt.startAt), 'HH:mm') : ''}
                                        onChange={(e) => {
                                            const oldDate = appt.startAt ? format(new Date(appt.startAt), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
                                            handleUpdateAppointment(appt.id, 'startAt', `${oldDate}T${e.target.value}`);
                                        }}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    {import.meta.env.VITE_TRANSPORT_LEGS_V2_ENABLED === 'true' && appt.category === 'LOGISTICA' && appt.transportMode === 'LEVA_E_TRAZ' ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded font-bold">LEVA</span>
                                                <select
                                                    className="p-1 rounded bg-transparent border-b border-zinc-200 dark:border-zinc-700 text-xs focus:border-blue-500 outline-none flex-1"
                                                    value={appt.providerLevaId || ''}
                                                    onChange={(e) => handleUpdateAppointment(appt.id, 'providerLevaId', e.target.value)}
                                                >
                                                    <option value="">Não atribuído</option>
                                                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] bg-purple-100 text-purple-600 px-1 rounded font-bold">TRAZ</span>
                                                <select
                                                    className="p-1 rounded bg-transparent border-b border-zinc-200 dark:border-zinc-700 text-xs focus:border-blue-500 outline-none flex-1"
                                                    value={appt.providerTrazId || ''}
                                                    onChange={(e) => handleUpdateAppointment(appt.id, 'providerTrazId', e.target.value)}
                                                >
                                                    <option value="">Não atribuído</option>
                                                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    ) : (
                                        <select
                                            className="p-1 rounded bg-transparent border-b border-zinc-200 dark:border-zinc-700 text-sm focus:border-blue-500 outline-none w-full"
                                            value={appt.performerId || ''}
                                            onChange={(e) => handleUpdateAppointment(appt.id, 'performerId', e.target.value)}
                                        >
                                            <option value="">Não atribuído</option>
                                            {staffList.map(s => <option key={s.id} value={s.id}>{s.name || s.email}</option>)}
                                        </select>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${appt.startAt ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}>
                                        {appt.startAt ? 'Pronto' : 'Pendente'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
