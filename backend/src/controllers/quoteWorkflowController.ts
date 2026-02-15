import { Request, Response } from 'express';
import * as quoteService from '../services/quoteService';
import { logError } from '../utils/logger';
import { isHttpError, HttpError } from '../utils/httpError';

export const quoteWorkflowController = {
    /**
     * Schedule appointments from quote (Wizard Endpoint)
     */
    async schedule(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { occurrences } = req.body;
            const user = (req as any).user;
            const idempotencyKey = req.header('Idempotency-Key') || undefined;

            if (user.role === 'CLIENTE') {
                return res.status(403).json({ error: 'Apenas colaboradores podem realizar o agendamento.' });
            }

            if (!occurrences || !Array.isArray(occurrences)) {
                return res.status(400).json({ error: 'Payload inválido. "occurrences" deve ser um array.' });
            }

            const result = await quoteService.scheduleQuote(id, { occurrences, idempotencyKey }, user);

            return res.status(200).json({
                message: 'Agendamentos realizados com sucesso',
                count: result.length,
                appointments: result
            });

        } catch (error: any) {
            logError('[QuoteWorkflow] Error scheduling quote:', error);
            if (isHttpError(error)) {
                return res.status(error.status).json({
                    error: error.message,
                    code: error.code,
                    details: error.details || null
                });
            }
            return res.status(500).json({
                error: error?.message || 'Erro ao agendar orçamento.'
            });
        }
    },

    /**
     * One-Click Scheduling: Approve quote and create appointment in one action
     * Supports both single and recurring appointments
     */
    async approveAndSchedule(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { performerId, occurrences } = req.body;
            const user = (req as any).user;
            const idempotencyKey = req.header('Idempotency-Key') || undefined;

            const result = await quoteService.approveAndSchedule(id, performerId, user, occurrences, idempotencyKey);

            return res.status(200).json(result);
        } catch (error: any) {
            logError('Erro no One-Click Scheduling:', error);
            if (isHttpError(error)) {
                return res.status(error.status).json({
                    error: error.message,
                    code: error.code,
                    details: error.details || null
                });
            }
            return res.status(500).json({ error: error.message || 'Erro ao processar agendamento automático' });
        }
    },

    /**
     * Undo Scheduling
     */
    async undoSchedule(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const user = (req as any).user;

            if (!reason) throw new HttpError(400, 'Justificativa e obrigatoria para desfazer o agendamento.', 'MISSING_REASON');

            const result = await quoteService.undoSchedule(id, reason, user);

            return res.status(200).json(result);
        } catch (error: any) {
            logError('Erro ao desfazer agendamento:', error);
            if (isHttpError(error)) {
                return res.status(error.status).json({
                    error: error.message,
                    code: error.code,
                    details: error.details || null
                });
            }
            return res.status(500).json({ error: error.message || 'Erro ao desfazer agendamento' });
        }
    }
};
