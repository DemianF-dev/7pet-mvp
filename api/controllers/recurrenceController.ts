import { Request, Response } from 'express';
import contractService from '../services/recurrenceContractService';
import invoiceService from '../services/packageInvoiceService';
import logger from '../utils/logger';
import { RecurrenceType, ContractStatus } from '../generated';

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
}

export default new RecurrenceController();
