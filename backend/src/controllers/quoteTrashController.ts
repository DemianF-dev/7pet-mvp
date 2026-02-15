import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import * as auditService from '../services/auditService';
import * as quoteService from '../services/quoteService';
import { logError } from '../utils/logger';

export const quoteTrashController = {
    async listTrash(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            if (user.role === 'CLIENTE') return res.status(403).json({ error: 'Acesso negado' });

            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
            const skip = (page - 1) * limit;

            const total = await prisma.quote.count({ where: { NOT: { deletedAt: null } } });

            const quotes = await prisma.quote.findMany({
                where: { NOT: { deletedAt: null } },
                include: {
                    customer: { select: { name: true } },
                    pet: { select: { name: true } },
                    items: true
                },
                orderBy: { deletedAt: 'desc' },
                skip,
                take: limit
            });

            return res.json({
                data: quotes,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            });
        } catch (error: any) {
            logError('Erro ao listar lixeira de orçamentos:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            if (user.role === 'CLIENTE') return res.status(403).json({ error: 'Acesso negado' });

            // 1. Verificar dependências antes de mover para a lixeira
            const deps = await quoteService.checkDependencies(id);

            // Se houver qualquer agendamento ativo ou fatura, bloqueamos a exclusão simples
            const hasActiveAppointments = deps.appointments.spa.length > 0 || deps.appointments.transport.length > 0;
            const hasInvoice = !!deps.invoice;

            if (hasActiveAppointments || hasInvoice) {
                return res.status(409).json({
                    error: 'Exclusão Bloqueada: Este orçamento possui vínculos ativos.',
                    message: 'Existem agendamentos ou faturas vinculadas a este orçamento. Para excluir, utilize a opção de "Exclusão em Cascata" ou remova os vínculos manualmente primeiro.',
                    dependencies: deps
                });
            }

            // 2. Prossigue com soft delete se estiver limpo
            await prisma.quote.update({
                where: { id },
                data: { deletedAt: new Date() }
            });

            await auditService.logEvent((req as any).audit, {
                targetType: 'QUOTE',
                targetId: id,
                action: 'BULK_DELETE',
                summary: `Orçamento OR-${String(deps.quote.seqId).padStart(4, '0')} movido para a lixeira`
            });
            return res.status(204).send();
        } catch (error: any) {
            logError('Erro ao excluir orçamento:', error);
            return res.status(error.status || 500).json({
                error: error.message || 'Internal server error',
                details: error.details
            });
        }
    },

    async restore(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            if (user.role === 'CLIENTE') return res.status(403).json({ error: 'Acesso negado' });

            await prisma.quote.update({
                where: { id },
                data: { deletedAt: null }
            });
            return res.status(200).json({ message: 'Orçamento restaurado' });
        } catch (error: any) {
            logError('Erro ao restaurar orçamento:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async permanentRemove(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            if (user.role === 'CLIENTE') return res.status(403).json({ error: 'Acesso negado' });

            const quote = await prisma.quote.findUnique({ where: { id } });
            if (!quote) {
                return res.status(404).json({ error: 'Orçamento não encontrado' });
            }

            if (!quote.deletedAt) {
                return res.status(400).json({ error: 'Este orçamento não está na lixeira' });
            }

            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            if (quote.deletedAt > ninetyDaysAgo) {
                const daysRemaining = Math.ceil((quote.deletedAt.getTime() - ninetyDaysAgo.getTime()) / (1000 * 60 * 60 * 24));
                return res.status(400).json({
                    error: `Proteção de dados ativa: Este orçamento só poderá ser excluído permanentemente após 90 dias na lixeira. Faltam ${daysRemaining} dias.`,
                    daysRemaining
                });
            }

            await prisma.quoteItem.deleteMany({ where: { quoteId: id } });
            await prisma.statusHistory.deleteMany({ where: { quoteId: id } });
            await prisma.quote.delete({ where: { id } });

            await auditService.logEvent((req as any).audit, {
                targetType: 'QUOTE',
                targetId: id,
                action: 'BULK_DELETE',
                summary: 'Exclusão permanente de orçamento após período de retenção'
            });

            return res.status(204).send();
        } catch (error: any) {
            logError('Erro ao excluir permanentemente:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async bulkDelete(req: Request, res: Response) {
        try {
            const { ids } = req.body;
            const user = (req as any).user;
            if (user.role === 'CLIENTE') return res.status(403).json({ error: 'Acesso negado' });

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ error: 'Nenhum ID fornecido para exclusão.' });
            }

            // Verificar bloqueios em massa
            const quotesWithDeps = await prisma.quote.findMany({
                where: { id: { in: ids } },
                include: {
                    _count: {
                        select: {
                            appointments: { where: { deletedAt: null } }
                        }
                    },
                    invoice: {
                        where: { deletedAt: null }
                    }
                }
            });

            const blockedQuotes = quotesWithDeps.filter(q => q._count.appointments > 0 || q.invoice);

            if (blockedQuotes.length > 0) {
                return res.status(409).json({
                    error: 'Exclusão em massa bloqueada',
                    message: `${blockedQuotes.length} dos orçamentos selecionados possuem agendamentos ou faturas ativas e não podem ser excluídos em lote.`,
                    blockedIds: blockedQuotes.map(q => q.id)
                });
            }

            // Exclusão física (já que é um bulk action de admin tipicamente)
            await prisma.$transaction([
                prisma.quoteItem.deleteMany({ where: { quoteId: { in: ids } } }),
                prisma.statusHistory.deleteMany({ where: { quoteId: { in: ids } } }),
                prisma.quote.deleteMany({ where: { id: { in: ids } } })
            ]);

            await auditService.logEvent((req as any).audit, {
                targetType: 'QUOTE',
                action: 'BULK_DELETE',
                summary: `Exclusão em massa de ${ids.length} orçamentos`,
                meta: { ids }
            });

            return res.status(204).send();
        } catch (error: any) {
            logError('Erro ao excluir em massa:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    /**
     * Verifica dependências de um orçamento (appointments e invoices)
     * GET /quotes/:id/dependencies
     */
    async checkDependencies(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            if (user.role === 'CLIENTE') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const dependencies = await quoteService.checkDependencies(id);

            return res.json(dependencies);
        } catch (error: any) {
            logError('Erro ao verificar dependências:', error);
            return res.status(400).json({ error: error.message || 'Erro ao verificar dependências' });
        }
    },

    /**
     * Delete em cascata com opções selecionáveis
     * POST /quotes/:id/cascade-delete
     */
    async cascadeDelete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            const options = req.body;

            if (user.role === 'CLIENTE') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const result = await quoteService.cascadeDelete(id, options, user.email || user.id);

            return res.status(200).json(result);
        } catch (error: any) {
            logError('Erro ao excluir em cascata:', error);
            return res.status(400).json({ error: error.message || 'Erro ao excluir orçamento' });
        }
    }
};
