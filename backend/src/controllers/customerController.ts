import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import * as auditService from '../services/auditService';
import * as customerService from '../services/customerService';

const customerSchema = z.object({
    firstName: z.string().min(1, 'Primeiro nome é obrigatório').optional().nullable(),
    lastName: z.string().optional().nullable(),
    name: z.string().min(1, 'Nome é obrigatório').optional().nullable(),
    phone: z.string().optional().nullable(),
    extraPhones: z.array(z.string()).optional().nullable(),
    address: z.string().optional().nullable(),
    extraAddresses: z.array(z.string()).optional().nullable(),
    type: z.enum(['AVULSO', 'RECORRENTE']).optional(),
    recurringFrequency: z.enum(['SEMANAL', 'QUINZENAL', 'MENSAL']).optional().nullable(),
    recurrenceDiscount: z.number().optional().nullable(),
    recurrenceFrequency: z.enum(['SEMANAL', 'QUINZENAL', 'MENSAL']).optional().nullable(),
    internalNotes: z.string().optional().nullable(),
    email: z.string().email('Email inválido').optional().nullable(),
    extraEmails: z.array(z.string()).optional().nullable(),
    birthday: z.string().optional().nullable(),
    document: z.string().optional().nullable(),
    discoverySource: z.string().optional().nullable(),
    communicationPrefs: z.array(z.string()).optional().nullable(),
    communicationOther: z.string().optional().nullable(),
    additionalGuardians: z.array(z.any()).optional().nullable(),
    requiresPrepayment: z.boolean().optional().nullable(),
    isBlocked: z.boolean().optional().nullable(),
    discountPercentage: z.number().optional().nullable(), // Legacy field
    secondaryGuardianName: z.string().optional().nullable(),
    secondaryGuardianPhone: z.string().optional().nullable(),
    secondaryGuardianEmail: z.string().optional().nullable(),
    secondaryGuardianAddress: z.string().optional().nullable(),
    // Migration fields from Bitrix24
    legacyBitrixId: z.string().optional().nullable(),
    cpf: z.string().optional().nullable(),
    billingPreference: z.string().optional().nullable(),
    billingOther: z.string().optional().nullable(),
    paymentMethod: z.string().optional().nullable(),
    legacyCreatedAt: z.string().optional().nullable(), // Will be converted to Date
    legacySource: z.string().optional().nullable(),
    negotiationDiscount: z.number().optional().nullable(),
    isActive: z.boolean().optional().nullable(),
    secondaryGuardianBirthday: z.string().optional().nullable(), // Will be converted to Date
    discoverySourceDetail: z.string().optional().nullable(),
}).passthrough(); // Allow additional fields

export const customerController = {
    async search(req: Request, res: Response) {
        try {
            const { q } = req.query;
            console.log(`[Customer Search] Iniciando busca com termo: "${q}"`);

            if (!q || typeof q !== 'string') {
                console.log('[Customer Search] Termo inválido ou vazio');
                return res.json([]);
            }

            const customers = await prisma.customer.findMany({
                where: {
                    deletedAt: null,
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { phone: { contains: q, mode: 'insensitive' } },
                        { legacyBitrixId: { contains: q, mode: 'insensitive' } },
                        { user: { email: { contains: q, mode: 'insensitive' } } }
                    ]
                },
                include: {
                    user: {
                        select: {
                            email: true,
                            phone: true,
                            firstName: true,
                            lastName: true,
                            address: true,
                        }
                    },
                    pets: true
                },
                take: 10
            });

            if (!customers) return res.json([]);

            return res.json(customers);
        } catch (error: any) {
            console.error('CRITICAL: Erro ao buscar clientes:', error);
            // Don't crash the server, just return an error response
            return res.status(500).json({
                error: 'Erro interno ao buscar clientes',
                details: error.message
            });
        }
    },

    async getMe(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const customer = await prisma.customer.findUnique({
                where: { userId },
                include: {
                    user: {
                        select: {
                            email: true,
                            role: true,
                            seqId: true,
                            firstName: true,
                            lastName: true,
                            extraEmails: true,
                            phone: true,
                            extraPhones: true,
                            address: true,
                            extraAddresses: true,
                            birthday: true,
                            document: true
                        }
                    },
                    pets: true,
                    _count: {
                        select: { appointments: true, quotes: true, invoices: true }
                    }
                }
            });

            if (!customer) {
                return res.status(404).json({ error: 'Perfil de cliente não encontrado' });
            }

            return res.json(customer);
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async requestRecurrence(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            const customer = await prisma.customer.findUnique({
                where: { userId },
                include: { user: { select: { firstName: true, lastName: true, email: true, seqId: true } } }
            });

            if (!customer) {
                return res.status(404).json({ error: 'Cliente não encontrado' });
            }

            if (customer.type === 'RECORRENTE') {
                return res.status(400).json({ error: 'Cliente já é recorrente' });
            }

            // Get all staff users to notify
            const staffUsers = await prisma.user.findMany({
                where: {
                    role: { in: ['OPERACIONAL', 'GESTAO', 'ADMIN'] }
                },
                select: { id: true }
            });

            // Create notifications for all staff
            const notifications = staffUsers.map(staff => ({
                userId: staff.id,
                type: 'RECURRENCE_REQUEST' as any,
                title: 'Nova Solicitação de Recorrência',
                message: `${customer.user.firstName || 'Cliente'} ${customer.user.lastName || ''} (ID-${String(customer.user.seqId).padStart(4, '0')}) solicitou mudança para cliente recorrente.`,
                relatedId: customer.id,
                priority: 'MEDIUM' as any
            }));

            await prisma.notification.createMany({
                data: notifications
            });

            // Add to customer's internal notes
            const currentNotes = customer.internalNotes || '';
            const newNote = `\n[${new Date().toLocaleString('pt-BR')}] Cliente solicitou mudança para recorrente.`;

            await prisma.customer.update({
                where: { id: customer.id },
                data: {
                    internalNotes: currentNotes + newNote
                }
            });

            return res.json({
                success: true,
                message: 'Solicitação registrada com sucesso! Nossa equipe entrará em contato em breve.'
            });
        } catch (error) {
            console.error('Erro ao processar solicitação de recorrência:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async list(req: Request, res: Response) {
        try {
            //Pagination
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
            const skip = (page - 1) * limit;

            const where = { deletedAt: null };
            const total = await prisma.customer.count({ where });

            const customers = await prisma.customer.findMany({
                where,
                include: {
                    user: {
                        select: {
                            email: true,
                            role: true,
                            seqId: true,
                            firstName: true,
                            lastName: true,
                            phone: true
                        }
                    },
                    pets: true,
                    _count: {
                        select: { appointments: true, quotes: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            });

            return res.json({
                data: customers,
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
            console.error('CRITICAL ERROR listing customers:', error);
            return res.status(500).json({
                error: 'Erro interno do servidor ao listar clientes',
                message: error.message,
                prismaError: error.code
            });
        }
    },

    async get(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const customer = await prisma.customer.findUnique({
                where: { id },
                include: {
                    user: {
                        select: {
                            email: true,
                            seqId: true,
                            firstName: true,
                            lastName: true,
                            extraEmails: true,
                            phone: true,
                            extraPhones: true,
                            address: true,
                            extraAddresses: true,
                            birthday: true,
                            document: true
                        }
                    },
                    pets: true,
                    appointments: {
                        where: { deletedAt: null },
                        orderBy: { startAt: 'desc' },
                        take: 50
                    },
                    quotes: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: 'desc' },
                        include: { items: true },
                        take: 50
                    },
                    invoices: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: 'desc' },
                        take: 50
                    }
                }
            });

            if (!customer) {
                return res.status(404).json({ error: 'Cliente não encontrado' });
            }

            return res.json(customer);
        } catch (error: any) {
            console.error('CRITICAL ERROR fetching customer:', error);
            return res.status(500).json({
                error: 'Erro interno do servidor ao carregar perfil',
                message: error.message,
                prismaError: error.code // Prisma error code if available
            });
        }
    },

    async create(req: Request, res: Response) {
        try {
            // Clean empty strings and convert to null/undefined
            const cleanData = (obj: any) => {
                const cleaned: any = {};
                for (const key in obj) {
                    const value = obj[key];
                    if (value === '' || value === 'null' || value === 'undefined') {
                        cleaned[key] = null;
                    } else if (Array.isArray(value)) {
                        cleaned[key] = value.filter(v => v !== '' && v !== null);
                    } else {
                        cleaned[key] = value;
                    }
                }
                return cleaned;
            };

            const cleanedBody = cleanData(req.body);
            const data = customerSchema.parse(cleanedBody);

            if (!data.email) {
                return res.status(400).json({ error: 'Email é obrigatório para novo cadastro.' });
            }

            const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
            if (existingUser) {
                return res.status(400).json({ error: 'Email já cadastrado.' });
            }

            const result = await prisma.$transaction(async (tx) => {
                const fullName = data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : (data.name || '');

                const user = await tx.user.create({
                    data: {
                        email: data.email!,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        name: fullName,
                        phone: data.phone,
                        extraPhones: data.extraPhones || [],
                        extraEmails: data.extraEmails || [],
                        address: data.address,
                        extraAddresses: data.extraAddresses || [],
                        birthday: data.birthday ? new Date(data.birthday) : null,
                        document: data.document,
                        role: 'CLIENTE',
                    }
                });

                // Note: Password should be set via authController, not here
                // Removed invalid password field update

                const customer = await tx.customer.create({
                    data: {
                        userId: user.id,
                        name: fullName,
                        phone: data.phone,
                        address: data.address,
                        type: 'AVULSO', // Always start as AVULSO - staff can change later
                        recurrenceFrequency: null,
                        recurrenceDiscount: 0,
                        discoverySource: data.discoverySource,
                        communicationPrefs: data.communicationPrefs || [],
                        communicationOther: data.communicationOther || undefined,
                        additionalGuardians: data.additionalGuardians || [],
                        internalNotes: data.internalNotes,
                        requiresPrepayment: data.requiresPrepayment ?? false,
                        isBlocked: data.isBlocked ?? false,
                    }
                });

                // Create audit log
                await auditService.logEvent((req as any).audit, {
                    targetType: 'CLIENT',
                    targetId: customer.id,
                    clientId: customer.id,
                    action: 'CLIENT_CREATED',
                    summary: `Cliente ${customer.name} criado pela equipe`,
                    after: customer,
                    revertible: false
                }, tx);

                return customer;
            });

            return res.status(201).json(result);

        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ errors: error.issues });
            }
            console.error('Erro ao criar cliente:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Clean empty strings and convert to null/undefined
            const cleanData = (obj: any) => {
                const cleaned: any = {};
                for (const key in obj) {
                    const value = obj[key];
                    // Skip empty strings, convert to null
                    if (value === '' || value === 'null' || value === 'undefined') {
                        cleaned[key] = null;
                    } else if (Array.isArray(value)) {
                        // Clean arrays - remove empty strings
                        cleaned[key] = value.filter(v => v !== '' && v !== null);
                    } else {
                        cleaned[key] = value;
                    }
                }
                return cleaned;
            };

            const cleanedBody = cleanData(req.body);

            // Log the incoming data for debugging
            console.log('Updating customer with data:', JSON.stringify(cleanedBody, null, 2));

            let data;
            try {
                data = customerSchema.partial().parse(cleanedBody);
            } catch (validationError) {
                if (validationError instanceof z.ZodError) {
                    console.error('Validation errors:', validationError.issues);
                    return res.status(400).json({
                        error: 'Dados inválidos',
                        details: validationError.issues.map(issue => ({
                            field: issue.path.join('.'),
                            message: issue.message,
                            received: issue.code === 'invalid_type' ? (issue as any).received : undefined
                        }))
                    });
                }
                throw validationError;
            }

            const performedBy = (req as any).user.id;

            const customerBefore = await prisma.customer.findUnique({
                where: { id },
                include: { user: true }
            });

            if (!customerBefore) {
                return res.status(404).json({ error: 'Cliente não encontrado' });
            }

            const fullName = data.firstName && data.lastName
                ? `${data.firstName} ${data.lastName}`
                : (data.name || customerBefore.name);

            const updatedCustomer = await prisma.$transaction(async (tx) => {
                // Update User if user-related fields are provided
                const userUpdateData: any = {};

                if (data.email !== undefined) userUpdateData.email = data.email;
                if (data.firstName !== undefined) userUpdateData.firstName = data.firstName;
                if (data.lastName !== undefined) userUpdateData.lastName = data.lastName;
                if (fullName) userUpdateData.name = fullName;
                if (data.phone !== undefined) userUpdateData.phone = data.phone;
                if (data.extraPhones !== undefined) userUpdateData.extraPhones = data.extraPhones;
                if (data.extraEmails !== undefined) userUpdateData.extraEmails = data.extraEmails;
                if (data.address !== undefined) userUpdateData.address = data.address;
                if (data.extraAddresses !== undefined) userUpdateData.extraAddresses = data.extraAddresses;
                if (data.birthday !== undefined) {
                    userUpdateData.birthday = data.birthday ? new Date(data.birthday) : null;
                }
                if (data.document !== undefined) userUpdateData.document = data.document;

                // Only update if there are changes
                if (Object.keys(userUpdateData).length > 0) {
                    await tx.user.update({
                        where: { id: customerBefore.userId },
                        data: userUpdateData
                    });
                }

                // Update Customer
                const customerUpdateData: any = {};

                if (fullName) customerUpdateData.name = fullName;
                if (data.phone !== undefined) customerUpdateData.phone = data.phone;
                if (data.address !== undefined) customerUpdateData.address = data.address;
                if (data.type !== undefined) customerUpdateData.type = data.type;
                if (data.recurrenceFrequency !== undefined) {
                    customerUpdateData.recurrenceFrequency = data.recurrenceFrequency;
                }
                if (data.recurrenceDiscount !== undefined) {
                    customerUpdateData.recurrenceDiscount = data.recurrenceDiscount;
                }
                if (data.discoverySource !== undefined) {
                    customerUpdateData.discoverySource = data.discoverySource;
                }
                if (data.communicationPrefs !== undefined) {
                    customerUpdateData.communicationPrefs = data.communicationPrefs;
                }
                if (data.communicationOther !== undefined) {
                    customerUpdateData.communicationOther = data.communicationOther;
                }
                if (data.additionalGuardians !== undefined) {
                    customerUpdateData.additionalGuardians = data.additionalGuardians;
                }
                if (data.internalNotes !== undefined) {
                    customerUpdateData.internalNotes = data.internalNotes;
                }
                if (data.requiresPrepayment !== undefined) {
                    customerUpdateData.requiresPrepayment = data.requiresPrepayment;
                }
                if (data.isBlocked !== undefined) {
                    customerUpdateData.isBlocked = data.isBlocked;
                }
                if (cleanedBody.riskLevel !== undefined) {
                    customerUpdateData.riskLevel = cleanedBody.riskLevel;
                }

                // Migration fields
                if (data.legacyBitrixId !== undefined) customerUpdateData.legacyBitrixId = data.legacyBitrixId;
                if (data.cpf !== undefined) customerUpdateData.cpf = data.cpf;
                if (data.billingPreference !== undefined) customerUpdateData.billingPreference = data.billingPreference;
                if (data.billingOther !== undefined) customerUpdateData.billingOther = data.billingOther;
                if (data.paymentMethod !== undefined) customerUpdateData.paymentMethod = data.paymentMethod;
                if (data.legacySource !== undefined) customerUpdateData.legacySource = data.legacySource;
                if (data.negotiationDiscount !== undefined) customerUpdateData.negotiationDiscount = data.negotiationDiscount;
                if (data.isActive !== undefined) customerUpdateData.isActive = data.isActive ?? true;
                if (data.discoverySourceDetail !== undefined) customerUpdateData.discoverySourceDetail = data.discoverySourceDetail;

                if (data.legacyCreatedAt !== undefined) {
                    customerUpdateData.legacyCreatedAt = data.legacyCreatedAt ? new Date(data.legacyCreatedAt) : null;
                }
                if (data.secondaryGuardianBirthday !== undefined) {
                    customerUpdateData.secondaryGuardianBirthday = data.secondaryGuardianBirthday ? new Date(data.secondaryGuardianBirthday) : null;
                }

                const updated = await tx.customer.update({
                    where: { id },
                    data: customerUpdateData
                });

                // Create audit log using specific helper
                await auditService.logClientUpdated(
                    (req as any).audit,
                    id,
                    customerBefore,
                    updated,
                    tx
                );

                return updated;
            });

            console.log('Customer updated successfully:', updatedCustomer.id);
            return res.json(updatedCustomer);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error('Zod validation error:', error.issues);
                return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
            }
            console.error('Erro ao atualizar cliente:', error);
            return res.status(500).json({
                error: 'Erro interno do servidor',
                details: (error as Error).message,
                stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
            });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await customerService.remove(id);
            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async bulkDelete(req: Request, res: Response) {
        try {
            const { ids } = req.body;
            await customerService.bulkDelete(ids);
            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir clientes em massa:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async listTrash(req: Request, res: Response) {
        try {
            const trash = await customerService.listTrash();
            return res.json(trash);
        } catch (error) {
            console.error('Erro ao listar lixeira:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async restore(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await customerService.restore(id);
            return res.status(200).json({ message: 'Cliente restaurado com sucesso' });
        } catch (error) {
            console.error('Erro ao restaurar cliente:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async bulkRestore(req: Request, res: Response) {
        try {
            const { ids } = req.body;
            await customerService.bulkRestore(ids);
            return res.status(200).json({ message: 'Clientes restaurados com sucesso' });
        } catch (error) {
            console.error('Erro ao restaurar clientes:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async permanentRemove(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await customerService.permanentRemove(id);
            return res.status(204).send();
        } catch (error: any) {
            console.error('Erro ao excluir permanentemente:', error);
            return res.status(400).json({ error: error.message || 'Erro interno do servidor' });
        }
    },

    async createPet(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = req.body;

            if (!data.name || !data.species) {
                return res.status(400).json({ error: 'Nome e Espécie são obrigatórios' });
            }

            const pet = await prisma.pet.create({
                data: {
                    name: data.name,
                    species: data.species,
                    breed: data.breed,
                    weight: data.weight ? parseFloat(data.weight) : undefined,
                    observations: data.observations,
                    coatType: data.coatType,
                    healthIssues: data.healthIssues,
                    allergies: data.allergies,
                    temperament: data.temperament,
                    age: data.age,
                    usesPerfume: data.usesPerfume || false,
                    usesOrnaments: data.usesOrnaments || false,
                    hasKnots: data.hasKnots || false,
                    hasMattedFur: data.hasMattedFur || false,
                    // Grooming details
                    groomingMachine: data.groomingMachine,
                    groomingHeight: data.groomingHeight,
                    groomingAdapter: data.groomingAdapter,
                    groomingScissors: data.groomingScissors,
                    groomingNotes: data.groomingNotes,
                    customerId: id
                }
            });

            return res.status(201).json(pet);
        } catch (error) {
            console.error('Erro ao adicionar pet:', error);
            return res.status(500).json({ error: 'Erro interno ao criar pet' });
        }
    },

    async updatePet(req: Request, res: Response) {
        try {
            const { petId } = req.params;
            const data = req.body;

            // Fetch before for diff
            const petBefore = await prisma.pet.findUnique({
                where: { id: petId }
            });

            const pet = await prisma.pet.update({
                where: { id: petId },
                data: {
                    name: data.name,
                    species: data.species,
                    breed: data.breed,
                    weight: data.weight !== undefined ? (data.weight ? parseFloat(data.weight) : null) : undefined,
                    observations: data.observations,
                    coatType: data.coatType,
                    healthIssues: data.healthIssues,
                    allergies: data.allergies,
                    temperament: data.temperament,
                    age: data.age,
                    usesPerfume: data.usesPerfume,
                    usesOrnaments: data.usesOrnaments,
                    hasKnots: data.hasKnots,
                    hasMattedFur: data.hasMattedFur,
                    // Grooming details
                    groomingMachine: data.groomingMachine,
                    groomingHeight: data.groomingHeight,
                    groomingAdapter: data.groomingAdapter,
                    groomingScissors: data.groomingScissors,
                    groomingNotes: data.groomingNotes,
                }
            });

            // Log Pet Update
            await auditService.logEvent((req as any).audit, {
                targetType: 'PET',
                targetId: petId,
                clientId: pet.customerId || undefined,
                petId: petId,
                action: 'PET_UPDATED',
                summary: `Dados do pet ${pet.name} atualizados`,
                before: petBefore,
                after: pet,
                revertible: true,
                revertStrategy: 'PATCH'
            });

            return res.json(pet);
        } catch (error) {
            console.error('Erro ao atualizar pet:', error);
            return res.status(500).json({ error: 'Erro interno ao atualizar pet' });
        }
    },

    async deletePet(req: Request, res: Response) {
        try {
            const { petId } = req.params;

            await prisma.pet.delete({
                where: { id: petId }
            });

            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir pet:', error);
            return res.status(500).json({ error: 'Erro interno ao excluir pet' });
        }
    },

    // ========== FINANCIAL TRANSACTIONS ==========
    async createTransaction(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { type, amount, description, category, relatedQuoteId, relatedInvoiceId, notes } = req.body;
            const createdBy = (req as any).user.id;

            if (!type || !amount || !description) {
                return res.status(400).json({ error: 'Tipo, valor e descrição são obrigatórios' });
            }

            const financialService = await import('../services/financialService');
            const transaction = await financialService.createTransaction({
                customerId: id,
                type,
                amount: parseFloat(amount),
                description,
                category,
                relatedQuoteId,
                relatedInvoiceId,
                createdBy,
                notes
            });

            return res.status(201).json(transaction);
        } catch (error) {
            console.error('Erro ao criar transação:', error);
            return res.status(500).json({ error: 'Erro ao criar transação financeira' });
        }
    },

    async listTransactions(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { type, category, skip, take } = req.query;

            const financialService = await import('../services/financialService');
            const result = await financialService.getTransactionHistory(id, {
                type: type as any,
                category: category as string,
                skip: skip ? parseInt(skip as string) : undefined,
                take: take ? parseInt(take as string) : undefined
            });

            return res.json(result);
        } catch (error) {
            console.error('Erro ao listar transações:', error);
            return res.status(500).json({ error: 'Erro ao listar transações' });
        }
    },

    async syncBalance(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const financialService = await import('../services/financialService');
            const newBalance = await financialService.syncBalance(id);

            return res.json({ balance: newBalance });
        } catch (error) {
            console.error('Erro ao sincronizar saldo:', error);
            return res.status(500).json({ error: 'Erro ao sincronizar saldo' });
        }
    },

    // ========== CUSTOMER ALERTS ==========
    async createAlert(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { type, title, message } = req.body;
            const createdBy = (req as any).user.id;

            if (!type || !title || !message) {
                return res.status(400).json({ error: 'Tipo, título e mensagem são obrigatórios' });
            }

            const alert = await prisma.customerAlert.create({
                data: {
                    customerId: id,
                    type,
                    title,
                    message,
                    createdBy
                }
            });

            return res.status(201).json(alert);
        } catch (error) {
            console.error('Erro ao criar alerta:', error);
            return res.status(500).json({ error: 'Erro ao criar alerta' });
        }
    },

    async listAlerts(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { active } = req.query;

            const where: any = { customerId: id };
            if (active !== undefined) {
                where.isActive = active === 'true';
            }

            const alerts = await prisma.customerAlert.findMany({
                where,
                orderBy: [
                    { isActive: 'desc' },
                    { createdAt: 'desc' }
                ]
            });

            return res.json(alerts);
        } catch (error) {
            console.error('Erro ao listar alertas:', error);
            return res.status(500).json({ error: 'Erro ao listar alertas' });
        }
    },

    async resolveAlert(req: Request, res: Response) {
        try {
            const { alertId } = req.params;
            const resolvedBy = (req as any).user.id;

            const alert = await prisma.customerAlert.update({
                where: { id: alertId },
                data: {
                    isActive: false,
                    resolvedAt: new Date(),
                    resolvedBy
                }
            });

            return res.json(alert);
        } catch (error) {
            console.error('Erro ao resolver alerta:', error);
            return res.status(500).json({ error: 'Erro ao resolver alerta' });
        }
    },

    async deleteAlert(req: Request, res: Response) {
        try {
            const { alertId } = req.params;

            await prisma.customerAlert.delete({
                where: { id: alertId }
            });

            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir alerta:', error);
            return res.status(500).json({ error: 'Erro ao excluir alerta' });
        }
    }
};

