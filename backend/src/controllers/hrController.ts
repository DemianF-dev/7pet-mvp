import { Request, Response } from 'express';
import hrService from '../services/hrService';

// ============================================
// STAFF PROFILES
// ============================================

export async function createStaffProfile(req: Request, res: Response) {
    try {
        const { userId, department, payModel, dailyRate, perLegRate, payPeriodPreference } = req.body;

        if (!userId || !department || !payModel) {
            return res.status(400).json({ error: 'userId, department e payModel são obrigatórios' });
        }

        const profile = await hrService.createStaffProfile({
            userId,
            department,
            payModel,
            dailyRate,
            perLegRate,
            payPeriodPreference
        });

        res.status(201).json(profile);
    } catch (error: any) {
        console.error('Erro ao criar perfil:', error);
        res.status(500).json({ error: error.message || 'Erro ao criar perfil' });
    }
}

export async function updateStaffProfile(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const profile = await hrService.updateStaffProfile(id, req.body);
        res.json(profile);
    } catch (error: any) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ error: error.message || 'Erro ao atualizar perfil' });
    }
}

export async function getStaffProfiles(req: Request, res: Response) {
    try {
        const { department, isActive } = req.query;
        const profiles = await hrService.getStaffProfiles({
            department: department as string | undefined,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
        });
        res.json(profiles);
    } catch (error: any) {
        console.error('Erro ao buscar perfis:', error);
        res.status(500).json({ error: error.message || 'Erro ao buscar perfis' });
    }
}

export async function getMyStaffProfile(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: 'Não autenticado' });

        const profile = await hrService.getStaffProfileByUserId(userId);
        if (!profile) return res.status(404).json({ error: 'Perfil não encontrado' });

        res.json(profile);
    } catch (error: any) {
        console.error('Erro ao buscar meu perfil:', error);
        res.status(500).json({ error: error.message });
    }
}

// ============================================
// ATTENDANCE
// ============================================

export async function checkIn(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: 'Não autenticado' });

        const profile = await hrService.getStaffProfileByUserId(userId);
        if (!profile) return res.status(404).json({ error: 'Você não possui perfil de colaborador' });

        const record = await hrService.checkIn(profile.id, userId);
        res.json(record);
    } catch (error: any) {
        console.error('Erro no check-in:', error);
        res.status(400).json({ error: error.message });
    }
}

export async function checkOut(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: 'Não autenticado' });

        const profile = await hrService.getStaffProfileByUserId(userId);
        if (!profile) return res.status(404).json({ error: 'Você não possui perfil de colaborador' });

        const record = await hrService.checkOut(profile.id);
        res.json(record);
    } catch (error: any) {
        console.error('Erro no check-out:', error);
        res.status(400).json({ error: error.message });
    }
}

export async function getAttendanceRecords(req: Request, res: Response) {
    try {
        const { staffId, startDate, endDate, status, department } = req.query;

        const records = await hrService.getAttendanceRecords({
            staffId: staffId as string | undefined,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
            status: status as string | undefined,
            department: department as string | undefined
        });

        res.json(records);
    } catch (error: any) {
        console.error('Erro ao buscar registros:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function updateAttendance(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { status, checkInAt, checkOutAt, notes, reason } = req.body;
        const userId = (req as any).user?.id;

        if (!reason) {
            return res.status(400).json({ error: 'Motivo da alteração é obrigatório' });
        }

        const record = await hrService.updateAttendance(
            id,
            { status, checkInAt, checkOutAt, notes },
            userId,
            reason
        );

        res.json(record);
    } catch (error: any) {
        console.error('Erro ao atualizar registro:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getTodayAttendance(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: 'Não autenticado' });

        const profile = await hrService.getStaffProfileByUserId(userId);
        if (!profile) return res.json(null);

        const record = await hrService.getTodayAttendance(profile.id);
        res.json(record);
    } catch (error: any) {
        console.error('Erro ao buscar ponto de hoje:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getMyAttendance(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: 'Não autenticado' });

        const profile = await hrService.getStaffProfileByUserId(userId);
        if (!profile) return res.status(404).json({ error: 'Perfil não encontrado' });

        const { startDate, endDate } = req.query;

        const records = await hrService.getAttendanceRecords({
            staffId: profile.id,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined
        });

        res.json(records);
    } catch (error: any) {
        console.error('Erro ao buscar meu histórico de ponto:', error);
        res.status(500).json({ error: error.message });
    }
}

// ============================================
// SERVICE EXECUTIONS
// ============================================

export async function getServiceExecutions(req: Request, res: Response) {
    try {
        const { staffId, startDate, endDate } = req.query;

        const executions = await hrService.getServiceExecutions({
            staffId: staffId as string | undefined,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined
        });

        res.json(executions);
    } catch (error: any) {
        console.error('Erro ao buscar execuções:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function createServiceExecution(req: Request, res: Response) {
    try {
        const { appointmentId, staffId, serviceId, notes } = req.body;

        if (!appointmentId || !staffId) {
            return res.status(400).json({ error: 'appointmentId e staffId são obrigatórios' });
        }

        const execution = await hrService.createServiceExecution({
            appointmentId,
            staffId,
            serviceId,
            notes
        });

        res.status(201).json(execution);
    } catch (error: any) {
        console.error('Erro ao criar execução:', error);
        res.status(500).json({ error: error.message });
    }
}

// ============================================
// TRANSPORT LEG EXECUTIONS
// ============================================

export async function getTransportLegExecutions(req: Request, res: Response) {
    try {
        const { staffId, startDate, endDate } = req.query;

        const executions = await hrService.getTransportLegExecutions({
            staffId: staffId as string | undefined,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined
        });

        res.json(executions);
    } catch (error: any) {
        console.error('Erro ao buscar pernadas:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function createTransportLegExecution(req: Request, res: Response) {
    try {
        const { appointmentId, staffId, legType, legValue, notes } = req.body;

        if (!appointmentId || !staffId || !legType) {
            return res.status(400).json({ error: 'appointmentId, staffId e legType são obrigatórios' });
        }

        const execution = await hrService.createTransportLegExecution({
            appointmentId,
            staffId,
            legType,
            legValue,
            notes
        });

        res.status(201).json(execution);
    } catch (error: any) {
        console.error('Erro ao criar pernada:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Esta pernada já foi registrada' });
        }
        res.status(500).json({ error: error.message });
    }
}

// ============================================
// PAY PERIODS
// ============================================

export async function createPayPeriod(req: Request, res: Response) {
    try {
        const { startDate, endDate, type } = req.body;
        const userId = (req as any).user?.id;

        if (!startDate || !endDate || !type) {
            return res.status(400).json({ error: 'startDate, endDate e type são obrigatórios' });
        }

        const period = await hrService.createPayPeriod({
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            type,
            createdById: userId
        });

        res.status(201).json(period);
    } catch (error: any) {
        console.error('Erro ao criar período:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getPayPeriods(req: Request, res: Response) {
    try {
        const { status } = req.query;
        const periods = await hrService.getPayPeriods(status as string | undefined);
        res.json(periods);
    } catch (error: any) {
        console.error('Erro ao buscar períodos:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function generatePayStatements(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const statements = await hrService.generatePayStatements(id);
        res.json(statements);
    } catch (error: any) {
        console.error('Erro ao gerar recibos:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function closePayPeriod(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const period = await hrService.closePayPeriod(id, userId);
        res.json(period);
    } catch (error: any) {
        console.error('Erro ao fechar período:', error);
        res.status(500).json({ error: error.message });
    }
}

// ============================================
// PAY ADJUSTMENTS
// ============================================

export async function createPayAdjustment(req: Request, res: Response) {
    try {
        const { payPeriodId, staffId, type, amount, direction, reason } = req.body;
        const userId = (req as any).user?.id;

        if (!payPeriodId || !staffId || !type || !amount || !direction || !reason) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        const adjustment = await hrService.createPayAdjustment({
            payPeriodId,
            staffId,
            type,
            amount,
            direction,
            reason,
            createdById: userId
        });

        res.status(201).json(adjustment);
    } catch (error: any) {
        console.error('Erro ao criar ajuste:', error);
        res.status(400).json({ error: error.message });
    }
}

export async function getPayAdjustments(req: Request, res: Response) {
    try {
        const { payPeriodId, staffId } = req.query;

        if (!payPeriodId) {
            return res.status(400).json({ error: 'payPeriodId é obrigatório' });
        }

        const adjustments = await hrService.getPayAdjustments(
            payPeriodId as string,
            staffId as string | undefined
        );

        res.json(adjustments);
    } catch (error: any) {
        console.error('Erro ao buscar ajustes:', error);
        res.status(500).json({ error: error.message });
    }
}

// ============================================
// PAY STATEMENTS
// ============================================

export async function getPayStatements(req: Request, res: Response) {
    try {
        const { payPeriodId } = req.query;

        if (!payPeriodId) {
            return res.status(400).json({ error: 'payPeriodId é obrigatório' });
        }

        const statements = await hrService.getPayStatements(payPeriodId as string);
        res.json(statements);
    } catch (error: any) {
        console.error('Erro ao buscar recibos:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getPayStatement(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const statement = await hrService.getPayStatement(id);

        if (!statement) {
            return res.status(404).json({ error: 'Recibo não encontrado' });
        }

        res.json(statement);
    } catch (error: any) {
        console.error('Erro ao buscar recibo:', error);
        res.status(500).json({ error: error.message });
    }
}

export async function getMyPayStatements(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: 'Não autenticado' });

        const statements = await hrService.getMyPayStatements(userId);
        res.json(statements);
    } catch (error: any) {
        console.error('Erro ao buscar meus recibos:', error);
        res.status(500).json({ error: error.message });
    }
}

// ============================================
// RECEIPT HTML (Print-friendly)
// ============================================

export async function getReceiptHtml(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const statement = await hrService.getPayStatement(id);

        if (!statement) {
            return res.status(404).json({ error: 'Recibo não encontrado' });
        }

        const details = statement.detailsJson as any || {};
        const user = statement.staff.user;
        const period = statement.payPeriod;

        const formatDate = (d: Date) => new Date(d).toLocaleDateString('pt-BR');
        const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recibo - ${user.name}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #1a1a1a; padding-bottom: 24px; }
        .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        .header p { color: #666; font-size: 14px; }
        .section { margin-bottom: 24px; }
        .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 12px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .info-item { }
        .info-label { font-size: 11px; color: #999; text-transform: uppercase; }
        .info-value { font-size: 16px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { font-size: 11px; text-transform: uppercase; color: #666; font-weight: 600; }
        td { font-size: 14px; }
        .amount { text-align: right; }
        .total-row { background: #f5f5f5; font-weight: 700; }
        .total-row td { font-size: 18px; }
        .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #eee; font-size: 11px; color: #999; text-align: center; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .badge-add { background: #d4edda; color: #155724; }
        .badge-subtract { background: #f8d7da; color: #721c24; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>RECIBO DE PAGAMENTO</h1>
        <p>Prestador de Serviços</p>
    </div>

    <div class="section">
        <div class="section-title">Colaborador</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Nome</div>
                <div class="info-value">${user.name || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Departamento</div>
                <div class="info-value">${details.department?.toUpperCase() || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Modelo de Pagamento</div>
                <div class="info-value">${details.payModel === 'daily' ? 'Diária' : details.payModel === 'per_leg' ? 'Por Pernada' : 'Fixo'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Período</div>
                <div class="info-value">${formatDate(period.startDate)} a ${formatDate(period.endDate)}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Detalhamento</div>
        <table>
            <thead>
                <tr>
                    <th>Descrição</th>
                    <th>Quantidade</th>
                    <th>Valor Unitário</th>
                    <th class="amount">Total</th>
                </tr>
            </thead>
            <tbody>
                ${details.payModel === 'daily' ? `
                <tr>
                    <td>Dias trabalhados</td>
                    <td>${details.daysWorked || 0}</td>
                    <td>${formatCurrency(details.dailyRate || 0)}</td>
                    <td class="amount">${formatCurrency(statement.baseTotal)}</td>
                </tr>
                ${details.servicesExecuted ? `
                <tr>
                    <td colspan="4" style="color: #666; font-size: 12px;">📋 ${details.servicesExecuted} serviços executados no período (comprovação)</td>
                </tr>
                ` : ''}
                ` : ''}
                ${details.payModel === 'per_leg' ? `
                <tr>
                    <td>Pernadas completadas</td>
                    <td>${details.legsCompleted || 0}</td>
                    <td>${formatCurrency(details.perLegRate || 0)}</td>
                    <td class="amount">${formatCurrency(statement.baseTotal)}</td>
                </tr>
                ` : ''}
            </tbody>
        </table>
    </div>

    ${(details.adjustments && details.adjustments.length > 0) ? `
    <div class="section">
        <div class="section-title">Ajustes</div>
        <table>
            <thead>
                <tr>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th class="amount">Valor</th>
                </tr>
            </thead>
            <tbody>
                ${details.adjustments.map((adj: any) => `
                <tr>
                    <td><span class="badge badge-${adj.direction}">${adj.type}</span></td>
                    <td>${adj.reason}</td>
                    <td class="amount">${adj.direction === 'add' ? '+' : '-'}${formatCurrency(adj.amount)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="section">
        <table>
            <tbody>
                <tr>
                    <td>Base</td>
                    <td class="amount">${formatCurrency(statement.baseTotal)}</td>
                </tr>
                <tr>
                    <td>Ajustes</td>
                    <td class="amount">${statement.adjustmentsTotal >= 0 ? '+' : ''}${formatCurrency(statement.adjustmentsTotal)}</td>
                </tr>
                <tr class="total-row">
                    <td>TOTAL A PAGAR</td>
                    <td class="amount">${formatCurrency(statement.totalDue)}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Gerado em ${new Date().toLocaleString('pt-BR')} | ID: ${statement.id}</p>
        <p>Este documento não possui valor fiscal</p>
    </div>
</body>
</html>
        `;

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error: any) {
        console.error('Erro ao gerar recibo HTML:', error);
        res.status(500).json({ error: error.message });
    }
}

export default {
    createStaffProfile,
    updateStaffProfile,
    getStaffProfiles,
    getMyStaffProfile,
    checkIn,
    checkOut,
    getAttendanceRecords,
    updateAttendance,
    getTodayAttendance,
    getMyAttendance,
    getServiceExecutions,
    createServiceExecution,
    getTransportLegExecutions,
    createTransportLegExecution,
    createPayPeriod,
    getPayPeriods,
    generatePayStatements,
    closePayPeriod,
    createPayAdjustment,
    getPayAdjustments,
    getPayStatements,
    getPayStatement,
    getMyPayStatements,
    getReceiptHtml
};
