import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';

interface PayStatement {
    id: string;
    payPeriodId: string;
    staffId: string;
    baseTotal: number;
    adjustmentsTotal: number;
    totalDue: number;
    detailsJson: any;
    generatedAt: string;
    staff: {
        id: string;
        department: string;
        payModel: string;
        user: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
        };
    };
    payPeriod: {
        id: string;
        startDate: string;
        endDate: string;
        type: string;
        status: string;
    };
}

const PayStatementDetail: React.FC = () => {
    const { statementId } = useParams<{ statementId: string }>();
    const navigate = useNavigate();
    const [statement, setStatement] = useState<PayStatement | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatement();
    }, [statementId]);

    const fetchStatement = async () => {
        try {
            const res = await api.get(`/hr/pay-statements/${statementId}`);
            setStatement(res.data);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao carregar comprovante');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    if (loading) {
        return (
            <div className="page-container">
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <p>Carregando...</p>
                </div>
            </div>
        );
    }

    if (!statement) return null;

    const details = statement.detailsJson || {};
    const payModel = statement.staff.payModel;

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0, marginBottom: '0.5rem' }}>Detalhes do Fechamento</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                        {statement.staff.user.name} • {statement.staff.department.toUpperCase()}
                    </p>
                </div>
                <button className="btn-secondary" onClick={() => navigate(-1)}>
                    ← Voltar
                </button>
            </div>

            {/* Summary Card */}
            <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)', color: 'white' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div>
                        <p style={{ opacity: 0.9, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Base</p>
                        <h2 style={{ margin: 0 }}>{formatCurrency(statement.baseTotal)}</h2>
                    </div>
                    <div>
                        <p style={{ opacity: 0.9, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Ajustes</p>
                        <h2 style={{ margin: 0, color: statement.adjustmentsTotal >= 0 ? '#4ade80' : '#f87171' }}>
                            {statement.adjustmentsTotal >= 0 ? '+' : ''}{formatCurrency(statement.adjustmentsTotal)}
                        </h2>
                    </div>
                    <div>
                        <p style={{ opacity: 0.9, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total a Pagar</p>
                        <h2 style={{ margin: 0, fontSize: '2rem' }}>{formatCurrency(statement.totalDue)}</h2>
                    </div>
                </div>
            </div>

            {/* Period Info */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginTop: 0 }}>Período</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Início</p>
                        <p style={{ margin: 0, fontWeight: 500 }}>{formatDate(statement.payPeriod.startDate)}</p>
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Fim</p>
                        <p style={{ margin: 0, fontWeight: 500 }}>{formatDate(statement.payPeriod.endDate)}</p>
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Tipo</p>
                        <p style={{ margin: 0, fontWeight: 500 }}>{statement.payPeriod.type.toUpperCase()}</p>
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Status</p>
                        <span className={`badge badge-${statement.payPeriod.status === 'closed' ? 'success' : 'warning'}`}>
                            {statement.payPeriod.status === 'closed' ? 'Fechado' : 'Rascunho'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Calculation Details based on Pay Model */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginTop: 0 }}>Detalhes do Cálculo</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Modelo: <strong>{payModel === 'daily' ? 'Diária' : payModel === 'per_leg' ? 'Por Viagem' : payModel === 'fixed' ? 'Fixo' : 'Transporte'}</strong>
                </p>

                {/* DAILY MODEL */}
                {payModel === 'daily' && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Dias Trabalhados</p>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{details.daysWorked || 0}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Valor da Diária</p>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{formatCurrency(details.dailyRate || 0)}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Atendimentos</p>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{details.servicesExecuted || 0}</p>
                            </div>
                        </div>

                        {details.breakdown && (
                            <div style={{ background: 'var(--background-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Composição</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Diárias ({details.daysWorked} × {formatCurrency(details.dailyRate)})</span>
                                        <strong>{formatCurrency(details.breakdown.dailyRateTotal || 0)}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Vale Transporte</span>
                                        <strong>{formatCurrency(details.breakdown.transportTotal || 0)}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Vale Refeição</span>
                                        <strong>{formatCurrency(details.breakdown.mealTotal || 0)}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Outros Benefícios</span>
                                        <strong>{formatCurrency(details.breakdown.benefitsTotal || 0)}</strong>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* FIXED MODEL */}
                {payModel === 'fixed' && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Salário Mensal</p>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{formatCurrency(details.monthlySalary || 0)}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Dias no Período</p>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{details.totalDaysInPeriod || 0}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Dias Trabalhados</p>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{details.workedDaysInPeriod || 0}</p>
                            </div>
                        </div>

                        {details.prorated && (
                            <div style={{ padding: '1rem', background: 'var(--warning-light)', borderLeft: '4px solid var(--warning)', marginBottom: '1rem', borderRadius: '4px' }}>
                                <p style={{ margin: 0, fontWeight: 500 }}>⚠️ Salário Prorrateado</p>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                                    {details.proratingReason} • Multiplicador: {(details.prorateMultiplier * 100).toFixed(1)}%
                                </p>
                            </div>
                        )}

                        {details.breakdown && (
                            <div style={{ background: 'var(--background-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Composição</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Salário Base {details.prorated ? '(Prorrateado)' : ''}</span>
                                        <strong>{formatCurrency(details.breakdown.salaryBase || 0)}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Vale Transporte ({details.workedDaysInPeriod} dias)</span>
                                        <strong>{formatCurrency(details.breakdown.transportTotal || 0)}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Vale Refeição ({details.workedDaysInPeriod} dias)</span>
                                        <strong>{formatCurrency(details.breakdown.mealTotal || 0)}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Outros Benefícios</span>
                                        <strong>{formatCurrency(details.breakdown.benefitsTotal || 0)}</strong>
                                    </div>
                                </div>
                            </div>
                        )}

                        {details.attendanceDaysForReference !== undefined && (
                            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                📊 Presença registrada: {details.attendanceDaysForReference} dias (apenas para referência)
                            </p>
                        )}
                    </div>
                )}

                {/* TRANSPORT MODEL */}
                {statement.staff.department === 'transport' && (
                    <div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Viagens Completadas</p>
                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{details.legsCompleted || 0}</p>
                        </div>

                        <div style={{ background: 'var(--background-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Regra de Comissão</h4>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                60% do valor líquido do transporte (Valor Bruto - 6% impostos)
                            </p>
                            <p style={{ margin: '0.5rem 0 0 0', fontWeight: 600 }}>
                                Total: {formatCurrency(details.totalCommission || 0)}
                            </p>
                        </div>

                        {details.calculationLogs && details.calculationLogs.length > 0 && (
                            <div>
                                <h4 style={{ marginBottom: '0.5rem' }}>Detalhamento por Viagem</h4>
                                <div style={{ background: 'var(--background-tertiary)', padding: '1rem', borderRadius: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                                    <pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                        {details.calculationLogs.join('\n')}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* PER LEG MODEL */}
                {payModel === 'per_leg' && statement.staff.department !== 'transport' && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Total de Viagens</p>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{details.legsCompleted || 0}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Valor Padrão</p>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{formatCurrency(details.perLegRate || 0)}</p>
                            </div>
                        </div>

                        <div style={{ background: 'var(--background-secondary)', padding: '1rem', borderRadius: '8px' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Composição</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Viagens com valor customizado</span>
                                    <strong>{details.legsWithCustomValue || 0}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Viagens com valor padrão</span>
                                    <strong>{details.legsWithDefaultRate || 0}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Adjustments */}
            {details.adjustments && details.adjustments.length > 0 && (
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>Ajustes</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {details.adjustments.map((adj: any, idx: number) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    background: 'var(--background-secondary)',
                                    borderRadius: '8px',
                                    borderLeft: `4px solid ${adj.direction === 'add' ? 'var(--success)' : 'var(--error)'}`
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontWeight: 500 }}>
                                        {adj.type === 'advance' ? 'Adiantamento' :
                                            adj.type === 'bonus' ? 'Bônus' :
                                                adj.type === 'discount' ? 'Desconto' :
                                                    adj.type === 'benefit' ? 'Benefício' : 'Correção'}
                                    </p>
                                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {adj.reason}
                                    </p>
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: adj.direction === 'add' ? 'var(--success)' : 'var(--error)' }}>
                                    {adj.direction === 'add' ? '+' : '-'}{formatCurrency(adj.amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayStatementDetail;
