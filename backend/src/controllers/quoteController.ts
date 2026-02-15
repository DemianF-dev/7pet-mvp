import { Request, Response } from 'express';
import { PrismaClient, QuoteStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import * as auditService from '../services/auditService';
import { notificationService } from '../services/notificationService';
import { messagingService } from '../services/messagingService';
import * as quoteService from '../services/quoteService';
import * as authService from '../services/authService';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { logInfo, logError, logWarn } from '../utils/logger';
import { ServicePriceConfigService } from '../services/servicePriceConfigService';

const quoteItemSchema = z.object({
    description: z.string().min(1, 'Descrição é obrigatória'),
    quantity: z.number().int().positive().default(1),
    price: z.number().default(0),
    serviceId: z.string().optional(),
    productId: z.string().optional()
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
    transportType: z.enum(['PICK_UP', 'DROP_OFF', 'ROUND_TRIP']).optional(),
    hasKnots: z.boolean().optional(),
    knotRegions: z.string().optional(),
    hairLength: z.string().optional(),
    hasParasites: z.boolean().optional(),
    parasiteTypes: z.string().optional(),
    parasiteComments: z.string().optional(),
    wantsMedicatedBath: z.boolean().optional(),
    petQuantity: z.number().int().optional(),
    transportLevaAt: z.string().optional(),
    transportTrazAt: z.string().optional(),
    saveAsDraft: z.boolean().optional().default(false)
});

export const quoteController = {
    async create(req: Request, res: Response) {
        logInfo('Quote create started', {
            userId: (req as any).user?.id,
            userRole: (req as any).user?.role
        });
        try {
            const user = (req as any).user;
            let customerId = user.customer?.id;

            if (!customerId) {
                if (user.role === 'CLIENTE') {
                    return res.status(403).json({ error: 'Usuário não é um cliente cadastrado.' });
                }
                customerId = req.body.customerId;
                if (!customerId) {
                    return res.status(400).json({ error: 'ID do cliente é obrigatório para criação por colaboradores.' });
                }
            }

            if (user.role === 'CLIENTE' && user.customer) {
                if (user.customer.canRequestQuotes === false) {
                    return res.status(403).json({ error: 'Sua conta está com restrição para solicitar novos orçamentos. Entre em contato com a 7Pet.' });
                }
            }

            const data = quoteSchema.parse(req.body);
            logInfo(`[QuoteCreate] Criando orçamento para CustomerID: ${customerId}`);

            const processedItems = data.items ? await Promise.all(data.items.map(async (item) => {
                let price = item.price;
                let description = item.description;

                if (item.serviceId) {
                    const service = await prisma.service.findUnique({ where: { id: item.serviceId } });
                    if (service) {
                        price = service.basePrice;
                        description = service.name;
                    }
                } else if (item.productId) {
                    const product = await prisma.product.findUnique({ where: { id: item.productId } });
                    if (product) {
                        price = product.price;
                        description = product.name;
                    }
                }

                return {
                    id: randomUUID(),
                    description,
                    quantity: item.quantity,
                    price,
                    serviceId: item.serviceId,
                    productId: item.productId
                };
            })) : [];

            if (data.hasKnots) {
                const settings = await prisma.transportSettings.findFirst();
                const knotRegions = data.knotRegions?.toLowerCase().split(',').map(r => r.trim()).filter(r => r) || [];
                const KNOT_PRICES = await ServicePriceConfigService.getKnotRemovalPrices();
                const defaultKnotPrice = settings?.knotPrice || 0;

                const patas = knotRegions.filter(r => r.includes('pata'));
                const outrasRegioes = knotRegions.filter(r => !r.includes('pata'));

                if (patas.length > 0) {
                    processedItems.push({
                        id: randomUUID(),
                        description: `Desembolo - Patas(${patas.length}x)`,
                        quantity: patas.length,
                        price: 7.50,
                        serviceId: undefined,
                        productId: undefined
                    });
                }

                outrasRegioes.forEach(region => {
                    const price = KNOT_PRICES[region];
                    if (price) {
                        processedItems.push({
                            id: randomUUID(),
                            description: `Desembolo - ${region.charAt(0).toUpperCase() + region.slice(1)} `,
                            quantity: 1,
                            price,
                            serviceId: undefined,
                            productId: undefined
                        });
                    }
                });

                // If no regions but has knots, add a general fee if configured
                if (knotRegions.length === 0 && defaultKnotPrice > 0) {
                    processedItems.push({
                        id: randomUUID(),
                        description: 'Desembolo (Taxa Geral)',
                        quantity: 1,
                        price: defaultKnotPrice,
                        serviceId: undefined,
                        productId: undefined
                    });
                }
            }

            if (data.wantsMedicatedBath) {
                const settings = await prisma.transportSettings.findFirst();
                let medicatedBathPrice = settings?.medicatedBathPrice || 0;

                if (medicatedBathPrice === 0) {
                    medicatedBathPrice = await ServicePriceConfigService.getMedicatedBathPrice();
                }

                processedItems.push({
                    id: randomUUID(),
                    description: '💊 Banho Medicamentoso',
                    quantity: 1,
                    price: medicatedBathPrice,
                    serviceId: undefined,
                    productId: undefined
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
                    transportType: data.transportType,
                    status: data.saveAsDraft ? 'RASCUNHO' : 'SOLICITADO',
                    totalAmount,
                    statusHistory: {
                        create: {
                            id: randomUUID(),
                            oldStatus: 'NONE',
                            newStatus: data.saveAsDraft ? 'RASCUNHO' : 'SOLICITADO',
                            changedBy: user.id,
                            reason: data.saveAsDraft
                                ? 'Rascunho salvo pelo cliente'
                                : (user.role === 'CLIENTE' ? 'Solicitação inicial pelo cliente' : `Criado por colaborador ${user.role}`)
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

            await auditService.logEvent((req as any).audit, {
                targetType: 'QUOTE',
                targetId: quote.id,
                clientId: quote.customerId || undefined,
                quoteId: quote.id,
                action: 'QUOTE_CREATED',
                summary: `Orçamento OR-${String(quote.seqId).padStart(4, '0')} criado`,
                after: quote,
                revertible: false
            });

            const customerData = await prisma.customer.findUnique({
                where: { id: customerId },
                select: { userId: true, name: true }
            });

            if (customerData && customerData.userId) {
                logInfo(`[QuoteCreate] Notifying customer: ${customerData.userId}`);
                await messagingService.notifyUser(
                    customerData.userId,
                    'Solicitação de Orçamento Recebida',
                    `Olá ${customerData.name}! Recebemos seu pedido para ${data.petId ? 'o pet' : 'seu pet'}. Fique atento às notificações!`,
                    'quote'
                );
            }

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
                logInfo(`[QuoteCreate] Notifying ${staffToNotify.length} staff members`);
                for (const staff of staffToNotify) {
                    await messagingService.notifyUser(
                        staff.id,
                        'Novo Orçamento Solicitado',
                        `Cliente ${customerData?.name || 'Desconhecido'} solicitou um orçamento.`,
                        'quote'
                    );
                }
            }

            return res.status(201).json(quote);
        } catch (error: any) {
            logError('[QuoteCreate] Error creating quote:', error);
            if (error instanceof z.ZodError) {
                return res.status(400).json({ errors: error.issues });
            }
            const isDev = process.env.NODE_ENV === 'development';
            return res.status(500).json({
                error: 'Internal server error',
                message: isDev && error instanceof Error ? error.message : undefined,
                details: isDev ? String(error) : undefined
            });
        }
    },

    async list(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            let where: any = { deletedAt: null };

            if (user.role === 'CLIENTE') {
                const clientId = user.customer?.id;

                if (!clientId) {
                    logError('[QuoteList] CRITICAL: Client User has NO Customer ID linked!', new Error('No customer ID'));
                    return res.status(403).json({ error: 'Perfil de cliente não encontrado. Por favor, entre em contato com o suporte.' });
                }

                where.customerId = clientId;
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
            const skip = (page - 1) * limit;

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
        } catch (error: any) {
            logError('Erro ao listar orçamentos:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async listRecurring(req: Request, res: Response) {
        try {
            const { customerId } = req.query;

            if (!customerId) {
                return res.status(400).json({ error: 'customerId é obrigatório.' });
            }

            const quotes = await quoteService.listRecurringQuotes(customerId as string);
            return res.json(quotes);
        } catch (error: any) {
            logError('Erro ao listar orçamentos recorrentes:', error);
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
                            category: true,
                            services: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
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

            if (quote.appointments?.length > 0 && quote.status !== 'AGENDADO' && quote.status !== 'ENCERRADO') {
                const updated = await prisma.quote.update({
                    where: { id },
                    data: { status: 'AGENDADO' }
                });
                quote.status = updated.status;
            }

            if (user.role === 'CLIENTE' && quote.customerId !== user.customer?.id) {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            return res.json(quote);
        } catch (error: any) {
            logError('Erro ao buscar orçamento:', error);
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

            if (user.role === 'CLIENTE') {
                if (quote.customerId !== user.customer?.id) return res.status(403).json({ error: 'Acesso negado' });
                if (!['APROVADO', 'REJEITADO'].includes(status)) {
                    return res.status(400).json({ error: 'Status inválido para cliente.' });
                }
                if (quote.status !== 'ENVIADO') {
                    return res.status(400).json({ error: 'Este orçamento não pode ser alterado por você no momento.' });
                }
            }

            const previousData = await prisma.quote.findUnique({
                where: { id },
                include: { items: true, pet: true, customer: true }
            });

            const updatedQuoteResult = await prisma.quote.update({
                where: { id },
                data: {
                    status,
                    statusHistory: {
                        create: {
                            id: randomUUID(),
                            oldStatus,
                            newStatus: status,
                            changedBy: user.id,
                            reason: reason || (user.role === 'CLIENTE' ? 'Cliente aprovou o orçamento' : `Alterado por ${user.role} `)
                        }
                    }
                },
                include: {
                    items: true,
                    customer: { select: { name: true, user: true, id: true } },
                    pet: { select: { name: true } }
                }
            });

            await auditService.logQuoteStatusChanged(
                (req as any).audit,
                id,
                updatedQuoteResult.customer.id,
                oldStatus,
                status
            );

            if (status === 'APROVADO') {
                const invoice = await quoteService.ensureInvoiceWithLines(id);
                if (invoice) {
                    logInfo(`[AUTO] Fatura itemizada gerada/verificada para orçamento aprovado ${id}`);

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
            }
            else if (status === 'ENVIADO' && oldStatus !== 'ENVIADO' && quote.customer.user) {
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

            return res.json(updatedQuoteResult);
        } catch (error: any) {
            logError('Erro ao atualizar status do orçamento:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = z.object({
                items: z.array(z.object({
                    id: z.string().optional(),
                    description: z.string().min(1),
                    quantity: z.number().default(1),
                    price: z.number().default(0),
                    discount: z.number().default(0),
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
                petId: z.string().optional(),
                transportLegs: z.any().optional(),
                isRecurring: z.boolean().optional(),
                recurrenceFrequency: z.string().optional(),
                recurrenceType: z.enum(['SPA', 'TRANSPORTE', 'AMBOS']).optional(),
                transportWeeklyFrequency: z.number().int().optional(),
                metadata: z.any().optional(),
                notes: z.string().optional(),
                transportType: z.any().optional(),
                transportDiscountPercent: z.number().optional()
            }).parse(req.body);

            const user = (req as any).user;
            if (user.role === 'CLIENTE') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const updateData: any = {
                totalAmount: data.totalAmount,
                metadata: data.metadata
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
                const currentQuote = await prisma.quote.findUnique({ where: { id } });
                if (currentQuote && currentQuote.status !== data.status) {
                    updateData.statusHistory = {
                        create: {
                            id: randomUUID(),
                            oldStatus: currentQuote.status,
                            newStatus: data.status,
                            changedBy: user.id,
                            reason: 'Atualização completa pelo colaborador'
                        }
                    };

                    if (data.status === 'ENVIADO' && currentQuote.customerId) {
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
                            logInfo(`[QuoteUpdate] Notification sent to customer ${customerData.userId}`);
                        }
                    }
                }
            }

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
            if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
            if (data.recurrenceFrequency !== undefined) updateData.frequency = data.recurrenceFrequency;
            if (req.body.notes !== undefined) updateData.notes = req.body.notes;
            if (data.transportWeeklyFrequency !== undefined) updateData.transportWeeklyFrequency = data.transportWeeklyFrequency;
            if (data.recurrenceType !== undefined) updateData.recurrenceType = data.recurrenceType;
            if (req.body.transportType !== undefined) updateData.transportType = req.body.transportType;
            if (req.body.transportDiscountPercent !== undefined) updateData.transportDiscountPercent = req.body.transportDiscountPercent;

            if (data.items) {
                const itemsTotal = data.items.reduce((acc, item) => acc + (item.price * item.quantity * (1 - (item.discount || 0) / 100)), 0);
                updateData.totalAmount = data.totalAmount ?? itemsTotal;

                const serviceIds = data.items
                    .map(i => i.serviceId)
                    .filter((id): id is string => !!id);

                const validServices = serviceIds.length > 0
                    ? await prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true } })
                    : [];
                const validServiceIds = new Set(validServices.map((s: { id: string }) => s.id));

                const performerIds = data.items
                    .map(i => i.performerId)
                    .filter((id): id is string => !!id);

                const validPerformers = performerIds.length > 0
                    ? await prisma.user.findMany({ where: { id: { in: performerIds } }, select: { id: true } })
                    : [];
                const validPerformerIds = new Set(validPerformers.map((p: { id: string }) => p.id));

                updateData.items = {
                    deleteMany: {},
                    create: data.items.map(item => {
                        let validServiceId = item.serviceId;
                        if (validServiceId && !validServiceIds.has(validServiceId)) {
                            logWarn(`[QuoteUpdate] Warning: Service ID ${validServiceId} not found. Setting to null.`);
                            validServiceId = null;
                        }

                        let validPerformerId = item.performerId;
                        if (validPerformerId && !validPerformerIds.has(validPerformerId)) {
                            logWarn(`[QuoteUpdate] Warning: Performer ID ${validPerformerId} not found. Setting to null.`);
                            validPerformerId = null;
                        }

                        return {
                            id: randomUUID(),
                            description: item.description,
                            quantity: item.quantity,
                            price: item.price,
                            discount: item.discount || 0,
                            serviceId: validServiceId || null,
                            performerId: validPerformerId || null
                        };
                    })
                };
            }

            await prisma.quote.update({
                where: { id },
                data: {
                    ...updateData,
                    transportLegs: (req.body.transportLegs && Array.isArray(req.body.transportLegs)) ? {
                        deleteMany: {},
                        create: (req.body.transportLegs as any[]).map((leg: any) => ({
                            id: randomUUID(),
                            legType: leg.legType,
                            originAddress: leg.origin || leg.originAddress,
                            destinationAddress: leg.destination || leg.destinationAddress,
                            kms: Number(leg.distance || leg.kms || 0),
                            minutes: Math.round(Number(leg.duration || leg.minutes || 0)),
                            price: Number(leg.price || 0),
                            providerId: leg.assignedProviderId || leg.providerId
                        }))
                    } : undefined
                }
            });

            if (updateData.totalAmount !== undefined) {
                const linkedInvoice = await prisma.invoice.findFirst({ where: { quotes: { some: { id } } } });
                if (linkedInvoice && linkedInvoice.status !== 'PAGO' && linkedInvoice.status !== 'ENCERRADO') {
                    await prisma.invoice.update({
                        where: { id: linkedInvoice.id },
                        data: { amount: updateData.totalAmount }
                    });
                    logInfo(`[SYNC] Fatura atualizada para acompanhar orçamento ${id}: ${updateData.totalAmount}`);
                }
            }

            const updated = await prisma.quote.findUnique({
                where: { id },
                include: { items: true, transportLegs: true }
            });

            return res.json(updated);
        } catch (error: any) {
            logError('Erro ao atualizar orçamento:', error);
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: 'Erro de validação', details: error.issues });
            }
            return res.status(500).json({ error: 'Internal server error', message: error instanceof Error ? error.message : String(error) });
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
                        create: original.items.map((item: any) => ({
                            id: randomUUID(),
                            description: item.description + ' (Cópia)',
                            quantity: item.quantity,
                            price: item.price
                        }))
                    },
                    statusHistory: {
                        create: {
                            id: randomUUID(),
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
        } catch (error: any) {
            logError('Erro ao duplicar orçamento:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Functions moved to sub-controllers:
    // - remove, restore, permanentRemove, bulkDelete, checkDependencies, cascadeDelete → quoteTrashController
    // - calculateTransport, calculateTransportEstimate, calculateTransportDetailed → quoteTransportController
    // - createPreset, listPresets, deletePreset → quotePresetController
    // - schedule, approveAndSchedule, undoSchedule → quoteWorkflowController

    /**
     * Criação de orçamento manual com cadastro simultâneo de cliente e pet
     */
    async createManual(req: Request, res: Response) {
        let customerEmail: string | undefined;

        try {
            const user = (req as any).user;
            if (user.role === 'CLIENTE') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const { customer, pet, quote: quoteData } = req.body;
            customerEmail = customer?.email;
            logInfo('[createManual] Iniciando processamento:', {
                customerEmail: customer?.email,
                quoteType: quoteData?.type,
                itemsCount: quoteData?.items?.length
            });

            if (!customer) {
                return res.status(400).json({ error: 'Dados do cliente são obrigatórios.' });
            }
            if (!customer.email) {
                return res.status(400).json({ error: 'Email do cliente é obrigatório.' });
            }
            if (!customer.name) {
                return res.status(400).json({ error: 'Nome do cliente é obrigatório.' });
            }
            if (!quoteData) {
                return res.status(400).json({ error: 'Dados do orçamento são obrigatórios.' });
            }

            const result = await prisma.$transaction(async (tx: any) => {
                logInfo('[createManual] Registrando/Localizando cliente e pet...');

                let dbCustomer, dbPet;
                try {
                    const result = await authService.registerManual(tx as any, { customer, pet });
                    dbCustomer = result.customer;
                    dbPet = result.pet;
                    logInfo('[createManual] Cliente/Pet registrado:', {
                        customerId: dbCustomer?.id,
                        petId: dbPet?.id
                    });
                } catch (authError: any) {
                    logError('[createManual] Erro ao registrar cliente/pet:', authError);
                    throw new Error(`Falha ao criar cliente/pet: ${authError.message}`);
                }

                if (!dbCustomer) {
                    throw new Error('Falha ao criar/localizar perfil do cliente.');
                }

                logInfo('[createManual] Processando itens e preços...');
                const processedItems = quoteData.items ? await Promise.all(quoteData.items.map(async (item: any) => {
                    let price = Number(item.price) || 0;
                    let description = item.description;
                    let productId = item.productId || null;
                    let serviceId = item.serviceId || null;

                    if (serviceId) {
                        const service = await tx.service.findUnique({ where: { id: serviceId } });
                        if (service) {
                            price = (Number(item.price) > 0) ? Number(item.price) : service.basePrice;
                            description = description || service.name;
                        }
                    } else if (productId) {
                        const product = await tx.product.findUnique({ where: { id: productId } });
                        if (product) {
                            price = (Number(item.price) > 0) ? Number(item.price) : product.price;
                            description = description || product.name;
                        }
                    }

                    return {
                        description: description || 'Sem descrição',
                        quantity: Number(item.quantity) || 1,
                        price,
                        serviceId,
                        productId
                    };
                })) : [];

                if (quoteData.hasKnots) {
                    logInfo('[createManual] Adicionando itens de desembolo...');
                    const settings = await tx.transportSettings.findFirst();
                    const knotRegions = quoteData.knotRegions?.toLowerCase().split(',').map((r: string) => r.trim()).filter((r: string) => r) || [];
                    const KNOT_PRICES = await ServicePriceConfigService.getKnotRemovalPrices();
                    const defaultKnotPrice = settings?.knotPrice || 0;

                    const patas = knotRegions.filter((r: string) => r.includes('pata'));
                    const outrasRegioes = knotRegions.filter((r: string) => !r.includes('pata'));

                    if (patas.length > 0) {
                        const pawPrice = await ServicePriceConfigService.getDefaultPawKnotPrice();
                        processedItems.push({
                            description: `Desembolo - Patas (${patas.length}x)`,
                            quantity: patas.length,
                            price: pawPrice,
                            serviceId: undefined
                        });
                    }

                    outrasRegioes.forEach((region: string) => {
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

                    if (knotRegions.length === 0 && defaultKnotPrice > 0) {
                        processedItems.push({
                            description: 'Desembolo (Taxa Geral)',
                            quantity: 1,
                            price: defaultKnotPrice,
                            serviceId: undefined
                        });
                    }
                }

                if (quoteData.wantsMedicatedBath) {
                    logInfo('[createManual] Adicionando item de banho medicamentoso...');
                    const settings = await tx.transportSettings.findFirst();
                    let medicatedBathPrice = settings?.medicatedBathPrice || 0;

                    if (medicatedBathPrice === 0) {
                        medicatedBathPrice = await ServicePriceConfigService.getMedicatedBathPrice();
                    }

                    processedItems.push({
                        description: '💊 Banho Medicamentoso',
                        quantity: 1,
                        price: medicatedBathPrice,
                        serviceId: undefined
                    });
                }

                const customerType = customer?.type || 'AVULSO';
                const recurrenceFrequency = quoteData.recurrenceFrequency || customer?.recurrenceFrequency || null;
                const transportWeeklyFreq = Number(quoteData.transportWeeklyFrequency) || Number(customer?.transportDaysPerWeek) || 1;

                let spaDiscountRate = 0;
                const validFrequencies = ['SEMANAL', 'QUINZENAL', 'MENSAL'];
                const safeFrequency = validFrequencies.includes(recurrenceFrequency || '') ? (recurrenceFrequency as any) : null;

                if (customerType === 'RECORRENTE' && quoteData.type !== 'TRANSPORTE') {
                    if (safeFrequency === 'MENSAL') spaDiscountRate = 0.05;
                    else if (safeFrequency === 'QUINZENAL') spaDiscountRate = 0.07;
                    else if (safeFrequency === 'SEMANAL') spaDiscountRate = 0.10;
                }

                let transportDiscountRate = 0;
                if (customerType === 'RECORRENTE' && quoteData.type !== 'SPA') {
                    if (transportWeeklyFreq >= 5) transportDiscountRate = 0.10;
                    else if (transportWeeklyFreq >= 3) transportDiscountRate = 0.07;
                    else transportDiscountRate = 0.05;
                }

                if (spaDiscountRate > 0 || transportDiscountRate > 0) {
                    logInfo(`[createManual] Aplicando descontos: SPA=${spaDiscountRate * 100}%, Transp=${transportDiscountRate * 100}%`);
                    for (const item of processedItems) {
                        const isTransport = item.description?.toLowerCase().includes('transporte') ||
                            item.description?.includes('🔄') ||
                            item.description?.includes('📦') ||
                            item.description?.includes('🏠');

                        if (isTransport && transportDiscountRate > 0) {
                            item.discount = (transportDiscountRate * 100);
                        } else if (!isTransport && !item.productId && spaDiscountRate > 0) {
                            item.discount = (spaDiscountRate * 100);
                        }
                    }
                }

                const strategicDiscount = Number(quoteData.strategicDiscount) || 0;
                if (strategicDiscount > 0) {
                    logInfo(`[createManual] Aplicando desconto estratégico em todos os itens: ${strategicDiscount}%`);
                    for (const item of processedItems) {
                        const discountMultiplier = 1 - (strategicDiscount / 100);
                        item.price = item.price * discountMultiplier;
                        if (!item.description.includes('% desc est.')) {
                            item.description += ` (${strategicDiscount}% desc est.)`;
                        }
                    }
                }

                const totalAmount = processedItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity * (1 - (item.discount || 0) / 100)), 0);

                if (isNaN(totalAmount)) {
                    throw new Error('Valor total calculado é inválido (NaN). Verifique os preços dos itens.');
                }

                const sanitizedItems = processedItems.map((item: any) => ({
                    id: randomUUID(),
                    description: item.description || 'Item sem descrição',
                    quantity: Number(item.quantity) || 1,
                    price: Number(item.price) || 0,
                    discount: Number(item.discount) || 0,
                    serviceId: item.serviceId || null,
                    productId: item.productId || null
                }));

                logInfo('[createManual] Criando registro de orçamento...', {
                    customerId: dbCustomer.id,
                    petId: dbPet?.id || null,
                    type: quoteData.type || 'SPA',
                    totalAmount,
                    itemsCount: sanitizedItems.length
                });

                if (!user?.id) {
                    logWarn('[createManual] user.id não encontrado, usando SYSTEM');
                }

                let quote;
                try {
                    quote = await tx.quote.create({
                        data: {
                            customerId: dbCustomer.id,
                            petId: dbPet?.id || null,
                            type: (quoteData.type as any) || 'SPA',
                            desiredAt: (quoteData.desiredAt && quoteData.desiredAt !== '') ? new Date(quoteData.desiredAt) : null,
                            transportOrigin: quoteData.transportOrigin || dbCustomer.address || customer.address || '',
                            transportDestination: quoteData.transportDestination || "7Pet",
                            transportReturnAddress: quoteData.transportReturnAddress || null,
                            transportType: (quoteData.transportType as any) || 'ROUND_TRIP',
                            transportPeriod: (quoteData.transportPeriod as any) || null,
                            petQuantity: Number(quoteData.petQuantity) || 1,
                            hairLength: quoteData.hairLength || null,
                            hasKnots: Boolean(quoteData.hasKnots) || false,
                            knotRegions: typeof quoteData.knotRegions === 'string' ? quoteData.knotRegions : null,
                            hasParasites: Boolean(quoteData.hasParasites) || false,
                            parasiteTypes: quoteData.parasiteTypes || null,
                            parasiteComments: quoteData.parasiteComments || null,
                            wantsMedicatedBath: Boolean(quoteData.wantsMedicatedBath) || false,
                            transportLevaAt: (quoteData.transportLevaAt && quoteData.transportLevaAt !== '') ? new Date(quoteData.transportLevaAt) : null,
                            transportTrazAt: (quoteData.transportTrazAt && quoteData.transportTrazAt !== '') ? new Date(quoteData.transportTrazAt) : null,
                            status: 'SOLICITADO' as any,
                            totalAmount: Number(totalAmount) || 0,
                            isRecurring: Boolean(customerType === 'RECORRENTE'),
                            frequency: (customerType === 'RECORRENTE') ? (safeFrequency as any) : null,
                            packageDiscount: spaDiscountRate > 0 ? Number(spaDiscountRate) : null,
                            metadata: {
                                ...(quoteData.metadata || {}),
                                recurrenceType: (quoteData.type === 'TRANSPORTE') ? 'TRANSPORTE' : (quoteData.type === 'SPA_TRANSPORTE' ? 'AMBOS' : 'SPA'),
                                transportWeeklyFrequency: customerType === 'RECORRENTE' ? transportWeeklyFreq : 1,
                            },
                            statusHistory: {
                                create: {
                                    id: randomUUID(),
                                    oldStatus: 'NONE',
                                    newStatus: 'SOLICITADO',
                                    changedBy: user.id || 'SYSTEM',
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
                } catch (prismaError: any) {
                    logError('[createManual] Erro ao criar quote no Prisma:', prismaError);
                    throw new Error(`Erro ao criar orçamento no banco: ${prismaError.message}`);
                }

                await auditService.logEvent((req as any).audit, {
                    targetType: 'QUOTE',
                    targetId: quote.id,
                    clientId: dbCustomer.id,
                    quoteId: quote.id,
                    action: 'QUOTE_CREATED',
                    summary: `Orçamento manual OR-${String(quote.seqId).padStart(4, '0')} criado com manual setup`,
                    after: quote,
                    revertible: false
                }, tx);

                return quote;
            }, {
                timeout: 15000
            });

            logInfo('[createManual] Orçamento criado com sucesso ID:', result.id);
            return res.status(201).json(result);
        } catch (error: any) {
            logError('[createManual] Erro fatal:', error);
            return res.status(500).json({
                error: 'Erro interno ao processar orçamento manual',
                message: error.message,
                details: {
                    code: error.code,
                    meta: error.meta,
                    customerEmail: customerEmail
                }
            });
        }
    }
};
