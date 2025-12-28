import { Request, Response } from 'express';
import { PrismaClient, QuoteStatus } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const quoteItemSchema = z.object({
    description: z.string().min(1, 'Descrição é obrigatória'),
    quantity: z.number().int().positive().default(1),
    price: z.number().default(0),
    serviceId: z.string().optional()
});

const quoteSchema = z.object({
    petId: z.string().optional(),
    desiredAt: z.string().optional(),
    items: z.array(quoteItemSchema).min(1, 'Pelo menos um item é obrigatório')
});

export const quoteController = {
    async create(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            let customerId = user.customer?.id;

            // If user is not valid customer, check if it's a staff member creating for a customer
            if (!customerId) {
                if (user.role === 'CLIENTE') {
                    return res.status(403).json({ error: 'Usuário não é um cliente cadastrado.' });
                }
                // It is a staff member, look for customerId in body
                customerId = req.body.customerId;
                if (!customerId) {
                    return res.status(400).json({ error: 'ID do cliente é obrigatório para criação por colaboradores.' });
                }
            }

            const data = quoteSchema.parse(req.body);
            console.log(`[DEBUG] Criando orçamento para CustomerID: ${customerId}`, data);

            // Fetch prices for services if not provided (or to ensure they are correct)
            const processedItems = await Promise.all(data.items.map(async (item) => {
                let price = item.price;
                let description = item.description;

                if (item.serviceId) {
                    const service = await prisma.service.findUnique({ where: { id: item.serviceId } });
                    if (service) {
                        price = service.basePrice;
                        description = service.name; // Ensure description matches service name
                    }
                }

                return {
                    description,
                    quantity: item.quantity,
                    price,
                    serviceId: item.serviceId
                };
            }));

            const totalAmount = processedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

            const quote = await prisma.quote.create({
                data: {
                    customerId,
                    petId: data.petId,
                    desiredAt: data.desiredAt ? new Date(data.desiredAt) : null,
                    status: 'SOLICITADO',
                    totalAmount,
                    statusHistory: {
                        create: {
                            oldStatus: 'NONE',
                            newStatus: 'SOLICITADO',
                            changedBy: user.id,
                            reason: user.role === 'CLIENTE' ? 'Solicitação inicial pelo cliente' : `Criado por colaborador ${user.role}`
                        }
                    },
                    items: {
                        create: processedItems
                    }
                },
                include: {
                    items: true,
                    pet: {
                        select: { name: true }
                    },
                    customer: {
                        select: { name: true }
                    }
                }
            });

            return res.status(201).json(quote);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ errors: error.issues });
            }
            console.error('Erro ao criar orçamento:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async list(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            let where: any = { deletedAt: null };

            if (user.role === 'CLIENTE') {
                const clientId = user.customer?.id;

                if (!clientId) {
                    console.error('[DEBUG_LIST] CRITICAL: Client User has NO Customer ID linked!');
                    return res.status(403).json({ error: 'Perfil de cliente não encontrado. Por favor, entre em contato com o suporte.' });
                }

                where.customerId = clientId;
            }

            const quotes = await prisma.quote.findMany({
                where,
                include: {
                    customer: {
                        select: { name: true }
                    },
                    pet: {
                        select: { name: true }
                    },
                    items: true
                },
                orderBy: { createdAt: 'desc' }
            });


            return res.json(quotes);
        } catch (error) {
            console.error('Erro ao listar orçamentos:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async get(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            const quote = await prisma.quote.findUnique({
                where: { id },
                include: {
                    customer: {
                        select: { name: true }
                    },
                    pet: {
                        select: { name: true }
                    },
                    items: true,
                    statusHistory: {
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });

            if (!quote) {
                return res.status(404).json({ error: 'Orçamento não encontrado' });
            }

            if (user.role === 'CLIENTE' && quote.customerId !== user.customer?.id) {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            return res.json(quote);
        } catch (error) {
            console.error('Erro ao buscar orçamento:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status, reason } = req.body;
            const user = (req as any).user;

            const quote = await prisma.quote.findUnique({
                where: { id },
                include: { customer: { include: { user: true } } }
            });
            if (!quote) return res.status(404).json({ error: 'Orçamento não encontrado' });

            const oldStatus = quote.status;

            // Security: Client can only approve/reject if status is ENVIADO
            if (user.role === 'CLIENTE') {
                if (quote.customerId !== user.customer?.id) return res.status(403).json({ error: 'Acesso negado' });
                if (!['APROVADO', 'REJEITADO'].includes(status)) {
                    return res.status(400).json({ error: 'Status inválido para cliente.' });
                }
                if (quote.status !== 'ENVIADO') {
                    return res.status(400).json({ error: 'Este orçamento não pode ser alterado por você no momento.' });
                }
            }

            const updatedQuote = await prisma.quote.update({
                where: { id },
                data: {
                    status,
                    statusHistory: {
                        create: {
                            oldStatus,
                            newStatus: status,
                            changedBy: user.id,
                            reason: reason || (user.role === 'CLIENTE' ? 'Cliente aprovou o orçamento' : `Alterado por ${user.role}`)
                        }
                    }
                },
                include: {
                    items: true,
                    customer: { select: { name: true, user: true } },
                    pet: { select: { name: true } }
                }
            });

            // Auto-generate invoice if Approved
            if (status === 'APROVADO') {
                const existingInvoice = await prisma.invoice.findUnique({ where: { quoteId: id } });
                if (!existingInvoice) {
                    await prisma.invoice.create({
                        data: {
                            customerId: quote.customerId,
                            quoteId: id,
                            amount: quote.totalAmount,
                            status: 'PENDENTE',
                            dueDate: quote.desiredAt || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // Default +5 days (matching validity)
                        }
                    });
                    console.log(`[AUTO] Fatura gerada para orçamento aprovado ${id}`);

                    if (quote.customer.user) {
                        await prisma.notification.create({
                            data: {
                                userId: quote.customer.user.id,
                                title: 'Orçamento Aprovado!',
                                message: `Seu orçamento no valor de R$ ${quote.totalAmount.toFixed(2)} foi aprovado com sucesso. Em breve entraremos em contato para agendamento.`,
                                type: 'INVOICE'
                            }
                        });
                    }
                }
            }

            return res.json(updatedQuote);
        } catch (error) {
            console.error('Erro ao atualizar status do orçamento:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = z.object({
                items: z.array(z.object({
                    id: z.string().optional(),
                    description: z.string(),
                    quantity: z.number(),
                    price: z.number(),
                    serviceId: z.string().optional()
                })).optional(),
                status: z.nativeEnum(QuoteStatus).optional(),
                totalAmount: z.number().optional()
            }).parse(req.body);

            const user = (req as any).user;
            if (user.role === 'CLIENTE') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            // Prepare update data
            const updateData: any = {
                totalAmount: data.totalAmount
            };

            if (data.status) {
                updateData.status = data.status;
                // Add history if status is changing
                const currentQuote = await prisma.quote.findUnique({ where: { id } });
                if (currentQuote && currentQuote.status !== data.status) {
                    updateData.statusHistory = {
                        create: {
                            oldStatus: currentQuote.status,
                            newStatus: data.status,
                            changedBy: user.id,
                            reason: 'Atualização completa pelo colaborador'
                        }
                    };
                }
            }

            if (data.items) {
                // Determine status logic: if items are priced > 0 and status is SOLICITADO, maybe move to CALCULADO?
                // For now, let's just stick to explicit status changes from frontend.

                // Recalculate total if needed
                const itemsTotal = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                updateData.totalAmount = data.totalAmount ?? itemsTotal;

                updateData.items = {
                    deleteMany: {},
                    create: data.items.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        price: item.price,
                        serviceId: item.serviceId || null
                    }))
                };
            }

            await prisma.quote.update({
                where: { id },
                data: updateData
            });

            // Sync with Invoice if exists
            if (updateData.totalAmount !== undefined) {
                const linkedInvoice = await prisma.invoice.findUnique({ where: { quoteId: id } });
                if (linkedInvoice && linkedInvoice.status !== 'PAGO' && linkedInvoice.status !== 'ENCERRADO') {
                    await prisma.invoice.update({
                        where: { id: linkedInvoice.id },
                        data: { amount: updateData.totalAmount }
                    });
                    console.log(`[SYNC] Fatura atualizada para acompanhar orçamento ${id}: ${updateData.totalAmount}`);
                }
            }

            const updated = await prisma.quote.findUnique({
                where: { id },
                include: { items: true }
            });

            return res.json(updated);
        } catch (error) {
            console.error('Erro ao atualizar orçamento:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async listTrash(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            if (user.role === 'CLIENTE') return res.status(403).json({ error: 'Acesso negado' });

            const quotes = await prisma.quote.findMany({
                where: { NOT: { deletedAt: null } },
                include: {
                    customer: { select: { name: true } },
                    items: true
                },
                orderBy: { deletedAt: 'desc' }
            });

            return res.json(quotes);
        } catch (error) {
            console.error('Erro ao listar lixeira de orçamentos:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async duplicate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            const original = await prisma.quote.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!original) return res.status(404).json({ error: 'Orçamento não encontrado' });

            const duplicate = await prisma.quote.create({
                data: {
                    customerId: original.customerId,
                    petId: original.petId,
                    status: 'SOLICITADO',
                    totalAmount: original.totalAmount,
                    items: {
                        create: original.items.map(item => ({
                            description: item.description + ' (Cópia)',
                            quantity: item.quantity,
                            price: item.price
                        }))
                    },
                    statusHistory: {
                        create: {
                            oldStatus: 'NONE',
                            newStatus: 'SOLICITADO',
                            changedBy: user.id,
                            reason: `Duplicado a partir de ${original.id}`
                        }
                    }
                },
                include: { items: true }
            });

            return res.status(201).json(duplicate);
        } catch (error) {
            console.error('Erro ao duplicar orçamento:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            if (user.role === 'CLIENTE') return res.status(403).json({ error: 'Acesso negado' });

            await prisma.quote.update({
                where: { id },
                data: { deletedAt: new Date() }
            });
            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir orçamento:', error);
            return res.status(500).json({ error: 'Internal server error' });
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
        } catch (error) {
            console.error('Erro ao restaurar orçamento:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async permanentRemove(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            if (user.role === 'CLIENTE') return res.status(403).json({ error: 'Acesso negado' });

            // Delete items first due to FK
            await prisma.quoteItem.deleteMany({ where: { quoteId: id } });
            await prisma.statusHistory.deleteMany({ where: { quoteId: id } });
            await prisma.quote.delete({ where: { id } });
            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir permanentemente:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
};
