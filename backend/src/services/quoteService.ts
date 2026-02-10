import prisma from '../lib/prisma';
import { QuoteDependencies, CascadeDeleteOptions } from '../types/QuoteDependencies';
import { messagingService } from './messagingService';
import { createAuditLog } from '../utils/auditLogger';
import logger, { logInfo, logError } from '../utils/logger';
import { randomUUID } from 'crypto';
import { HttpError } from '../utils/httpError';
import { buildScheduleHash, mergeMetadata, validateOccurrencesForQuote } from '../domain/scheduling/scheduleUtils';

/**
 * Helper: Create partial transport snapshot for recurring appointments
 * LEVA appointments get: largada + leva (divided by occurrence count)
 * TRAZ appointments get: traz + retorno (divided by occurrence count)
 */
const createPartialTransportSnapshot = (
    fullSnapshot: any,
    legType: 'LEVA' | 'TRAZ',
    occurrenceCount: number
) => {
    if (!fullSnapshot || !fullSnapshot.breakdown) return undefined;

    if (legType === 'LEVA') {
        const largadaPrice = parseFloat(fullSnapshot.breakdown.largada?.price || 0) / occurrenceCount;
        const levaPrice = parseFloat(fullSnapshot.breakdown.leva?.price || 0) / occurrenceCount;

        return {
            transportSnapshot: {
                totalAmount: largadaPrice + levaPrice,
                breakdown: {
                    largada: fullSnapshot.breakdown.largada ? { ...fullSnapshot.breakdown.largada, price: largadaPrice.toFixed(2) } : null,
                    leva: fullSnapshot.breakdown.leva ? { ...fullSnapshot.breakdown.leva, price: levaPrice.toFixed(2) } : null
                }
            }
        };
    } else { // TRAZ
        const trazPrice = parseFloat(fullSnapshot.breakdown.traz?.price || 0) / occurrenceCount;
        const retornoPrice = parseFloat(fullSnapshot.breakdown.retorno?.price || 0) / occurrenceCount;

        return {
            transportSnapshot: {
                totalAmount: trazPrice + retornoPrice,
                breakdown: {
                    traz: fullSnapshot.breakdown.traz ? { ...fullSnapshot.breakdown.traz, price: trazPrice.toFixed(2) } : null,
                    retorno: fullSnapshot.breakdown.retorno ? { ...fullSnapshot.breakdown.retorno, price: retornoPrice.toFixed(2) } : null
                }
            }
        };
    }
};

/**
 * Helper: Calculate correct price for a transport leg based on transport type
 * - PICK_UP only (Só Leva): largada + leva + retorno
 * - DROP_OFF only (Só Traz): largada + traz + retorno  
 * - ROUND_TRIP (Leva & Traz):
 *   - LEVA appointment: largada + leva
 *   - TRAZ appointment: traz + retorno
 */
const calculateTransportLegPrice = (
    snapshot: any,
    transportType: string,
    legType: 'LEVA' | 'TRAZ'
): number => {
    if (!snapshot?.breakdown) return snapshot?.totalAmount || 0;

    const breakdown = snapshot.breakdown;
    const largada = parseFloat(breakdown.largada?.price || 0);
    const leva = parseFloat(breakdown.leva?.price || 0);
    const traz = parseFloat(breakdown.traz?.price || 0);
    const retorno = parseFloat(breakdown.retorno?.price || 0);

    // Só Leva: all components
    if (transportType === 'PICK_UP') {
        return largada + leva + retorno;
    }

    // Só Traz: all components
    if (transportType === 'DROP_OFF') {
        return largada + traz + retorno;
    }

    // Leva & Traz (Round Trip): split correctly
    if (legType === 'LEVA') {
        return largada + leva;
    } else {
        return traz + retorno;
    }
};



/**
 * Verifica dependências de um orçamento (appointments e invoices)
 */
export const checkDependencies = async (id: string): Promise<QuoteDependencies> => {
    const quote = await prisma.quote.findUnique({
        where: { id },
        include: {
            appointments: {
                include: {
                    services: { select: { name: true } },
                    transportDetails: true
                }
            },
            invoice: true
        }
    });

    if (!quote) {
        throw new Error('Orçamento não encontrado');
    }

    // Separar appointments por categoria
    const spaAppointments = quote.appointments.filter(a => a.category === 'SPA' && !a.deletedAt);
    const transportAppointments = quote.appointments.filter(a => a.category === 'LOGISTICA' && !a.deletedAt);

    const warnings: string[] = [];

    // Avisos baseados no status da invoice
    if (quote.invoice && !quote.invoice.deletedAt) {
        if (quote.invoice.status === 'PAGO') {
            warnings.push('⚠️ Fatura já foi paga. Deletar pode impactar o financeiro.');
        } else if (quote.invoice.status === 'PENDENTE') {
            warnings.push('💰 Há uma fatura pendente vinculada a este orçamento.');
        }
    }

    // Avisos baseados no status dos appointments
    const confirmedSpa = spaAppointments.filter(a => a.status === 'CONFIRMADO');
    if (confirmedSpa.length > 0) {
        warnings.push(`🔔 ${confirmedSpa.length} agendamento(s) SPA confirmado(s). Cliente pode ter sido notificado.`);
    }

    const confirmedTransport = transportAppointments.filter(a => a.status === 'CONFIRMADO');
    if (confirmedTransport.length > 0) {
        warnings.push(`🚗 ${confirmedTransport.length} agendamento(s) de transporte confirmado(s).`);
    }

    return {
        quote: {
            id: quote.id,
            seqId: quote.seqId,
            totalAmount: quote.totalAmount,
            status: quote.status
        },
        appointments: {
            spa: spaAppointments.map(a => ({
                id: a.id,
                startAt: a.startAt?.toISOString() || '',
                status: a.status,
                services: a.services.map(s => s.name)
            })),
            transport: transportAppointments.map(a => ({
                id: a.id,
                startAt: a.startAt?.toISOString() || '',
                status: a.status,
                origin: a.transportDetails?.origin,
                destination: a.transportDetails?.destination
            }))
        },
        invoice: quote.invoice && !quote.invoice.deletedAt ? {
            id: quote.invoice.id,
            amount: quote.invoice.amount,
            status: quote.invoice.status,
            dueDate: quote.invoice.dueDate.toISOString()
        } : undefined,
        canDelete: true,
        warnings
    };
};

/**
 * Delete em cascata com opções selecionáveis
 */
export const cascadeDelete = async (
    id: string,
    options: CascadeDeleteOptions,
    performedBy?: string
) => {
    const quote = await prisma.quote.findUnique({
        where: { id },
        include: { appointments: true, invoice: true }
    });

    if (!quote) {
        throw new Error('Orçamento não encontrado');
    }

    if (quote.deletedAt) {
        throw new Error('Este orçamento já está na lixeira');
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
        let deletedSpaCount = 0;
        let deletedTransportCount = 0;
        let deletedInvoice = false;

        // 1. Deletar agendamentos SPA se solicitado
        if (options.deleteSpaAppointments) {
            const spaIds = quote.appointments
                .filter(a => a.category === 'SPA' && !a.deletedAt)
                .map(a => a.id);

            if (spaIds.length > 0) {
                const result = await tx.appointment.updateMany({
                    where: { id: { in: spaIds } },
                    data: { deletedAt: now }
                });
                deletedSpaCount = result.count;
            }
        }

        // 2. Deletar agendamentos de transporte se solicitado
        if (options.deleteTransportAppointments) {
            const transportIds = quote.appointments
                .filter(a => a.category === 'LOGISTICA' && !a.deletedAt)
                .map(a => a.id);

            if (transportIds.length > 0) {
                const result = await tx.appointment.updateMany({
                    where: { id: { in: transportIds } },
                    data: { deletedAt: now }
                });
                deletedTransportCount = result.count;
            }
        }

        // 3. Unlink invoice if requested (better than deleting to maintain history, or use soft-delete if preferred)
        if (options.deleteInvoice && quote.invoice && !quote.invoice.deletedAt) {
            await tx.invoice.update({
                where: { id: quote.invoice.id },
                data: {
                    deletedAt: now,
                    quotes: {
                        disconnect: [{ id: quote.id }] // Unlink it from the quote
                    },
                    appointmentId: null // Unlink from appt too just in case
                }
            });
            deletedInvoice = true;
        }

        // 4. Sempre deletar o quote (soft delete)
        await tx.quote.update({
            where: { id },
            data: { deletedAt: now }
        });

        // 5. Log de auditoria (se necessário)
        // Pode ser implementado através do auditLogger se disponível
        console.log(`[CASCADE DELETE] Quote ${quote.seqId} deleted by ${performedBy || 'system'}`, {
            deletedSpaAppointments: deletedSpaCount,
            deletedTransportAppointments: deletedTransportCount,
            deletedInvoice,
            timestamp: now
        });
    });

    return {
        success: true,
        message: 'Orçamento e itens selecionados movidos para a lixeira'
    };
};

/**
 * One-Click Approval & Scheduling
 * Supports both single and recurring appointments
 */
export const approveAndSchedule = async (
    id: string,
    performerId?: string,
    authUser?: any,
    occurrences?: Array<{
        spaAt?: string;
        levaAt?: string;
        trazAt?: string;
        levaDriverId?: string;
        trazDriverId?: string;
        itemIds?: string[];
    }>,
    idempotencyKey?: string
) => {
    logger.info(`[QuoteService] Starting approveAndSchedule for Quote ${id}. Performer: ${performerId || 'None'}. Occurrences: ${occurrences?.length || 'Single'}`);

    let quote: any;
    const result = await prisma.$transaction(async (tx) => {
        // 1. Fetch fresh quote data inside transaction to avoid race conditions
        quote = await tx.quote.findUnique({
            where: { id },
            include: {
                items: true,
                customer: { include: { user: true } },
                pet: true
            }
        });

        if (!quote) throw new HttpError(404, 'Orçamento não encontrado', 'QUOTE_NOT_FOUND');

        // Safety lock: check status again inside transaction
        if (quote.status === 'ENCERRADO') {
            throw new HttpError(409, 'Este orçamento já está encerrado.', 'QUOTE_CLOSED');
        }

        if (!quote.petId && (quote.type === 'SPA' || quote.type === 'SPA_TRANSPORTE' || quote.type === 'TRANSPORTE')) {
            throw new HttpError(409, 'Não é possível agendar: Nenhum pet foi vinculado a este orçamento.', 'MISSING_PET');
        }

        if (occurrences && occurrences.length > 0) {
            const validation = validateOccurrencesForQuote({
                quoteType: quote.type,
                transportType: quote.transportType,
                occurrences
            });
            if (!validation.valid) {
                throw new HttpError(400, 'Erro de validação no agendamento.', 'VALIDATION_ERROR', validation.errors);
            }
        }

        const existingAppointments = await tx.appointment.findMany({ where: { quoteId: id } });
        if (existingAppointments.length > 0) {
            const isIdempotentRecurring = Boolean(occurrences?.length) && (() => {
                const scheduleHash = buildScheduleHash({
                    quoteId: id,
                    quoteType: quote.type,
                    transportType: quote.transportType,
                    performerId,
                    occurrences: occurrences || []
                });
                const scheduleMeta = (quote.metadata as any)?.scheduleIdempotency;
                const hashMatches = scheduleMeta?.hash === scheduleHash;
                const keyMatches = idempotencyKey ? scheduleMeta?.key === idempotencyKey : true;
                return hashMatches && keyMatches;
            })();

            const isIdempotentSingle = !occurrences?.length && quote.status === 'AGENDADO';

            if (isIdempotentRecurring || isIdempotentSingle) {
                logger.info(`[QuoteService] Idempotent approveAndSchedule detected for Quote ${id}. Returning existing appointments.`);
                return existingAppointments;
            }
        }

        // 2. Prevent Duplication: Clear existing appointments if any
        if (existingAppointments.length > 0) {
            logger.info(`[QuoteService] Cleaning up ${existingAppointments.length} existing appointments before re-scheduling.`);
            await tx.appointment.deleteMany({ where: { quoteId: id } });
        }

        // 3. Approve Quote status change
        await tx.quote.update({
            where: { id },
            data: {
                status: 'APROVADO',
                statusHistory: {
                    create: {
                        id: randomUUID(),
                        oldStatus: quote.status,
                        newStatus: 'APROVADO',
                        changedBy: authUser?.id || 'SYSTEM',
                        reason: 'Aprovação e Agendamento Automático (One-Click)'
                    }
                }
            }
        });

        // 2. Create Invoice
        const existingInvoiceForThisQuote = await tx.invoice.findFirst({
            where: { quotes: { some: { id: quote.id } } }
        });

        if (!existingInvoiceForThisQuote) {
            await tx.invoice.create({
                data: {
                    id: randomUUID(),
                    customer: { connect: { id: quote.customerId } },
                    quotes: {
                        connect: [{ id: quote.id }]
                    },
                    amount: quote.totalAmount,
                    status: 'PENDENTE',
                    dueDate: quote.desiredAt || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date()
                }
            });
        }

        const appointments = [];

        // 3. Create Appointments: Recurring or Single
        if (occurrences && occurrences.length > 0) {
            // RECURRING MODE: Create multiple appointments from occurrences
            logger.info(`[QuoteService] Creating ${occurrences.length} recurring appointments`);

            for (let i = 0; i < occurrences.length; i++) {
                const occ = occurrences[i];

                // Create SPA Appointment if applicable
                if (quote.type === 'SPA' || quote.type === 'SPA_TRANSPORTE') {
                    if (!occ.spaAt) {
                        logger.warn(`[QuoteService] Skipping occurrence ${i + 1}: missing spaAt`);
                        continue;
                    }

                    // Determine which services to connect for this specific occurrence
                    let serviceIdsToConnect: string[] = [];

                    if (occ.itemIds && occ.itemIds.length > 0) {
                        // Filter items that match the provided itemIds and have a serviceId
                        // We check both id and description for robustness if id is missing
                        serviceIdsToConnect = quote.items
                            .filter((item: any) => (occ.itemIds!.includes(item.id) || occ.itemIds!.includes(item.description)) && item.serviceId)
                            .map((item: any) => item.serviceId!);
                    } else {
                        // Fallback: use all services from the quote
                        serviceIdsToConnect = quote.items.filter((item: any) => item.serviceId).map((item: any) => item.serviceId!);
                    }

                    // Build servicePricing metadata from quote items
                    const servicePricing = quote.items
                        .filter((item: any) => serviceIdsToConnect.includes(item.serviceId))
                        .map((item: any) => ({
                            serviceId: item.serviceId!,
                            price: parseFloat(item.price.toString()),
                            discount: parseFloat((item.discount || 0).toString()),
                            sourceQuoteItemId: item.id
                        }));

                    const appt = await tx.appointment.create({
                        data: {
                            id: randomUUID(),
                            customer: { connect: { id: quote.customerId } },
                            pet: { connect: { id: quote.petId! } },
                            startAt: new Date(occ.spaAt),
                            status: 'CONFIRMADO',
                            category: 'SPA',
                            quote: { connect: { id } },
                            performer: performerId ? { connect: { id: performerId } } : undefined,
                            services: {
                                connect: serviceIdsToConnect.map(sid => ({ id: sid }))
                            },
                            metadata: { servicePricing }, // Persistir preços do orçamento
                            updatedAt: new Date()
                        } as any
                    });
                    logger.info(`[QuoteService] SPA Appointment ${i + 1}/${occurrences.length} created: ${appt.id} with ${serviceIdsToConnect.length} services`);
                    appointments.push(appt);
                }

                // Create Transport Appointments if applicable
                if (quote.type === 'TRANSPORTE' || quote.type === 'SPA_TRANSPORTE') {
                    // Ensure a Transport service exists to link to these appointments
                    let transportService = await tx.service.findFirst({
                        where: { name: { contains: 'Transporte', mode: 'insensitive' } }
                    });

                    if (!transportService) {
                        transportService = await tx.service.create({
                            data: {
                                name: 'Transporte',
                                description: 'Serviço de transporte automático',
                                duration: 30,
                                basePrice: 0,
                                category: 'LOGISTICA' // Assuming category exists or is string compatible
                            } as any
                        });
                        logger.info(`[QuoteService] Created default Transport service: ${transportService.id}`);
                    }

                    const isRoundTrip = quote.transportType === 'ROUND_TRIP' || (!quote.transportType && quote.type === 'SPA_TRANSPORTE');
                    const legs = await tx.transportLeg.findMany({ where: { quoteId: quote.id } });

                    // LEVA (Pickup)
                    if ((isRoundTrip || quote.transportType === 'PICK_UP') && occ.levaAt && occ.levaDriverId) {
                        const levaLeg = legs.find(l => l.legType === 'LEVA');
                        const snapshotLeva = quote.metadata ? createPartialTransportSnapshot((quote.metadata as any).transportSnapshot, 'LEVA', occurrences.filter((o: any) => o.levaAt).length) : undefined;
                        const levaPrice = snapshotLeva?.transportSnapshot?.totalAmount || 0;

                        const apptLeva = await tx.appointment.create({
                            data: {
                                id: randomUUID(),
                                customer: { connect: { id: quote.customerId } },
                                pet: { connect: { id: quote.petId! } },
                                startAt: new Date(occ.levaAt),
                                status: 'CONFIRMADO',
                                category: 'LOGISTICA',
                                quote: { connect: { id } },
                                performer: { connect: { id: occ.levaDriverId } },
                                services: {
                                    connect: { id: transportService.id }
                                },
                                transportDetails: {
                                    create: {
                                        id: randomUUID(),
                                        origin: quote.transportOrigin || 'Endereço do Cliente',
                                        destination: quote.transportDestination || '7Pet',
                                        requestedPeriod: (quote.transportPeriod || 'MANHA') as any,
                                        type: 'LEVA'
                                    }
                                },
                                updatedAt: new Date(),
                                metadata: {
                                    transportSnapshot: snapshotLeva,
                                    servicePricing: [{
                                        serviceId: transportService.id,
                                        price: levaPrice,
                                        discount: 0,
                                        sourceQuoteItemId: null,
                                        description: 'Transporte (Leva)'
                                    }]
                                }
                            } as any
                        });
                        logger.info(`[QuoteService] LEVA Appointment ${i + 1}/${occurrences.length} created: ${apptLeva.id}`);
                        appointments.push(apptLeva);
                    }

                    // TRAZ (Dropoff)
                    if ((isRoundTrip || quote.transportType === 'DROP_OFF') && occ.trazAt && occ.trazDriverId) {
                        const trazLeg = legs.find(l => l.legType === 'TRAZ');
                        const snapshotTraz = quote.metadata ? createPartialTransportSnapshot((quote.metadata as any).transportSnapshot, 'TRAZ', occurrences.filter((o: any) => o.trazAt).length) : undefined;
                        const trazPrice = snapshotTraz?.transportSnapshot?.totalAmount || 0;

                        const apptTraz = await tx.appointment.create({
                            data: {
                                id: randomUUID(),
                                customer: { connect: { id: quote.customerId } },
                                pet: { connect: { id: quote.petId! } },
                                startAt: new Date(occ.trazAt),
                                status: 'CONFIRMADO',
                                category: 'LOGISTICA',
                                quote: { connect: { id } },
                                performer: { connect: { id: occ.trazDriverId } },
                                services: {
                                    connect: { id: transportService.id }
                                },
                                transportDetails: {
                                    create: {
                                        id: randomUUID(),
                                        origin: quote.transportDestination || '7Pet',
                                        destination: quote.transportReturnAddress || quote.transportOrigin || 'Endereço do Cliente',
                                        requestedPeriod: (quote.transportPeriod || 'TARDE') as any,
                                        type: 'TRAZ'
                                    }
                                },
                                updatedAt: new Date(),
                                metadata: {
                                    transportSnapshot: snapshotTraz,
                                    servicePricing: [{
                                        serviceId: transportService.id,
                                        price: trazPrice,
                                        discount: 0,
                                        sourceQuoteItemId: null,
                                        description: 'Transporte (Traz)'
                                    }]
                                }
                            } as any
                        });
                        logger.info(`[QuoteService] TRAZ Appointment ${i + 1}/${occurrences.length} created: ${apptTraz.id}`);
                        appointments.push(apptTraz);
                    }
                }
            }
        } else {
            // SINGLE MODE: Original logic for non-recurring quotes
            // 3. Create SPA Appointment if applicable
            // Note: No need for idempotency checks since we cleared all appointments above
            if (quote.type === 'SPA' || quote.type === 'SPA_TRANSPORTE') {
                // Build servicePricing metadata from quote items
                const serviceIds = quote.items.filter((i: any) => i.serviceId).map((i: any) => i.serviceId!);
                const servicePricing = quote.items
                    .filter((item: any) => serviceIds.includes(item.serviceId))
                    .map((item: any) => ({
                        serviceId: item.serviceId!,
                        price: parseFloat(item.price.toString()),
                        discount: parseFloat((item.discount || 0).toString()),
                        sourceQuoteItemId: item.id
                    }));

                const appt = await tx.appointment.create({
                    data: {
                        id: randomUUID(),
                        customer: { connect: { id: quote.customerId } },
                        pet: { connect: { id: quote.petId! } },
                        startAt: quote.scheduledAt || quote.desiredAt || new Date(),
                        status: 'CONFIRMADO',
                        category: 'SPA',
                        quote: { connect: { id } },
                        performer: performerId ? { connect: { id: performerId } } : undefined,
                        services: {
                            connect: quote.items.filter((i: any) => i.serviceId).map((i: any) => ({ id: i.serviceId! }))
                        },
                        metadata: { servicePricing }, // Persistir preços do orçamento
                        updatedAt: new Date()
                    } as any
                });
                logger.info(`[QuoteService] SPA Appointment created: ${appt.id}`);
                appointments.push(appt);
            }

            // 4. Create Logistics Appointment if applicable
            if (quote.type === 'TRANSPORTE' || quote.type === 'SPA_TRANSPORTE') {
                // Ensure a Transport service exists
                let transportService = await tx.service.findFirst({
                    where: { name: { contains: 'Transporte', mode: 'insensitive' } }
                });

                if (!transportService) {
                    transportService = await tx.service.create({
                        data: {
                            name: 'Transporte',
                            description: 'Serviço de transporte automático',
                            duration: 30,
                            basePrice: 0,
                            category: 'LOGISTICA'
                        } as any
                    });
                }

                const isRoundTrip = quote.transportType === 'ROUND_TRIP' || (!quote.transportType && quote.type === 'SPA_TRANSPORTE');

                // Fetch legs to get assigned providers
                const legs = await tx.transportLeg.findMany({
                    where: { quoteId: quote.id }
                });

                const levaDriver = legs.find(l => l.legType === 'LEVA')?.providerId || performerId;
                const trazDriver = legs.find(l => l.legType === 'TRAZ')?.providerId || performerId;

                // Get full snapshot
                const fullSnapshot = (quote.metadata as any)?.transportSnapshot;
                const transportType = quote.transportType || (quote.type === 'SPA_TRANSPORTE' ? 'ROUND_TRIP' : 'PICK_UP');

                if (isRoundTrip) {
                    if (!levaDriver) {
                        throw new HttpError(400, 'Motorista da Busca (Leva) é obrigatório.', 'MISSING_DRIVER');
                    }
                    if (!trazDriver) {
                        throw new HttpError(400, 'Motorista da Entrega (Traz) é obrigatório.', 'MISSING_DRIVER');
                    }
                    // Leg 1: LEVA (Pickup) - largada + leva
                    const levaPrice = calculateTransportLegPrice(fullSnapshot, transportType, 'LEVA');

                    const apptLeva = await tx.appointment.create({
                        data: {
                            id: randomUUID(),
                            customer: { connect: { id: quote.customerId } },
                            pet: { connect: { id: quote.petId! } },
                            startAt: quote.transportLevaAt || quote.transportAt || quote.desiredAt || new Date(),
                            status: 'CONFIRMADO',
                            category: 'LOGISTICA',
                            quote: { connect: { id } },
                            performer: levaDriver ? { connect: { id: levaDriver } } : undefined,
                            services: {
                                connect: { id: transportService.id }
                            },
                            transportDetails: {
                                create: {
                                    id: randomUUID(),
                                    origin: quote.transportOrigin || 'Endereço do Cliente',
                                    destination: quote.transportDestination || '7Pet',
                                    requestedPeriod: (quote.transportPeriod || 'MANHA') as any,
                                    type: 'LEVA'
                                }
                            },
                            updatedAt: new Date(),
                            metadata: {
                                transportSnapshot: fullSnapshot,
                                servicePricing: [{
                                    serviceId: transportService.id,
                                    price: levaPrice,
                                    discount: 0,
                                    sourceQuoteItemId: null,
                                    description: 'Transporte (Leva)'
                                }]
                            }
                        } as any
                    });
                    logger.info(`[QuoteService] Logistics "LEVA" Appointment created: ${apptLeva.id} assigned to ${levaDriver || 'None'}`);
                    appointments.push(apptLeva);

                    // Leg 2: TRAZ (Return) - traz + retorno
                    const returnTime = quote.transportTrazAt || new Date((quote.scheduledAt || quote.desiredAt || new Date()).getTime() + 4 * 60 * 60 * 1000);
                    const trazPrice = calculateTransportLegPrice(fullSnapshot, transportType, 'TRAZ');

                    const apptTraz = await tx.appointment.create({
                        data: {
                            id: randomUUID(),
                            customer: { connect: { id: quote.customerId } },
                            pet: { connect: { id: quote.petId! } },
                            startAt: returnTime,
                            status: 'CONFIRMADO',
                            category: 'LOGISTICA',
                            quote: { connect: { id } },
                            performer: trazDriver ? { connect: { id: trazDriver } } : undefined,
                            services: {
                                connect: { id: transportService.id }
                            },
                            transportDetails: {
                                create: {
                                    id: randomUUID(),
                                    origin: quote.transportDestination || '7Pet',
                                    destination: quote.transportReturnAddress || quote.transportOrigin || 'Endereço do Cliente',
                                    requestedPeriod: (quote.transportPeriod || 'TARDE') as any,
                                    type: 'TRAZ'
                                }
                            },
                            updatedAt: new Date(),
                            metadata: {
                                servicePricing: [{
                                    serviceId: transportService.id,
                                    price: trazPrice,
                                    discount: 0,
                                    sourceQuoteItemId: null,
                                    description: 'Transporte (Traz)'
                                }]
                            }
                        } as any
                    });
                    logger.info(`[QuoteService] Logistics "TRAZ" Appointment created: ${apptTraz.id} assigned to ${trazDriver || 'None'}`);
                    appointments.push(apptTraz);
                } else {
                    // One way (Single appointment) - Só Leva or Só Traz
                    const legType = quote.transportType === 'DROP_OFF' ? 'TRAZ' : 'LEVA';
                    const driver = legType === 'LEVA' ? levaDriver : trazDriver;
                    if (!driver) {
                        throw new HttpError(400, `Motorista da ${legType === 'LEVA' ? 'Busca' : 'Entrega'} é obrigatório.`, 'MISSING_DRIVER');
                    }
                    const oneWayPrice = calculateTransportLegPrice(fullSnapshot, quote.transportType || 'PICK_UP', legType);

                    const apptOneWay = await tx.appointment.create({
                        data: {
                            id: randomUUID(),
                            customer: { connect: { id: quote.customerId } },
                            pet: { connect: { id: quote.petId! } },
                            startAt: quote.transportAt || quote.desiredAt || new Date(),
                            status: 'CONFIRMADO',
                            category: 'LOGISTICA',
                            quote: { connect: { id } },
                            performer: driver ? { connect: { id: driver } } : undefined,
                            services: {
                                connect: { id: transportService.id }
                            },
                            transportDetails: {
                                create: {
                                    id: randomUUID(),
                                    origin: quote.transportOrigin || 'Endereço do Cliente',
                                    destination: quote.transportDestination || '7Pet',
                                    requestedPeriod: (quote.transportPeriod || 'MANHA') as any,
                                    type: legType
                                }
                            },
                            updatedAt: new Date(),
                            metadata: {
                                transportSnapshot: fullSnapshot,
                                servicePricing: [{
                                    serviceId: transportService.id,
                                    price: oneWayPrice,
                                    discount: 0,
                                    sourceQuoteItemId: null,
                                    description: `Transporte (${legType})`
                                }]
                            }
                        } as any
                    });
                    appointments.push(apptOneWay);
                }
            }

        }

        const scheduleHash = occurrences?.length
            ? buildScheduleHash({
                quoteId: id,
                quoteType: quote.type,
                transportType: quote.transportType,
                performerId,
                occurrences
            })
            : undefined;

        const nextMetadata = scheduleHash ? mergeMetadata(quote.metadata, {
            scheduleIdempotency: {
                key: idempotencyKey || null,
                hash: scheduleHash,
                requestedBy: authUser?.id || 'SYSTEM',
                requestedAt: new Date().toISOString(),
                mode: 'approveAndSchedule'
            }
        }) : quote.metadata;

        await tx.quote.update({
            where: { id: quote.id },
            data: {
                status: 'AGENDADO',
                metadata: nextMetadata as any
            }
        });

        // 6. Audit Log
        await createAuditLog({
            entityType: 'QUOTE',
            entityId: id,
            action: 'APPROVE',
            performedBy: authUser?.id || 'SYSTEM',
            reason: 'Aprovação e Agendamento via One-Click'
        }, tx);

        return appointments;
    }, {
        maxWait: 20000,
        timeout: 120000 // 2 minutes for complex multi-occurrence schedules
    });

    // 6. Notifications
    if (quote.customer.user) {
        await messagingService.notifyUser(
            quote.customer.user.id,
            'Orçamento Aprovado e Agendado!',
            `Olá ${quote.customer.name}! Seu orçamento para o pet ${quote.pet?.name} foi aprovado e acabamos de confirmar os agendamentos no sistema. Você pode conferir os detalhes no seu painel.`,
            'APPOINTMENT_CONFIRMED'
        );
    }

    return result;
};

/**
 * Advanced Scheduling (Wizard/Recurrence)
 */
export const scheduleQuote = async (id: string, data: { occurrences: any[]; idempotencyKey?: string }, authUser: any) => {
    const { occurrences, idempotencyKey } = data;

    if (!occurrences || occurrences.length === 0) {
        throw new HttpError(400, 'Nenhuma ocorrência fornecida para agendamento.', 'EMPTY_OCCURRENCES');
    }

    logger.info(`[QuoteService] Starting scheduleQuote for Quote ${id} with ${occurrences.length} occurrences.`);

    let quote: any;
    const result = await prisma.$transaction(async (tx) => {
        // 1. Fetch fresh data inside TX
        quote = await tx.quote.findUnique({
            where: { id },
            include: {
                items: true,
                customer: { include: { user: true } },
                pet: true
            }
        });

        if (!quote) throw new HttpError(404, 'Orçamento não encontrado', 'QUOTE_NOT_FOUND');

        if (quote.status === 'ENCERRADO') {
            throw new HttpError(409, 'Este orçamento já está encerrado.', 'QUOTE_CLOSED');
        }

        if (!quote.petId && (quote.type === 'SPA' || quote.type === 'SPA_TRANSPORTE' || quote.type === 'TRANSPORTE')) {
            throw new HttpError(409, 'Não é possível agendar: Nenhum pet foi vinculado a este orçamento.', 'MISSING_PET');
        }

        const validation = validateOccurrencesForQuote({
            quoteType: quote.type,
            transportType: quote.transportType,
            occurrences
        });
        if (!validation.valid) {
            throw new HttpError(400, 'Erro de validação no agendamento.', 'VALIDATION_ERROR', validation.errors);
        }

        const scheduleHash = buildScheduleHash({
            quoteId: id,
            quoteType: quote.type,
            transportType: quote.transportType,
            occurrences
        });

        const existingAppointments = await tx.appointment.findMany({ where: { quoteId: id } });
        if (existingAppointments.length > 0) {
            const scheduleMeta = (quote.metadata as any)?.scheduleIdempotency;
            const hashMatches = scheduleMeta?.hash === scheduleHash;
            const keyMatches = idempotencyKey ? scheduleMeta?.key === idempotencyKey : true;
            if (hashMatches && keyMatches) {
                logger.info(`[QuoteService] Idempotent scheduleQuote detected for Quote ${id}. Returning existing appointments.`);
                return existingAppointments;
            }
        }

        // 2. Prevent Duplication: Clear existing appointments if any
        if (existingAppointments.length > 0) {
            logger.info(`[QuoteService] Cleaning up ${existingAppointments.length} existing appointments before re-scheduling.`);
            await tx.appointment.deleteMany({ where: { quoteId: id } });
        }

        const nextMetadata = mergeMetadata(quote.metadata, {
            scheduleIdempotency: {
                key: idempotencyKey || null,
                hash: scheduleHash,
                requestedBy: authUser?.id || 'SYSTEM',
                requestedAt: new Date().toISOString(),
                mode: 'wizard'
            }
        });

        // 3. Update Quote Status
        await tx.quote.update({
            where: { id },
            data: {
                status: 'AGENDADO',
                metadata: nextMetadata as any,
                statusHistory: {
                    create: {
                        id: randomUUID(),
                        oldStatus: quote.status,
                        newStatus: 'AGENDADO',
                        changedBy: authUser?.id || 'SYSTEM',
                        reason: 'Agendamento via Wizard (Recorrência/Avulso)'
                    }
                }
            }
        });

        // 4. Validation Loop
        occurrences.forEach((occ, idx) => {
            const rowNum = idx + 1;

            if ((quote.type === 'SPA' || quote.type === 'SPA_TRANSPORTE') && !occ.spaAt) {
                throw new HttpError(400, `Linha ${rowNum}: Data do SPA é obrigatória.`, 'VALIDATION_ERROR');
            }

            if (quote.type === 'TRANSPORTE' || quote.type === 'SPA_TRANSPORTE') {
                const isRoundTrip = quote.transportType === 'ROUND_TRIP' || (!quote.transportType && quote.type === 'SPA_TRANSPORTE');
                const isPickup = quote.transportType === 'PICK_UP';
                const isDropoff = quote.transportType === 'DROP_OFF';

                if (isRoundTrip || isPickup) {
                    if (!occ.levaAt) throw new HttpError(400, `Linha ${rowNum}: Horário de Busca (Leva) é obrigatória.`, 'VALIDATION_ERROR');
                    if (!occ.levaDriverId) throw new HttpError(400, `Linha ${rowNum}: Motorista da Busca é obrigatório.`, 'VALIDATION_ERROR');
                }

                if (isRoundTrip || isDropoff) {
                    if (!occ.trazAt) throw new HttpError(400, `Linha ${rowNum}: Horário de Entrega (Traz) é obrigatório.`, 'VALIDATION_ERROR');
                    if (!occ.trazDriverId) throw new HttpError(400, `Linha ${rowNum}: Motorista da Entrega é obrigatório.`, 'VALIDATION_ERROR');
                }
            }
        });

        // 5. Create Invoice if needed
        const existingInvoiceForThisQuote = await tx.invoice.findFirst({
            where: { quotes: { some: { id: quote.id } } }
        });

        if (!existingInvoiceForThisQuote) {
            await tx.invoice.create({
                data: {
                    id: randomUUID(),
                    customer: { connect: { id: quote.customerId } },
                    quotes: {
                        connect: [{ id: quote.id }]
                    },
                    amount: quote.totalAmount,
                    status: 'PENDENTE',
                    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date()
                }
            });
        }

        const createdAppointments = [];

        // 4. Create Appointments for each Occurence
        for (const occ of occurrences) {

            // --- SPA ---
            // Note: No idempotency check needed since we cleared all appointments above
            if ((quote.type === 'SPA' || quote.type === 'SPA_TRANSPORTE') && occ.spaAt) {
                const appt = await tx.appointment.create({
                    data: {
                        id: randomUUID(),
                        customer: { connect: { id: quote.customerId } },
                        pet: { connect: { id: quote.petId! } },
                        startAt: new Date(occ.spaAt),
                        status: 'CONFIRMADO',
                        category: 'SPA',
                        quote: { connect: { id } },
                        performer: quote.items.find((i: any) => i.performerId)?.performerId
                            ? { connect: { id: quote.items.find((i: any) => i.performerId)?.performerId! } }
                            : undefined,
                        services: {
                            connect: quote.items.filter((i: any) => i.serviceId).map((i: any) => ({ id: i.serviceId! }))
                        },
                        updatedAt: new Date()
                    } as any
                });
                createdAppointments.push(appt);
            }

            // --- TRANSPORT ---
            if (quote.type === 'TRANSPORTE' || quote.type === 'SPA_TRANSPORTE') {
                const isRoundTrip = quote.transportType === 'ROUND_TRIP' || (!quote.transportType && quote.type === 'SPA_TRANSPORTE');
                const isPickup = quote.transportType === 'PICK_UP';
                const isDropoff = quote.transportType === 'DROP_OFF';

                // LEVA (Pickup)
                // Note: No idempotency check needed since we cleared all appointments above
                if ((isRoundTrip || isPickup) && occ.levaAt && occ.levaDriverId) {
                    const apptLeva = await tx.appointment.create({
                        data: {
                            id: randomUUID(),
                            customer: { connect: { id: quote.customerId } },
                            pet: { connect: { id: quote.petId! } },
                            startAt: new Date(occ.levaAt),
                            status: 'CONFIRMADO',
                            category: 'LOGISTICA',
                            quote: { connect: { id } },
                            performer: { connect: { id: occ.levaDriverId } },
                            transportDetails: {
                                create: {
                                    id: randomUUID(),
                                    origin: quote.transportOrigin || 'Endereço do Cliente',
                                    destination: quote.transportDestination || '7Pet',
                                    requestedPeriod: (quote.transportPeriod || 'MANHA') as any,
                                    type: 'LEVA'
                                }
                            },
                            updatedAt: new Date(),
                            metadata: quote.metadata ? { transportSnapshot: (quote.metadata as any).transportSnapshot } : undefined,
                            transportSnapshotId: quote.activeSnapshotId || undefined
                        } as any
                    });
                    createdAppointments.push(apptLeva);
                }

                // TRAZ (Return)
                // Note: No idempotency check needed since we cleared all appointments above
                if ((isRoundTrip || isDropoff) && occ.trazAt && occ.trazDriverId) {
                    const apptTraz = await tx.appointment.create({
                        data: {
                            id: randomUUID(),
                            customer: { connect: { id: quote.customerId } },
                            pet: { connect: { id: quote.petId! } },
                            startAt: new Date(occ.trazAt),
                            status: 'CONFIRMADO',
                            category: 'LOGISTICA', // Separate entity
                            quote: { connect: { id } },
                            performer: { connect: { id: occ.trazDriverId } }, // Mandatory Driver
                            transportDetails: {
                                create: {
                                    id: randomUUID(),
                                    origin: quote.transportDestination || '7Pet',
                                    destination: quote.transportReturnAddress || quote.transportOrigin || 'Endereço do Cliente',
                                    requestedPeriod: (quote.transportPeriod || 'TARDE') as any,
                                    type: 'TRAZ'
                                }
                            },
                            updatedAt: new Date(),
                            metadata: quote.metadata ? { transportSnapshot: (quote.metadata as any).transportSnapshot } : undefined,
                            transportSnapshotId: quote.activeSnapshotId || undefined
                        } as any
                    });
                    createdAppointments.push(apptTraz);
                }
            }
        }

        // 5. Audit Log
        await createAuditLog({
            entityType: 'QUOTE',
            entityId: id,
            action: 'APPROVE',
            performedBy: authUser?.id || 'SYSTEM',
            reason: `Agendamento em Lote (${occurrences.length} ocorrências)`
        }, tx);

        return createdAppointments;
    }, {
        maxWait: 20000,
        timeout: 120000 // 2 minutes for complex multi-occurrence schedules
    });

    // 6. Notifications
    if (quote.customer.user) {
        await messagingService.notifyUser(
            quote.customer.user.id,
            'Agendamentos Confirmados!',
            `Seus agendamentos para ${quote.pet?.name} foram confirmados. Consulte o app.`,
            'APPOINTMENT_CONFIRMED'
        );
    }

    return result;
};

/**
 * Undo Scheduling: Delete all appointments and revert quote status
 */
export const undoSchedule = async (id: string, reason: string, authUser: any) => {
    const result = await prisma.$transaction(async (tx) => {
        // 1. Fetch fresh quote with appointments inside TX
        const quote = await tx.quote.findUnique({
            where: { id },
            include: {
                appointments: true
            }
        });

        if (!quote) throw new HttpError(404, 'Orçamento não encontrado', 'QUOTE_NOT_FOUND');

        // We only allow undoing if it's currently AGENDADO
        if (quote.status !== 'AGENDADO') {
            throw new HttpError(409, 'Apenas orçamentos com status AGENDADO podem ter o agendamento desfeito.', 'INVALID_STATUS');
        }

        logger.info(`[QuoteService] Undoing schedule for Quote ${id}. Appointments count: ${quote.appointments.length}`);

        // 2. Delete all appointments linked to this quote
        if (quote.appointments.length > 0) {
            await tx.appointment.deleteMany({
                where: { quoteId: id }
            });
        }

        // 3. Revert Quote Status to APROVADO
        const updatedQuote = await tx.quote.update({
            where: { id },
            data: {
                status: 'APROVADO',
                statusHistory: {
                    create: {
                        id: randomUUID(),
                        oldStatus: 'AGENDADO',
                        newStatus: 'APROVADO',
                        changedBy: authUser?.id || 'SYSTEM',
                        reason: `Agendamento Desfeito: ${reason}`
                    }
                }
            }
        });

        // 3. Audit Log
        await createAuditLog({
            entityType: 'QUOTE',
            entityId: id,
            action: 'UPDATE',
            performedBy: authUser?.id || 'SYSTEM',
            reason: `Agendamento Desfeito. Justificativa: ${reason}`
        }, tx);

        return updatedQuote;
    });

    return result;
};

/**
 * List active recurring quotes for a customer
 * Defined as quotes with status AGENDADO or APROVADO that have multiple appointments linked
 * or are explicitly marked as recurring (future implementation)
 */
export const listRecurringQuotes = async (customerId: string) => {
    // 1. Find quotes that are active and have appointments
    const quotes = await prisma.quote.findMany({
        where: {
            customerId,
            status: { in: ['AGENDADO', 'APROVADO'] },
            deletedAt: null,
            // We want quotes that generated appointments
            appointments: {
                some: {
                    deletedAt: null,
                    status: { not: 'CANCELADO' }
                }
            }
        },
        include: {
            appointments: {
                where: {
                    deletedAt: null,
                    status: { not: 'CANCELADO' }
                },
                orderBy: { startAt: 'asc' },
                include: {
                    services: true
                }
            },
            items: true,
            invoice: true
        },
        orderBy: { createdAt: 'desc' }
    });

    // 2. Filter Client-Side to ensure they look like "Packages"
    // Criteria: Has at least 2 future appointments OR has > 2 total appointments
    // This heuristic helps differentiate single visits from packages/subscriptions
    return quotes.filter(q => {
        const totalApps = q.appointments.length;
        const futureApps = q.appointments.filter(a => a.startAt && new Date(a.startAt) > new Date()).length;

        // It's a recurring package if:
        // - It has many total appointments (e.g. > 1)
        // - OR it has future appointments scheduled
        return totalApps > 1 || (totalApps === 1 && futureApps === 1);
    });
};
