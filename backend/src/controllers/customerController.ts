
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createAuditLog, detectChanges } from '../utils/auditLogger';

const prisma = new PrismaClient();

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
}).passthrough(); // Allow additional fields

export const customerController = {
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
            const customers = await prisma.customer.findMany({
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
                orderBy: { createdAt: 'desc' }
            });
            return res.json(customers);
        } catch (error) {
            console.error('Erro ao listar clientes:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
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
                    appointments: { orderBy: { startAt: 'desc' } },
                    quotes: { orderBy: { createdAt: 'desc' }, include: { items: true } },
                    invoices: { orderBy: { createdAt: 'desc' } }
                }
            });

            if (!customer) {
                return res.status(404).json({ error: 'Cliente não encontrado' });
            }

            return res.json(customer);
        } catch (error) {
            console.error('Erro ao buscar cliente:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
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
                await createAuditLog({
                    entityType: 'CUSTOMER',
                    entityId: customer.id,
                    action: 'CREATE',
                    performedBy: user.id,
                    reason: 'Cliente criado pela equipe'
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

                const updated = await tx.customer.update({
                    where: { id },
                    data: customerUpdateData
                });

                // Create audit log with detected changes
                await createAuditLog({
                    entityType: 'CUSTOMER',
                    entityId: id,
                    action: 'UPDATE',
                    performedBy,
                    changes: detectChanges(customerBefore, updated),
                    reason: 'Atualização de dados do cliente'
                }, tx);

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
            const customerService = await import('../services/customerService');
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
            const customerService = await import('../services/customerService');
            await customerService.bulkDelete(ids);
            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir clientes em massa:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async listTrash(req: Request, res: Response) {
        try {
            const customerService = await import('../services/customerService');
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
            const customerService = await import('../services/customerService');
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
            const customerService = await import('../services/customerService');
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
            const customerService = await import('../services/customerService');
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
                    customerId: id
                }
            });

            return res.status(201).json(pet);
        } catch (error) {
            console.error('Erro ao adicionar pet:', error);
            return res.status(500).json({ error: 'Erro interno ao criar pet' });
        }
    }
};
