import { Request, Response } from 'express';
import { PrismaClient, QuoteStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { auditService } from '../services/auditService';
import { notificationService } from '../services/notificationService';
import { createAuditLog, detectChanges } from '../utils/auditLogger';
import { messagingService } from '../services/messagingService';
import * as quoteService from '../services/quoteService';
import { mapsService } from '../services/mapsService';
import * as authService from '../services/authService';
import { z } from 'zod';

// const prisma = new PrismaClient(); // Removed in favor of imported instance

const quoteItemSchema = z.object({
    description: z.string().min(1, 'Descrição é obrigatória'),
    quantity: z.number().int().positive().default(1),
    price: z.number().default(0),
    serviceId: z.string().optional()
});

const quoteSchema = z.object({
    type: z.enum(['SPA', 'TRANSPORTE', 'SPA_TRANSPORTE']).default('SPA'),
    petId: z.string().optional(),
    desiredAt: z.string().optional(),
    items: z.array(quoteItemSchema).optional(),
    transportOrigin: z.string().optional(),
    transportDestination: z.string().optional(),
    transportReturnAddress: z.string().optional(),
    transportPeriod: z.enum(['MANHA', 'TARDE', 'NOITE']).optional(),
    hasKnots: z.boolean().optional(),
    knotRegions: z.string().optional(),
    hairLength: z.string().optional(),
    hasParasites: z.boolean().optional(),
    parasiteTypes: z.string().optional(), // 'PULGA', 'CARRAPATO', ou 'AMBOS'
    parasiteComments: z.string().optional(),
    petQuantity: z.number().int().optional(),
    transportLevaAt: z.string().optional(),
    transportTrazAt: z.string().optional()
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

            // Check if client can request quotes (only for CLIENTE role self-service)
            if (user.role === 'CLIENTE' && user.customer) {
                if (user.customer.canRequestQuotes === false) {
                    return res.status(403).json({ error: 'Sua conta está com restrição para solicitar novos orçamentos. Entre em contato com a 7Pet.' });
                }
            }

            const data = quoteSchema.parse(req.body);
            console.log(`[DEBUG] Criando orçamento para CustomerID: ${customerId}`, data);

            // Fetch prices for services if not provided (or to ensure they are correct)
            const processedItems = data.items ? await Promise.all(data.items.map(async (item) => {
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
            })) : [];

            // Adicionar automaticamente itens de desembolo se houver nós
            if (data.hasKnots && data.knotRegions) {
                const knotRegions = data.knotRegions.toLowerCase().split(',').map(r => r.trim()).filter(r => r);

                const KNOT_PRICES: Record<string, number> = {
                    'orelhas': 7.50,
                    'rostinho': 15.00,
                    'pescoço': 15.00,
                    'barriga': 12.50,
                    'pata frontal esquerda': 7.50,
                    'pata frontal direita': 7.50,
                    'pata traseira esquerda': 7.50,
                    'pata traseira direita': 7.50,
                    'bumbum': 12.50,
                    'rabo': 10.00
                };

                // Agrupa patas
                const patas = knotRegions.filter(r => r.includes('pata'));
                const outrasRegioes = knotRegions.filter(r => !r.includes('pata'));

                if (patas.length > 0) {
                    processedItems.push({
                        description: `Desembolo - Patas(${patas.length}x)`,
                        quantity: patas.length,
                        price: 7.50,
                        serviceId: undefined
                    });
                }

                outrasRegioes.forEach(region => {
                    const price = KNOT_PRICES[region];
                    if (price) {
                        processedItems.push({
                            description: `Desembolo - ${region.charAt(0).toUpperCase() + region.slice(1)} `,
                            quantity: 1,
                            price,
                            serviceId: undefined
                        });
                    }
                });
            }

            // Adicionar banho medicamentoso antipulgas se solicitado
            if (data.wantsMedicatedBath) {
                processedItems.push({
                    description: '💊 Banho Medicamentoso Antipulgas',
                    quantity: 1,
                    price: 45.00,
                    serviceId: undefined
                });
            }

            const totalAmount = processedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

            const quote = await prisma.quote.create({
                data: {
                    customerId,
                    petId: data.petId,
                    type: data.type,
                    desiredAt: data.desiredAt ? new Date(data.desiredAt) : null,
                    transportOrigin: data.transportOrigin,
                    transportDestination: data.transportDestination,
                    transportReturnAddress: data.transportReturnAddress,
                    transportPeriod: data.transportPeriod,
                    hasKnots: data.hasKnots,
                    knotRegions: data.knotRegions,
                    hairLength: data.hairLength,
                    hasParasites: data.hasParasites,
                    parasiteTypes: data.parasiteTypes,
                    parasiteComments: data.parasiteComments,
                    wantsMedicatedBath: data.wantsMedicatedBath,
                    petQuantity: data.petQuantity || 1,
                    transportLevaAt: data.transportLevaAt ? new Date(data.transportLevaAt) : null,
                    transportTrazAt: data.transportTrazAt ? new Date(data.transportTrazAt) : null,
                    status: 'SOLICITADO',
                    totalAmount,
                    statusHistory: {
                        create: {
                            oldStatus: 'NONE',
                            newStatus: 'SOLICITADO',
                            changedBy: user.id,
                            reason: user.role === 'CLIENTE' ? 'Solicitação inicial pelo cliente' : `Criado por colaborador ${user.role} `
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

            // Create audit log
            await createAuditLog({
                entityType: 'QUOTE',
                entityId: quote.id,
                action: 'CREATE',
                performedBy: user.id,
                reason: `Orçamento criado ${user.role === 'CLIENTE' ? 'pelo cliente' : 'pela equipe'} `
            });

            // Notify customer about successful solicitation
            // Load customer user ID
            const customerData = await prisma.customer.findUnique({
                where: { id: customerId },
                select: { userId: true, name: true }
            });

            if (customerData && customerData.userId) {
                // Import dynamically
                const { createNotification } = require('./notificationController');

                await createNotification(customerData.userId, {
                    title: 'Solicitação de Orçamento Recebida',
                    body: `Olá ${customerData.name}! Recebemos seu pedido para ${data.petId ? 'o pet' : 'seu pet'}. Fique atento às notificações!`,
                    type: 'quote',
                    referenceId: quote.id,
                    data: { quoteId: quote.id }
                });
            }

            // Notify staff members (Admins and Finance)
            // Ideally we should find who has role ADMIN or division FINANCEIRO
            const staffToNotify = await prisma.user.findMany({
                where: {
                    OR: [
                        { role: 'ADMIN' },
                        { division: 'FINANCEIRO' },
                        { division: 'ATENDIMENTO' }
                    ],
                    active: true
                },
                select: { id: true }
            });

            if (staffToNotify.length > 0) {
                const { createNotification } = require('./notificationController');
                for (const staff of staffToNotify) {
                    await createNotification(staff.id, {
                        title: 'Novo Orçamento Solicitado',
                        body: `Cliente ${customerData?.name || 'Desconhecido'} solicitou um orçamento.`,
                        type: 'quote',
                        referenceId: quote.id,
                        data: { quoteId: quote.id, url: '/staff/quotes' }
                    });
                }
            }

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

            // Pagination parameters
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
            const skip = (page - 1) * limit;

            // Get total count for pagination metadata
            const total = await prisma.quote.count({ where });

            const quotes = await prisma.quote.findMany({
                where,
                include: {
                    customer: {
                        select: { name: true }
                    },
                    pet: {
                        select: { name: true }
                    },
                    items: true,
                    appointments: {
                        select: { id: true, category: true, status: true, startAt: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
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
                        select: {
                            id: true,
                            name: true,
                            species: true,
                            breed: true,
                            weight: true,
                            coatType: true,
                            temperament: true,
                            age: true,
                            observations: true,
                            healthIssues: true,
                            allergies: true,
                            hasKnots: true,
                            hasMattedFur: true
                        }
                    },
                    items: true,
                    appointments: {
                        select: {
                            id: true,
                            startAt: true,
                            status: true,
                            category: true
                        }
                    },
                    statusHistory: {
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });

            if (!quote) {
                return res.status(404).json({ error: 'Orçamento não encontrado' });
            }

            // Auto-update status if appointment exists and quote is not already AGENDADO or ENCERRADO
            if (quote.appointments?.length > 0 && quote.status !== 'AGENDADO' && quote.status !== 'ENCERRADO') {
                const updated = await prisma.quote.update({
                    where: { id },
                    data: { status: 'AGENDADO' }
                });
                quote.status = updated.status; // Update the in-memory quote object
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

            // Fetch current state for audit log
            const previousData = await prisma.quote.findUnique({
                where: { id },
                include: { items: true, pet: true, customer: true }
            });

            const updatedQuote = await prisma.quote.update({
                where: { id },
                data: {
                    status,
                    statusHistory: {
                        create: {
                            oldStatus,
                            newStatus: status,
                            changedBy: user.id,
                            reason: reason || (user.role === 'CLIENTE' ? 'Cliente aprovou o orçamento' : `Alterado por ${user.role} `)
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
                const existingInvoice = await prisma.invoice.findFirst({ where: { quotes: { some: { id } } } });
                if (!existingInvoice) {
                    await prisma.invoice.create({
                        data: {
                            customerId: quote.customerId,
                            quotes: {
                                connect: [{ id }]
                            },
                            amount: quote.totalAmount,
                            status: 'PENDENTE',
                            dueDate: quote.desiredAt || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // Default +5 days (matching validity)
                        }
                    });
                    console.log(`[AUTO] Fatura gerada para orçamento aprovado ${id} `);


                    if (quote.customer.user) {
                        const { createNotification } = require('./notificationController');
                        await createNotification(
                            quote.customer.user.id,
                            {
                                title: 'Orçamento Aprovado! 🎉',
                                body: `Orçamento #${quote.seqId} aprovado com sucesso! Valor: R$ ${quote.totalAmount.toFixed(2)}. Prepare seu pet!`,
                                type: 'quote',
                                referenceId: quote.id,
                                data: { quoteId: quote.id }
                            }
                        );
                    }
                }
            } else if (status === 'ENVIADO' && oldStatus !== 'ENVIADO' && quote.customer.user) {
                // Notificar quando staff envia o orçamento respondido (preço calculado)
                const { createNotification } = require('./notificationController');
                await createNotification(
                    quote.customer.user.id,
                    {
                        title: 'Orçamento Respondido 💰',
                        body: `Seu orçamento #${quote.seqId} já tem valores disponíveis! Toque para conferir e aprovar.`,
                        type: 'quote',
                        referenceId: quote.id,
                        data: { quoteId: quote.id }
                    }
                );
            }

            // Create audit log
            await createAuditLog({
                entityType: 'QUOTE',
                entityId: id,
                action: 'STATUS_CHANGE',
                performedBy: user.id,
                changes: [{ field: 'status', oldValue: oldStatus, newValue: status }],
                reason: reason || `${user.role === 'CLIENTE' ? 'Cliente' : 'Equipe'} alterou status para ${status} `
            });

            return res.json(updatedQuote);
        } catch (error) {
            console.error('Erro ao atualizar status do orçamento:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async update(req: Request, res: Response) {
        try {
            console.log(`[QUOTE_UPDATE] ID: ${req.params.id}, Body: `, JSON.stringify(req.body, null, 2));
            const { id } = req.params;
            const data = z.object({
                items: z.array(z.object({
                    id: z.string().optional(),
                    description: z.string().min(1),
                    quantity: z.number().default(1),
                    price: z.number().default(0),
                    serviceId: z.string().optional().nullable(),
                    performerId: z.string().optional().nullable()
                })).optional(),
                status: z.nativeEnum(QuoteStatus).optional(),
                totalAmount: z.number().optional(),
                transportOrigin: z.string().optional(),
                transportDestination: z.string().optional(),
                transportReturnAddress: z.string().optional(),
                transportPeriod: z.enum(['MANHA', 'TARDE', 'NOITE']).optional(),
                hasKnots: z.boolean().optional(),
                knotRegions: z.string().optional(),
                hairLength: z.string().optional(),
                hasParasites: z.boolean().optional(),
                petQuantity: z.number().int().optional(),
                desiredAt: z.string().optional(),
                scheduledAt: z.string().optional(),
                transportAt: z.string().optional(),
                transportLevaAt: z.string().optional(),
                transportTrazAt: z.string().optional(),
                petId: z.string().optional()
            }).parse(req.body);

            const user = (req as any).user;
            if (user.role === 'CLIENTE') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            // Prepare update data
            const updateData: any = {
                totalAmount: data.totalAmount
            };

            if (data.desiredAt) {
                updateData.desiredAt = new Date(data.desiredAt);
            }

            if (data.scheduledAt) {
                updateData.scheduledAt = new Date(data.scheduledAt);
            }

            if (data.transportAt) {
                updateData.transportAt = new Date(data.transportAt);
            }
            if (data.transportLevaAt) {
                updateData.transportLevaAt = new Date(data.transportLevaAt);
            }
            if (data.transportTrazAt) {
                updateData.transportTrazAt = new Date(data.transportTrazAt);
            }

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

                    // NOTIFICATION: If status becomes ENVIADO, notify the customer
                    if (data.status === 'ENVIADO' && currentQuote.customerId) {
                        // We need the customer's User ID to send a notification
                        const customerData = await prisma.customer.findUnique({
                            where: { id: currentQuote.customerId },
                            select: { userId: true, name: true }
                        });

                        if (customerData && customerData.userId) {
                            await messagingService.notifyUser(
                                customerData.userId,
                                'Orçamento Disponível para Aprovação',
                                `Olá ${customerData.name} !Seu orçamento(OR - ${String(currentQuote.seqId).padStart(4, '0')}) foi atualizado e está aguardando sua aprovação.`,
                                'QUOTE_SENT'
                            );
                            console.log(`[QuoteUpdate] Notification sent to customer ${customerData.userId} `);
                        }
                    }
                }
            }

            // Map all new fields
            if (data.transportOrigin !== undefined) updateData.transportOrigin = data.transportOrigin;
            if (data.transportDestination !== undefined) updateData.transportDestination = data.transportDestination;
            if (data.transportReturnAddress !== undefined) updateData.transportReturnAddress = data.transportReturnAddress;
            if (data.transportPeriod !== undefined) updateData.transportPeriod = data.transportPeriod;
            if (data.hasKnots !== undefined) updateData.hasKnots = data.hasKnots;
            if (data.knotRegions !== undefined) updateData.knotRegions = data.knotRegions;
            if (data.hairLength !== undefined) updateData.hairLength = data.hairLength;
            if (data.hasParasites !== undefined) updateData.hasParasites = data.hasParasites;
            if (data.petQuantity !== undefined) updateData.petQuantity = data.petQuantity;
            if (data.petId !== undefined) updateData.petId = data.petId;

            if (data.items) {
                // Determine status logic: if items are priced > 0 and status is SOLICITADO, maybe move to CALCULADO?
                // For now, let's just stick to explicit status changes from frontend.

                // Recalculate total if needed
                const itemsTotal = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                updateData.totalAmount = data.totalAmount ?? itemsTotal;

                // VALIDATION: Ensure all serviceIds and performerIds actually exist to prevent FK errors
                const serviceIds = data.items
                    .map(i => i.serviceId)
                    .filter((id): id is string => !!id);

                const validServices = serviceIds.length > 0
                    ? await prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true } })
                    : [];
                const validServiceIds = new Set(validServices.map(s => s.id));

                updateData.items = {
                    deleteMany: {},
                    create: data.items.map(item => {
                        // Fallback to null if service ID is invalid/not found
                        let validServiceId = item.serviceId;
                        if (validServiceId && !validServiceIds.has(validServiceId)) {
                            console.warn(`[QuoteUpdate] Warning: Service ID ${validServiceId} not found.Setting to null.`);
                            validServiceId = null;
                        }

                        return {
                            description: item.description,
                            quantity: item.quantity,
                            price: item.price,
                            serviceId: validServiceId || null,
                            performerId: item.performerId || null
                        };
                    })
                };
            }

            await prisma.quote.update({
                where: { id },
                data: updateData
            });

            // Sync with Invoice if exists
            if (updateData.totalAmount !== undefined) {
                const linkedInvoice = await prisma.invoice.findFirst({ where: { quotes: { some: { id } } } });
                if (linkedInvoice && linkedInvoice.status !== 'PAGO' && linkedInvoice.status !== 'ENCERRADO') {
                    await prisma.invoice.update({
                        where: { id: linkedInvoice.id },
                        data: { amount: updateData.totalAmount }
                    });
                    console.log(`[SYNC] Fatura atualizada para acompanhar orçamento ${id}: ${updateData.totalAmount} `);
                }
            }

            const updated = await prisma.quote.findUnique({
                where: { id },
                include: { items: true }
            });

            return res.json(updated);
        } catch (error) {
            console.error('Erro ao atualizar orçamento:', error);
            if (error instanceof z.ZodError) {
                console.error('Zod Validation Errors:', JSON.stringify(error.issues, null, 2));
                return res.status(400).json({ error: 'Erro de validação', details: error.issues });
            }
            return res.status(500).json({ error: 'Internal server error', message: error instanceof Error ? error.message : String(error) });
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
                            reason: `Duplicado a partir de ${original.id} `
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

            // Check if quote exists and has been deleted
            const quote = await prisma.quote.findUnique({ where: { id } });
            if (!quote) {
                return res.status(404).json({ error: 'Orçamento não encontrado' });
            }

            if (!quote.deletedAt) {
                return res.status(400).json({ error: 'Este orçamento não está na lixeira' });
            }

            // Protection: Only allow permanent deletion after 90 days in trash
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            if (quote.deletedAt > ninetyDaysAgo) {
                const daysRemaining = Math.ceil((quote.deletedAt.getTime() - ninetyDaysAgo.getTime()) / (1000 * 60 * 60 * 24));
                return res.status(400).json({
                    error: `Proteção de dados ativa: Este orçamento só poderá ser excluído permanentemente após 90 dias na lixeira.Faltam ${daysRemaining} dias.`,
                    daysRemaining
                });
            }

            // Delete items first due to FK
            await prisma.quoteItem.deleteMany({ where: { quoteId: id } });
            await prisma.statusHistory.deleteMany({ where: { quoteId: id } });
            await prisma.quote.delete({ where: { id } });

            // Log the permanent deletion
            await auditService.log({
                performedBy: user.id,
                action: 'DELETE_PERMANENT',
                entityType: 'QUOTE',
                entityId: id,
                reason: 'Exclusão permanente após período de retenção'
            });

            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir permanentemente:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async bulkDelete(req: Request, res: Response) {
        try {
            const { ids } = req.body;
            const user = (req as any).user;
            if (user.role === 'CLIENTE') return res.status(403).json({ error: 'Acesso negado' });

            // Use transaction to ensure items are deleted too if needed, or just let cascade handle if configured
            // Since manual delete of items was used in permanentRemove, let's do it here too just in case
            await prisma.$transaction([
                prisma.quoteItem.deleteMany({ where: { quoteId: { in: ids } } }),
                prisma.statusHistory.deleteMany({ where: { quoteId: { in: ids } } }),
                prisma.quote.deleteMany({ where: { id: { in: ids } } })
            ]);

            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir em massa:', error);
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
            console.error('Erro ao verificar dependências:', error);
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
            const options = req.body; // { deleteSpaAppointments, deleteTransportAppointments, deleteInvoice }

            if (user.role === 'CLIENTE') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const result = await quoteService.cascadeDelete(id, options, user.email || user.id);

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Erro ao excluir em cascata:', error);
            return res.status(400).json({ error: error.message || 'Erro ao excluir orçamento' });
        }
    },

    /**
     * One-Click Approval & Scheduling
     */

    /**
     * Calculate detailed transport costs for a quote
     */
    async calculateTransport(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { address, destinationAddress, type } = req.body;

            if (!address) {
                return res.status(400).json({ error: 'Endereço de origem é obrigatório' });
            }

            // Verify quote exists
            const quote = await prisma.quote.findUnique({
                where: { id }
            });

            if (!quote) {
                return res.status(404).json({ error: 'Orçamento não encontrado' });
            }

            console.log(`[Quote] Calculating transport for Quote ID: ${id} `);
            console.log(`[Quote] Payload: `, { address, destinationAddress, type });
            console.log(`[Quote] User Role: `, (req as any).user?.role);

            // Calculate transport using Google Maps + settings

            // Validate type if provided
            const validTypes = ['ROUND_TRIP', 'PICK_UP', 'DROP_OFF'];
            const transportType = (type && validTypes.includes(type)) ? type : 'ROUND_TRIP';

            console.log(`[Quote] Calling mapsService with type: ${transportType} `);

            const result = await mapsService.calculateTransportDetailed(address, destinationAddress, transportType as any);
            console.log(`[Quote] Calculation result: `, result);

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('[Quote] Error calculating transport:', error);

            // Check if it's an Axios error from Google Maps
            if (error.response) {
                console.error('[Quote] Upstream (Google) Error Status:', error.response.status);
                console.error('[Quote] Upstream (Google) Error Data:', error.response.data);

                if (error.response.status === 403 || error.response.status === 401) {
                    return res.status(500).json({
                        error: 'Erro de configuração da API de Mapas (Chave inválida ou Billing não ativado)',
                        details: error.message
                    });
                }
            }

            return res.status(500).json({
                error: 'Erro ao calcular transporte',
                details: error.message
            });
        }
    },

    /**
     * One-Click Scheduling: Approve quote and create appointment in one action
     */
    async approveAndSchedule(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { performerId } = req.body;
            const user = (req as any).user;

            const result = await quoteService.approveAndSchedule(id, performerId, user);

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Erro no One-Click Scheduling:', error);
            return res.status(400).json({ error: error.message || 'Erro ao processar agendamento automático' });
        }
    },

    /**
     * Criação de orçamento manual com cadastro simultâneo de cliente e pet
     */
    async createManual(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            if (user.role === 'CLIENTE') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const { customer, pet, quote: quoteData } = req.body;

            // Basic validation
            if (!customer || !customer.email || !customer.name) {
                return res.status(400).json({ error: 'Dados do cliente (nome e email) são obrigatórios.' });
            }

            const result = await prisma.$transaction(async (tx) => {
                // 1. Register/Get Customer and Pet
                const { customer: dbCustomer, pet: dbPet } = await authService.registerManual(tx as any, { customer, pet });

                // 2. Process Items (fetch prices)
                const processedItems = quoteData.items ? await Promise.all(quoteData.items.map(async (item: any) => {
                    let price = item.price || 0;
                    let description = item.description;

                    if (item.serviceId) {
                        const service = await tx.service.findUnique({ where: { id: item.serviceId } });
                        if (service) {
                            price = price || service.basePrice;
                            description = service.name;
                        }
                    }

                    return {
                        description,
                        quantity: item.quantity || 1,
                        price,
                        serviceId: item.serviceId
                    };
                })) : [];

                // Lógica de adição automática de itens (Knots/Nós e Banho Medicamentoso)
                if (quoteData.hasKnots && quoteData.knotRegions) {
                    const knotRegions = quoteData.knotRegions.toLowerCase().split(',').map((r: string) => r.trim()).filter((r: string) => r);

                    const KNOT_PRICES: Record<string, number> = {
                        'orelhas': 7.50,
                        'rostinho': 15.00,
                        'pescoço': 15.00,
                        'barriga': 12.50,
                        'pata frontal esquerda': 7.50,
                        'pata frontal direita': 7.50,
                        'pata traseira esquerda': 7.50,
                        'pata traseira direita': 7.50,
                        'bumbum': 12.50,
                        'rabo': 10.00
                    };

                    const patas = knotRegions.filter(r => r.includes('pata'));
                    const outrasRegioes = knotRegions.filter(r => !r.includes('pata'));

                    if (patas.length > 0) {
                        processedItems.push({
                            description: `Desembolo - Patas (${patas.length}x)`,
                            quantity: patas.length,
                            price: 7.50,
                            serviceId: undefined
                        });
                    }

                    outrasRegioes.forEach(region => {
                        const price = KNOT_PRICES[region];
                        if (price) {
                            processedItems.push({
                                description: `Desembolo - ${region.charAt(0).toUpperCase() + region.slice(1)}`,
                                quantity: 1,
                                price,
                                serviceId: undefined
                            });
                        }
                    });
                }

                if (quoteData.wantsMedicatedBath) {
                    processedItems.push({
                        description: '💊 Banho Medicamentoso Antipulgas',
                        quantity: 1,
                        price: 45.00,
                        serviceId: undefined
                    });
                }

                // 2.5 Apply Recurrence Discounts to SPA services
                const recurrenceFrequency = quoteData.recurrenceFrequency || customer.recurrenceFrequency;
                let discountRate = 0;
                if (recurrenceFrequency === 'MENSAL') discountRate = 0.05;
                else if (recurrenceFrequency === 'QUINZENAL') discountRate = 0.07;
                else if (recurrenceFrequency === 'SEMANAL') discountRate = 0.10;

                if (discountRate > 0) {
                    for (const item of processedItems) {
                        // Assume items with a serviceId are SPA services unless they are transport
                        if (item.serviceId) {
                            const service = await tx.service.findUnique({ where: { id: item.serviceId } });
                            // Check if category implies SPA (adjust based on your actual categories)
                            if (service && service.category !== 'TRANSPORTE') {
                                item.price = item.price * (1 - discountRate);
                                item.description += ` (${(discountRate * 100).toFixed(0)}% desc reg.)`;
                            }
                        }
                    }
                }

                const totalAmount = processedItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);

                // Debug logging
                console.log('[createManual] Creating quote with:', {
                    customerId: dbCustomer!.id,
                    petId: dbPet?.id || null,
                    type: quoteData.type,
                    totalAmount,
                    itemsCount: processedItems.length
                });

                // Sanitize items - ensure serviceId is null not undefined
                const sanitizedItems = processedItems.map((item: any) => ({
                    description: item.description || 'Item sem descrição',
                    quantity: item.quantity || 1,
                    price: item.price || 0,
                    serviceId: item.serviceId || null
                }));

                console.log('[createManual] Sanitized items:', sanitizedItems);

                // 3. Create Quote
                const quote = await tx.quote.create({
                    data: {
                        customerId: dbCustomer!.id,
                        petId: dbPet?.id || null,
                        type: quoteData.type || 'SPA',
                        desiredAt: quoteData.desiredAt ? new Date(quoteData.desiredAt) : null,
                        transportOrigin: quoteData.transportOrigin || customer.address,
                        transportDestination: quoteData.transportDestination || "7Pet",
                        transportReturnAddress: quoteData.transportReturnAddress,
                        transportPeriod: quoteData.transportPeriod,
                        petQuantity: quoteData.petQuantity || 1,
                        hairLength: quoteData.hairLength,
                        hasKnots: quoteData.hasKnots || false,
                        knotRegions: quoteData.knotRegions,
                        hasParasites: quoteData.hasParasites || false,
                        parasiteTypes: quoteData.parasiteTypes,
                        parasiteComments: quoteData.parasiteComments,
                        wantsMedicatedBath: quoteData.wantsMedicatedBath || false,
                        transportLevaAt: quoteData.transportLevaAt ? new Date(quoteData.transportLevaAt) : null,
                        transportTrazAt: quoteData.transportTrazAt ? new Date(quoteData.transportTrazAt) : null,
                        status: 'SOLICITADO',
                        totalAmount,
                        statusHistory: {
                            create: {
                                oldStatus: 'NONE',
                                newStatus: 'SOLICITADO',
                                changedBy: user.id,
                                reason: 'Criado manualmente pelo operador'
                            }
                        },
                        items: {
                            create: sanitizedItems
                        }
                    },
                    include: {
                        items: true,
                        pet: { select: { name: true } },
                        customer: { select: { name: true } }
                    }
                });

                return quote;
            });

            // Audit Log
            await createAuditLog({
                entityType: 'QUOTE',
                entityId: result.id,
                action: 'CREATE',
                performedBy: user.id,
                reason: 'Orçamento manual criado com novo cadastro'
            });

            return res.status(201).json(result);
        } catch (error: any) {
            console.error('Erro ao criar orçamento manual:', error);
            return res.status(500).json({ error: 'Erro interno ao processar orçamento manual', message: error.message });
        }
    }
};
