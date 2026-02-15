import { Request, Response } from 'express';
import contractService from '../services/recurrenceContractService';
import invoiceService from '../services/packageInvoiceService';
import periodClosingService from '../services/periodClosingService';
import logger from '../utils/logger';
import { RecurrenceType, ContractStatus } from '@prisma/client';

/**
 * Controller for RECORRENTES (Recurring) Module
 */
class RecurrenceController {
    // ================================
    // CONTRACTS
    // ================================

    async listContracts(req: Request, res: Response) {
        try {
            const { type, status, customerId } = req.query;
            const filters: any = {};
            if (type) filters.type = type as RecurrenceType;
            if (status) filters.status = status as ContractStatus;
            if (customerId) filters.customerId = customerId as string;

            const contracts = await contractService.listContracts(filters);
            res.json(contracts);
        } catch (error: any) {
            logger.error({ error: error.message }, '[RecurrenceController] Error listing contracts');
            res.status(500).json({ error: 'Erro ao listar contratos.' });
        }
    }

    async createContract(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || 'system';
            const contract = await contractService.createContract({
                ...req.body,
                createdBy: userId
            });
            res.status(201).json(contract);
        } catch (error: any) {
            logger.error({ error: error.message }, '[RecurrenceController] Error creating contract');
            res.status(400).json({ error: error.message });
        }
    }

    async getContract(req: Request, res: Response) {
        try {
            const contract = await contractService.getContractById(req.params.id);
            if (!contract) return res.status(404).json({ error: 'Contrato não encontrado.' });
            res.json(contract);
        } catch (error: any) {
            res.status(500).json({ error: 'Erro ao buscar contrato.' });
        }
    }

    async getContractDetails(req: Request, res: Response) {
        try {
            const contract = await contractService.getContractDetails(req.params.id);
            if (!contract) return res.status(404).json({ error: 'Contrato não encontrado.' });
            res.json(contract);
        } catch (error: any) {
            logger.error({ error: error.message }, '[RecurrenceController] Error getting contract details');
            res.status(500).json({ error: 'Erro ao buscar detalhes do contrato.' });
        }
    }

    // ================================
    // INVOICES
    // ================================

    async listEligibleAppointments(req: Request, res: Response) {
        try {
            const { customerId, type, periodYear, periodMonth } = req.query;

            if (!customerId || !type || !periodYear || !periodMonth) {
                return res.status(400).json({ error: 'Parâmetros insuficientes (customerId, type, periodYear, periodMonth).' });
            }

            const appointments = await invoiceService.listEligibleAppointments({
                customerId: customerId as string,
                type: type as RecurrenceType,
                periodYear: parseInt(periodYear as string),
                periodMonth: parseInt(periodMonth as string)
            });

            res.json(appointments);
        } catch (error: any) {
            logger.error({ error: error.message }, '[RecurrenceController] Error listing eligible appointments');
            res.status(500).json({ error: 'Erro ao buscar agendamentos elegíveis.' });
        }
    }

    async createInvoice(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || 'system';
            const invoice = await invoiceService.createPackageInvoice({
                ...req.body,
                createdBy: userId
            });
            res.status(201).json(invoice);
        } catch (error: any) {
            logger.error({ error: error.message, body: req.body }, '[RecurrenceController] Error creating invoice');
            res.status(400).json({ error: error.message });
        }
    }

    async copyInvoice(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || 'system';
            const newInvoice = await invoiceService.copyInvoiceToNextMonth(req.params.id, userId);
            res.status(201).json(newInvoice);
        } catch (error: any) {
            logger.error({ error: error.message }, '[RecurrenceController] Error copying invoice');
            res.status(400).json({ error: error.message });
        }
    }

    async emitInvoice(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || 'system';
            const invoice = await invoiceService.emitInvoice(req.params.id, userId);
            res.json(invoice);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getInvoice(req: Request, res: Response) {
        try {
            const invoice = await invoiceService.getInvoiceById(req.params.id);
            if (!invoice) return res.status(404).json({ error: 'Fatura não encontrada.' });
            res.json(invoice);
        } catch (error: any) {
            res.status(500).json({ error: 'Erro ao buscar dados da fatura.' });
        }
    }

    async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status, reason } = req.body;
            const userId = (req as any).user?.id || 'system';

            if (!status || !reason) {
                return res.status(400).json({ error: 'Status e motivo são obrigatórios.' });
            }

            const contract = await contractService.updateContractStatus(id, status, reason, userId);
            res.json(contract);
        } catch (error: any) {
            logger.error({ error: error.message }, '[RecurrenceController] Error updating contract status');
            res.status(500).json({ error: 'Erro ao atualizar status do contrato.' });
        }
    }

    // ================================
    // PERIOD CLOSING (NEW)
    // ================================

    async getPeriodSummary(req: Request, res: Response) {
        try {
            const { year, month } = req.query;
            if (!year || !month) return res.status(400).json({ error: 'Ano e Mês são obrigatórios.' });

            const summary = await periodClosingService.listPeriodSummary({
                periodYear: parseInt(year as string),
                periodMonth: parseInt(month as string)
            });
            res.json(summary);
        } catch (error: any) {
            logger.error({ error: error.message }, '[RecurrenceController] Error getting period summary');
            res.status(500).json({ error: 'Erro ao buscar resumo do período.' });
        }
    }

    async getStatement(req: Request, res: Response) {
        try {
            const { customerId } = req.params;
            const { year, month } = req.query;
            if (!year || !month) return res.status(400).json({ error: 'Ano e Mês são obrigatórios.' });

            const statement = await periodClosingService.getStatement(customerId, {
                periodYear: parseInt(year as string),
                periodMonth: parseInt(month as string)
            });
            res.json(statement);
        } catch (error: any) {
            logger.error({ error: error.message }, '[RecurrenceController] Error getting statement');
            res.status(500).json({ error: 'Erro ao buscar extrato do período.' });
        }
    }

    async updateStatement(req: Request, res: Response) {
        try {
            const { customerId } = req.params;
            const { year, month, action } = req.body;
            const userId = (req as any).user?.id || 'system';

            const updated = await periodClosingService.updateStatement(customerId, {
                periodYear: year,
                periodMonth: month
            }, action, userId);

            res.json(updated);
        } catch (error: any) {
            logger.error({ error: error.message }, '[RecurrenceController] Error updating statement');
            res.status(500).json({ error: 'Erro ao atualizar extrato.' });
        }
    }

    async closePeriod(req: Request, res: Response) {
        try {
            const { customerId } = req.params;
            const { year, month } = req.body;
            const userId = (req as any).user?.id || 'system';

            const closed = await periodClosingService.closePeriod(customerId, {
                periodYear: year,
                periodMonth: month
            }, userId);

            res.json(closed);
        } catch (error: any) {
            logger.error({ error: error.message }, '[RecurrenceController] Error closing period');
            res.status(500).json({ error: 'Erro ao fechar período.' });
        }
    }
}

export default new RecurrenceController();

