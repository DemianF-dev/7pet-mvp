import { Request, Response } from 'express';
import { PrismaClient, QuoteStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import * as auditService from '../services/auditService';
import { notificationService } from '../services/notificationService';
import { messagingService } from '../services/messagingService';
import * as quoteService from '../services/quoteService';
import { mapsService, MapsError } from '../services/googleMapsService';
import * as authService from '../services/authService';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import * as transportCalc from '../services/transportCalculationService';
import * as transportUnified from '../services/transportCalculationUnifiedService';
import { logInfo, logError, logWarn } from '../utils/logger';
import { ServicePriceConfigService } from '../services/servicePriceConfigService';

// const prisma = new PrismaClient(); // Removed in favor of imported instance

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
    hasKnots: z.boolean().optional(),
    knotRegions: z.string().optional(),
    hairLength: z.string().optional(),
    hasParasites: z.boolean().optional(),
    parasiteTypes: z.string().optional(), // 'PULGA', 'CARRAPATO', ou 'AMBOS'
    parasiteComments: z.string().optional(),
    wantsMedicatedBath: z.boolean().optional(), // Added missing field
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

            // Security: Removed sensitive request body logging
            const data = quoteSchema.parse(req.body);
            console.log(`[DEBUG] Criando orçamento para CustomerID: ${customerId}`, data);


            // Fetch prices for services and products if not provided (or to ensure they are correct)
            const processedItems = data.items ? await Promise.all(data.items.map(async (item) => {
                let price = item.price;
                let description = item.description;

                if (item.serviceId) {
                    const service = await prisma.service.findUnique({ where: { id: item.serviceId } });
                    if (service) {
                        price = service.basePrice;
                        description = service.name; // Ensure description matches service name
                    }
                } else if (item.productId) {
                    const product = await prisma.product.findUnique({ where: { id: item.productId } });
                    if (product) {
                        price = product.price;
                        description = product.name; // Ensure description matches product name
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

            // Adicionar automaticamente itens de desembolo se houver nós
            if (data.hasKnots && data.knotRegions) {
                const knotRegions = data.knotRegions.toLowerCase().split(',').map(r => r.trim()).filter(r => r);

                // Obter preços dinâmicos do banco com fallback para valores padrão
                const KNOT_PRICES = await ServicePriceConfigService.getKnotRemovalPrices();

                // Agrupa patas
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
            }

            // Adicionar banho medicamentoso antipulgas se solicitado
            if (data.wantsMedicatedBath) {
                const medicatedBathPrice = await ServicePriceConfigService.getMedicatedBathPrice();
                processedItems.push({
                    id: randomUUID(),
                    description: '💊 Banho Medicamentoso Antipulgas',
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

            // Create audit log
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

            // Notify customer about successful solicitation
            // Load customer user ID
            const customerData = await prisma.customer.findUnique({
                where: { id: customerId },
                select: { userId: true, name: true }
            });

            if (customerData && customerData.userId) {
                console.log(`[QuoteCreate] Notifying customer: ${customerData.userId}`);
                await messagingService.notifyUser(
                    customerData.userId,
                    'Solicitação de Orçamento Recebida',
                    `Olá ${customerData.name}! Recebemos seu pedido para ${data.petId ? 'o pet' : 'seu pet'}. Fique atento às notificações!`,
                    'quote'
                );
            }

            // Notify staff members (Admins and Finance)
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
                console.log(`[QuoteCreate] Notifying ${staffToNotify.length} staff members`);
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
            console.error('[QuoteCreate] ========== ERROR ==========');
            if (error instanceof z.ZodError) {
                console.error('[QuoteCreate] Validation Error:', JSON.stringify(error.issues, null, 2));
                return res.status(400).json({ errors: error.issues });
            }
            console.error('[QuoteCreate] Error creating quote:', error);
            console.error('[QuoteCreate] Error name:', error instanceof Error ? error.name : 'Unknown');
            console.error('[QuoteCreate] Error message:', error instanceof Error ? error.message : String(error));
            console.error('[QuoteCreate] Error stack:', error instanceof Error ? error.stack : 'No stack');

            // Log raw body for better debugging of production issues
            // Security: Removed sensitive request body logging from error context
            console.error('[QuoteCreate] User Context:', JSON.stringify({
                id: (req as any).user?.id,
                role: (req as any).user?.role,
                customer: (req as any).user?.customer
            }));

            // Send detailed error in development
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
        } catch (error: any) {
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
        } catch (error: any) {
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

            // Audit Log
            await auditService.logQuoteStatusChanged(
                (req as any).audit,
                id,
                updatedQuoteResult.customer.id,
                oldStatus,
                status
            );

            // Auto-generate invoice if Approved
            if (status === 'APROVADO') {

                const existingInvoice = await prisma.invoice.findFirst({ where: { quotes: { some: { id } } } });
                if (!existingInvoice) {
                    await prisma.invoice.create({
                        data: {
                            id: randomUUID(),
                            customer: {
                                connect: { id: quote.customerId }
                            },
                            quotes: {
                                connect: [{ id }]
                            },
                            amount: quote.totalAmount,
                            status: 'PENDENTE',
                            dueDate: quote.desiredAt || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Default +5 days (matching validity)
                            updatedAt: new Date()
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

            return res.json(updatedQuoteResult);
        } catch (error: any) {
            console.error('Erro ao atualizar status do orçamento:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async update(req: Request, res: Response) {
        try {
            // Security: Removed sensitive request body logging
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
                petId: z.string().optional(),
                transportLegs: z.any().optional(),
                isRecurring: z.boolean().optional(),
                recurrenceFrequency: z.string().optional(),
                recurrenceType: z.enum(['SPA', 'TRANSPORTE', 'AMBOS']).optional(),
                transportWeeklyFrequency: z.number().int().optional(),
                metadata: z.any().optional(),
            }).parse(req.body);

            const user = (req as any).user;
            if (user.role === 'CLIENTE') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            // Prepare update data
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
                // Add history if status is changing
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
            if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
            if (data.recurrenceFrequency !== undefined) updateData.frequency = data.recurrenceFrequency;
            // Removed recurrenceType and transportWeeklyFrequency as they are not in the schema

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
                const validServiceIds = new Set(validServices.map((s: { id: string }) => s.id));

                // VALIDATION: Performer IDs
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
                        // Fallback to null if service ID is invalid/not found
                        let validServiceId = item.serviceId;
                        if (validServiceId && !validServiceIds.has(validServiceId)) {
                            console.warn(`[QuoteUpdate] Warning: Service ID ${validServiceId} not found. Setting to null.`);
                            validServiceId = null;
                        }

                        // Fallback to null if performer ID is invalid/not found
                        let validPerformerId = item.performerId;
                        if (validPerformerId && !validPerformerIds.has(validPerformerId)) {
                            console.warn(`[QuoteUpdate] Warning: Performer ID ${validPerformerId} not found. Setting to null.`);
                            validPerformerId = null;
                        }

                        return {
                            id: randomUUID(),
                            description: item.description,
                            quantity: item.quantity,
                            price: item.price,
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
                include: { items: true, transportLegs: true }
            });

            return res.json(updated);
        } catch (error: any) {
            console.error('Erro ao atualizar orçamento:', error);
            if (error instanceof z.ZodError) {
                console.error('Zod Validation Errors:', JSON.stringify(error.issues, null, 2));
                return res.status(400).json({ error: 'Erro de validação', details: error.issues });
            }
            return res.status(500).json({ error: 'Internal server error', message: error instanceof Error ? error.message : String(error) });
        }
    },

    async schedule(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { occurrences } = req.body;
            const user = (req as any).user;

            if (user.role === 'CLIENTE') {
                return res.status(403).json({ error: 'Apenas colaboradores podem realizar o agendamento.' });
            }

            if (!occurrences || !Array.isArray(occurrences)) {
                return res.status(400).json({ error: 'Payload inválido. "occurrences" deve ser um array.' });
            }

            const result = await quoteService.scheduleQuote(id, { occurrences }, user);

            return res.status(200).json({
                message: 'Agendamentos realizados com sucesso',
                count: result.length,
                appointments: result
            });

        } catch (error: any) {
            console.error('[QuoteController] Error scheduling quote:', error);
            return res.status(400).json({
                error: error.message || 'Erro ao agendar orçamento.'
            });
        }
    },

    async listTrash(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            if (user.role === 'CLIENTE') return res.status(403).json({ error: 'Acesso negado' });

            // Pagination parameters
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
            const skip = (page - 1) * limit;

            // Get total count for pagination metadata
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

            // Log the deletion
            await auditService.logEvent((req as any).audit, {
                targetType: 'QUOTE',
                targetId: id,
                action: 'BULK_DELETE',
                summary: 'Orçamento movido para a lixeira'
            });
            return res.status(204).send();
        } catch (error: any) {
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
        } catch (error: any) {
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
            await auditService.logEvent((req as any).audit, {
                targetType: 'QUOTE',
                targetId: id,
                action: 'BULK_DELETE',
                summary: 'Exclusão permanente de orçamento após período de retenção'
            });

            return res.status(204).send();
        } catch (error: any) {
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
        } catch (error: any) {
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

            // Capture vars for error handling
            const originAddress = address;
            const destAddress = destinationAddress;

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

            console.log(`[Quote] Calling transportUnified with type: ${transportType} `);

            const result = await transportUnified.calculateTransportQuoteUnified({
                plan: 'TL1', // Default para backward compatibility
                mode: transportType === 'PICK_UP' ? 'LEVA' : transportType === 'DROP_OFF' ? 'TRAZ' : 'LEVA_TRAZ',
                destinationIsThePet: true,
                address1: address,
                address2: destinationAddress
            });
            console.log(`[Quote] Calculation result: `, result);

            // Persist LEGS V2
            await prisma.transportLeg.deleteMany({
                where: { quoteId: id }
            });

            await prisma.transportLeg.createMany({
                data: result.legs.map(leg => ({
                    quoteId: id,
                    legType: leg.kind as any,
                    originAddress: leg.originAddress,
                    destinationAddress: leg.destinationAddress,
                    kms: leg.distanceKm,
                    minutes: Math.round(leg.durationMin),
                    price: leg.subtotal,
                }))
            });

            return res.status(200).json({
                total: result.totals.totalAfterDiscount,
                totalBeforeDiscount: result.totals.totalBeforeDiscount,
                totalDistance: result.legs.reduce((sum: number, leg) => sum + leg.distanceKm, 0).toFixed(2) + ' km',
                totalDuration: result.legs.reduce((sum: number, leg) => sum + leg.durationMin, 0).toFixed(0) + ' min',
                breakdown: {
                    largada: {
                        distance: result.legs.find(l => l.kind === 'PARTIDA')?.distanceKm.toFixed(1) + ' km',
                        duration: result.legs.find(l => l.kind === 'PARTIDA')?.durationMin + ' min',
                        price: result.legs.find(l => l.kind === 'PARTIDA')?.subtotal || 0,
                        originAddress: result.legs.find(l => l.kind === 'PARTIDA')?.originAddress || '',
                        destinationAddress: result.legs.find(l => l.kind === 'PARTIDA')?.destinationAddress || ''
                    },
                    leva: {
                        distance: result.legs.find(l => l.kind === 'LEVA')?.distanceKm.toFixed(1) + ' km',
                        duration: result.legs.find(l => l.kind === 'LEVA')?.durationMin + ' min',
                        price: result.legs.find(l => l.kind === 'LEVA')?.subtotal || 0,
                        originAddress: result.legs.find(l => l.kind === 'LEVA')?.originAddress || '',
                        destinationAddress: result.legs.find(l => l.kind === 'LEVA')?.destinationAddress || ''
                    },
                    traz: {
                        distance: result.legs.find(l => l.kind === 'TRAZ')?.distanceKm.toFixed(1) + ' km',
                        duration: result.legs.find(l => l.kind === 'TRAZ')?.durationMin + ' min',
                        price: result.legs.find(l => l.kind === 'TRAZ')?.subtotal || 0,
                        originAddress: result.legs.find(l => l.kind === 'TRAZ')?.originAddress || '',
                        destinationAddress: result.legs.find(l => l.kind === 'TRAZ')?.destinationAddress || ''
                    },
                    retorno: {
                        distance: result.legs.find(l => l.kind === 'RETORNO')?.distanceKm.toFixed(1) + ' km',
                        duration: result.legs.find(l => l.kind === 'RETORNO')?.durationMin + ' min',
                        price: result.legs.find(l => l.kind === 'RETORNO')?.subtotal || 0,
                        originAddress: result.legs.find(l => l.kind === 'RETORNO')?.originAddress || '',
                        destinationAddress: result.legs.find(l => l.kind === 'RETORNO')?.destinationAddress || ''
                    }
                },
                settings: result.settings
            });
        } catch (error: any) {
            console.error('[Quote] Error calculating transport:', error);

            // Handle structured MapsError
            if (error instanceof MapsError) {
                console.error(`[Quote] MapsError for Quote ${req.params.id}: code=${error.code}, status=${error.upstreamStatus

                    }, origin=${req.body.address}, dest=${req.body.destinationAddress || 'N/A'}`);

                const statusCode = error.code === 'MAPS_AUTH' ? 502 :
                    error.code === 'MAPS_QUOTA' ? 503 :
                        error.code === 'MAPS_BAD_REQUEST' ? 400 :
                            error.code === 'MAPS_CONFIG' ? 500 :
                                502;

                const userMessages: Record<string, string> = {
                    'MAPS_AUTH': 'Erro ao calcular rota. Entre em contato com o suporte.',
                    'MAPS_QUOTA': 'Limite de uso atingido. Tente novamente em alguns minutos.',
                    'MAPS_BAD_REQUEST': 'Endereco invalido. Verifique o endereco e tente novamente.',
                    'MAPS_UPSTREAM': 'Servico de mapas temporariamente indisponivel.',
                    'MAPS_CONFIG': 'Erro de configuracao. Entre em contato com o suporte.'
                };

                return res.status(statusCode).json({
                    ok: false,
                    code: error.code,
                    messageUser: userMessages[error.code] || 'Erro ao calcular transporte.',
                    messageDev: `${error.message}${error.upstreamMessage ? ` | Upstream: ${error.upstreamMessage}` : ''}`,
                    upstreamStatus: error.upstreamStatus
                });
            }

            // Fallback for unexpected errors
            console.error('[Quote] Unexpected error:', error);
            return res.status(500).json({
                ok: false,
                code: 'INTERNAL_ERROR',
                messageUser: 'Erro inesperado. Tente novamente ou entre em contato com o suporte.',
                messageDev: error.message || 'Unknown error'
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
        // Store customer email for error logging
        let customerEmail: string | undefined;

        try {
            const user = (req as any).user;
            if (user.role === 'CLIENTE') {
                return res.status(403).json({ error: 'Acesso negado' });
            }

            const { customer, pet, quote: quoteData } = req.body;
            customerEmail = customer?.email;
            console.log('[createManual] Iniciando processamento:', {
                customerEmail: customer?.email,
                quoteType: quoteData?.type,
                itemsCount: quoteData?.items?.length
            });

            // Basic validation
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
                // 1. Register/Get Customer and Pet
                console.log('[createManual] Registrando/Localizando cliente e pet...');
                console.log('[createManual] Dados recebidos:', {
                    customer: { ...customer, email: customer?.email },
                    pet: pet ? { name: pet.name, id: pet.id } : null
                });

                let dbCustomer, dbPet;
                try {
                    const result = await authService.registerManual(tx as any, { customer, pet });
                    dbCustomer = result.customer;
                    dbPet = result.pet;
                    console.log('[createManual] Cliente/Pet registrado:', {
                        customerId: dbCustomer?.id,
                        petId: dbPet?.id
                    });
                } catch (authError: any) {
                    console.error('[createManual] Erro ao registrar cliente/pet:', authError);
                    throw new Error(`Falha ao criar cliente/pet: ${authError.message}`);
                }

                if (!dbCustomer) {
                    throw new Error('Falha ao criar/localizar perfil do cliente.');
                }

                // 2. Process Items (fetch prices)
                console.log('[createManual] Processando itens e preços...');
                console.log('[createManual] Items recebidos:', quoteData?.items?.length || 0);
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

                // Lógica de adição automática de itens (Knots/Nós e Banho Medicamentoso)
                if (quoteData.hasKnots && quoteData.knotRegions) {
                    console.log('[createManual] Adicionando itens de desembolo...');
                    const knotRegions = quoteData.knotRegions.toLowerCase().split(',').map((r: string) => r.trim()).filter((r: string) => r);
                    const KNOT_PRICES = await ServicePriceConfigService.getKnotRemovalPrices();

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
                }

                if (quoteData.wantsMedicatedBath) {
                    const medicatedBathPrice = await ServicePriceConfigService.getMedicatedBathPrice();
                    processedItems.push({
                        description: '💊 Banho Medicamentoso Antipulgas',
                        quantity: 1,
                        price: medicatedBathPrice,
                        serviceId: undefined
                    });
                }

                // 2.5 Apply Recurrence Discounts
                // Safe access to customer properties
                const customerType = customer?.type || 'AVULSO';
                const recurrenceFrequency = quoteData.recurrenceFrequency || customer?.recurrenceFrequency || null;
                const transportWeeklyFreq = 1; // Default since it was removed from UI

                console.log('[createManual] Dados de recorrência:', {
                    customerType,
                    recurrenceFrequency,
                    transportWeeklyFreq
                });

                let spaDiscountRate = 0;
                const validFrequencies = ['SEMANAL', 'QUINZENAL', 'MENSAL'];
                const safeFrequency = validFrequencies.includes(recurrenceFrequency || '') ? (recurrenceFrequency as any) : null;

                if (customerType === 'RECORRENTE') {
                    if (safeFrequency === 'MENSAL') spaDiscountRate = 0.05;
                    else if (safeFrequency === 'QUINZENAL') spaDiscountRate = 0.07;
                    else if (safeFrequency === 'SEMANAL') spaDiscountRate = 0.10;
                }

                let transportDiscountRate = 0;
                if (customerType === 'RECORRENTE') {
                    if (transportWeeklyFreq <= 2) transportDiscountRate = 0.05;
                    else if (transportWeeklyFreq <= 4) transportDiscountRate = 0.07;
                    else if (transportWeeklyFreq <= 6) transportDiscountRate = 0.10;
                }

                if (spaDiscountRate > 0 || transportDiscountRate > 0) {
                    console.log(`[createManual] Aplicando descontos: SPA=${spaDiscountRate * 100}%, Transp=${transportDiscountRate * 100}%`);
                    for (const item of processedItems) {
                        const isTransport = item.description?.toLowerCase().includes('transporte') ||
                            item.description?.includes('🔄') ||
                            item.description?.includes('📦') ||
                            item.description?.includes('🏠');

                        if (isTransport && transportDiscountRate > 0) {
                            item.price = item.price * (1 - transportDiscountRate);
                            if (!item.description.includes('% desc reg.')) {
                                item.description += ` (${(transportDiscountRate * 100).toFixed(0)}% desc reg.)`;
                            }
                        } else if (!isTransport && !item.productId && spaDiscountRate > 0) {
                            item.price = item.price * (1 - spaDiscountRate);
                            if (!item.description.includes('% desc reg.')) {
                                item.description += ` (${(spaDiscountRate * 100).toFixed(0)}% desc reg.)`;
                            }
                        }
                    }
                }

                // Apply Strategic Discount to ALL items if AVULSO
                const strategicDiscount = Number(quoteData.strategicDiscount) || 0;
                if (strategicDiscount > 0) {
                    console.log(`[createManual] Aplicando desconto estratégico em todos os itens: ${strategicDiscount}%`);
                    for (const item of processedItems) {
                        const discountMultiplier = 1 - (strategicDiscount / 100);
                        item.price = item.price * discountMultiplier;
                        if (!item.description.includes('% desc est.')) {
                            item.description += ` (${strategicDiscount}% desc est.)`;
                        }
                    }
                }

                const totalAmount = processedItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);

                // Validation of totalAmount to avoid NaN
                if (isNaN(totalAmount)) {
                    throw new Error('Valor total calculado é inválido (NaN). Verifique os preços dos itens.');
                }

                 // Sanitize items
                 const sanitizedItems = processedItems.map((item: any) => ({
                     id: randomUUID(), // Ensure each item has an ID
                     description: item.description || 'Item sem descrição',
                     quantity: Number(item.quantity) || 1,
                     price: Number(item.price) || 0,
                     serviceId: item.serviceId || null,
                     productId: item.productId || null
                 }));

                console.log('[createManual] Criando registro de orçamento...');
                console.log('[createManual] Dados do orçamento:', {
                    customerId: dbCustomer.id,
                    petId: dbPet?.id || null,
                    type: quoteData.type || 'SPA',
                    totalAmount,
                    itemsCount: sanitizedItems.length,
                    userId: user?.id || 'SYSTEM'
                });

                // Validate required fields
                if (!user?.id) {
                    console.warn('[createManual] user.id não encontrado, usando SYSTEM');
                }

                // 3. Create Quote
                let quote;
                try {
                    quote = await tx.quote.create({
                        data: {
                            customerId: dbCustomer.id,
                            petId: dbPet?.id || null,
                            type: quoteData.type || 'SPA',
                            desiredAt: (quoteData.desiredAt && quoteData.desiredAt !== '') ? new Date(quoteData.desiredAt) : null,
                            transportOrigin: quoteData.transportOrigin || dbCustomer.address || customer.address,
                            transportDestination: quoteData.transportDestination || "7Pet",
                            transportReturnAddress: quoteData.transportReturnAddress,
                            transportPeriod: quoteData.transportPeriod,
                            petQuantity: Number(quoteData.petQuantity) || 1,
                            hairLength: quoteData.hairLength,
                            hasKnots: quoteData.hasKnots || false,
                            knotRegions: typeof quoteData.knotRegions === 'string' ? quoteData.knotRegions : null,
                            hasParasites: quoteData.hasParasites || false,
                            parasiteTypes: quoteData.parasiteTypes,
                            parasiteComments: quoteData.parasiteComments,
                            wantsMedicatedBath: quoteData.wantsMedicatedBath || false,
                            transportLevaAt: (quoteData.transportLevaAt && quoteData.transportLevaAt !== '') ? new Date(quoteData.transportLevaAt) : null,
                            transportTrazAt: (quoteData.transportTrazAt && quoteData.transportTrazAt !== '') ? new Date(quoteData.transportTrazAt) : null,
                            status: 'SOLICITADO',
                            totalAmount,
                            isRecurring: customerType === 'RECORRENTE',
                            frequency: (customerType === 'RECORRENTE') ? safeFrequency : null,
                            packageDiscount: spaDiscountRate > 0 ? spaDiscountRate : null,
                             metadata: {
                                 recurrenceType: 'SPA',
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
                    console.error('[createManual] Erro ao criar quote no Prisma. Dados da tentativa:', JSON.stringify({
                        customerId: dbCustomer.id,
                        petId: dbPet?.id || null,
                        type: quoteData.type || 'SPA',
                        isRecurring: customerType === 'RECORRENTE',
                        frequency: (customerType === 'RECORRENTE') ? safeFrequency : null,
                        itemsCount: sanitizedItems.length,
                        totalAmount
                    }, null, 2));
                    console.error('[createManual] Erro ao criar quote no Prisma:', prismaError);
                    console.error('[createManual] Prisma error code:', prismaError.code);
                    console.error('[createManual] Prisma error meta:', prismaError.meta);
                    throw new Error(`Erro ao criar orçamento no banco: ${prismaError.message}`);
                }

                // Create audit log
                await auditService.logEvent((req as any).audit, {
                    targetType: 'QUOTE',
                    targetId: quote.id,
                    clientId: dbCustomer.id, // Use dbCustomer.id here
                    quoteId: quote.id,
                    action: 'QUOTE_CREATED',
                    summary: `Orçamento manual OR-${String(quote.seqId).padStart(4, '0')} criado com manual setup`,
                    after: quote,
                    revertible: false
                }, tx);

                return quote;
            }, {
                timeout: 15000 // Aumentar timeout para transações pesadas de cadastro
            });

            console.log('[createManual] Orçamento criado com sucesso ID:', result.id);
            return res.status(201).json(result);
        } catch (error: any) {
            console.error('[createManual] ====================');
            console.error('[createManual] Erro fatal capturado:', error);
            console.error('[createManual] Error message:', error.message);
            console.error('[createManual] Error code:', error.code);
            console.error('[createManual] Error stack:', error.stack);
            
            // Log do payload recebido para debug
            console.error('[createManual] Payload recebido:', JSON.stringify(req.body, null, 2));
            
            console.error('[createManual] ====================');

            // Return detailed error for debugging
            return res.status(500).json({
                error: 'Erro interno ao processar orçamento manual',
                message: error.message,
                details: {
                    code: error.code,
                    meta: error.meta,
                    customerEmail: customerEmail
                },
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    /**
     * Calculate transport pricing with detailed breakdown
     * POST /transport/calculate
     */
    async calculateTransportDetailed(req: Request, res: Response) {
        try {
            // Security: Removed sensitive request body logging

            // Validation schema
            const schema = z.object({
                plan: z.enum(['TL1', 'TL2']),
                mode: z.enum(['LEVA', 'TRAZ', 'LEVA_TRAZ']),
                destinationIsThePet: z.boolean(),
                address1: z.string().min(5, 'Endereço do cliente é obrigatório'),
                address2: z.string().optional(),
                stopAddress: z.string().optional(),
                discountPercent: z.number().min(0).max(100).optional().default(0)
            });

            const data = schema.parse(req.body);

            // Additional validation
            if (data.plan === 'TL2' && !data.destinationIsThePet && !data.address2) {
                return res.status(422).json({
                    error: 'address2 é obrigatório para TL2 quando o destino não é The Pet'
                });
            }

            // Call calculation service
            const result = await transportCalc.calculateTransportQuote(data);

            console.log('[TransportCalc] Success:', result.totals);
            return res.json(result);

        } catch (error: any) {
            console.error('[TransportCalc] Error:', error);

            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    error: 'Validação falhou',
                    details: error.issues
                });
            }

            if (error instanceof Error) {
                // Check if it's a validation error from service
                if (error.message.includes('requires') || error.message.includes('obrigatório')) {
                    return res.status(422).json({ error: error.message });
                }

                // Check if it's a Maps error
                if (error.message.includes('Google Maps') || error.message.includes('route')) {
                    return res.status(503).json({
                        error: 'Erro ao calcular rota',
                        message: error.message
                    });
                }
            }

            return res.status(500).json({
                error: 'Erro ao calcular transporte',
                message: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
};

