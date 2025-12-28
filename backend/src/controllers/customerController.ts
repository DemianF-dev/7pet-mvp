
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const customerSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    phone: z.string().nullish(),
    address: z.string().nullish(),
    type: z.enum(['AVULSO', 'RECORRENTE']).default('AVULSO'),
    recurringFrequency: z.enum(['SEMANAL', 'QUINZENAL', 'MENSAL']).nullish(),
    discountPercentage: z.number().nullish(),
    internalNotes: z.string().nullish(),
    email: z.string().email('Email inválido').nullish(),
    requiresPrepayment: z.boolean().nullish(),
    isBlocked: z.boolean().nullish()
});

export const customerController = {
    async getMe(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const customer = await prisma.customer.findUnique({
                where: { userId },
                include: {
                    user: { select: { email: true, role: true } },
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

    async list(req: Request, res: Response) {
        try {
            const customers = await prisma.customer.findMany({
                include: {
                    user: { select: { email: true, role: true } },
                    pets: true,
                    _count: {
                        select: { appointments: true, quotes: true }
                    }
                },
                orderBy: { name: 'asc' }
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
                    user: { select: { email: true } },
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
            // This is complex because it involves creating a User AND a Customer.
            // For MVP, we might assume the User already exists or we create a "Ghost" user?
            // Let's assume we are creating a full User + Customer profile here.

            // For now, let's keep it simple: We need an email to create a User.
            const data = customerSchema.parse(req.body);

            if (!data.email) {
                return res.status(400).json({ error: 'Email é obrigatório para novo cadastro.' });
            }

            const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
            if (existingUser) {
                return res.status(400).json({ error: 'Email já cadastrado.' });
            }

            const result = await prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        email: data.email!,
                        role: 'CLIENTE',
                        // In a real app we'd generate a temp password or send an invite.
                        // For MVP, maybe set a default or null?
                    }
                });

                const customer = await tx.customer.create({
                    data: {
                        userId: user.id,
                        name: data.name,
                        phone: data.phone,
                        address: data.address,
                        type: data.type,
                        recurringFrequency: data.recurringFrequency,
                        discountPercentage: data.discountPercentage || 0,
                        internalNotes: data.internalNotes,
                        requiresPrepayment: data.requiresPrepayment ?? false,
                        isBlocked: data.isBlocked ?? false
                    }
                });

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
            const data = customerSchema.partial().parse(req.body);
            // Extract email and scalar fields separately
            const { email, ...updateFields } = data;

            // Only update fields that belong to Customer table
            // We do NOT update User table (email) here for now as it's more complex (auth implications)
            const customer = await prisma.customer.update({
                where: { id },
                data: {
                    name: updateFields.name,
                    phone: updateFields.phone,
                    address: updateFields.address,
                    type: updateFields.type,
                    recurringFrequency: updateFields.recurringFrequency,
                    discountPercentage: updateFields.discountPercentage,
                    internalNotes: updateFields.internalNotes,
                    requiresPrepayment: updateFields.requiresPrepayment ?? undefined,
                    isBlocked: updateFields.isBlocked ?? undefined
                }
            });

            return res.json(customer);
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            // For MVP, we might want to block deletion if they have history.
            // Or use "Block" instead of Delete.
            // Let's implement a check.

            const customer = await prisma.customer.findUnique({
                where: { id },
                include: { _count: { select: { appointments: true, quotes: true } } }
            });

            if (!customer) return res.status(404).json({ error: 'Cliente não encontrado' });

            if (customer._count.appointments > 0 || customer._count.quotes > 0) {
                return res.status(400).json({
                    error: 'Não é possível excluir clientes com histórico. Considere bloqueá-lo ou excluir os registros relacionados primeiro.'
                });
            }

            // Also need to delete the User? 
            // In this specific schema, Customer depends on User.
            // Let's just delete the customer profile for now, keeping the user login?
            // Actually, if we delete Customer, we should probably delete the User if they are only a CLIENTE.

            await prisma.$transaction(async (tx) => {
                await tx.customer.delete({ where: { id } });
                // Optional: delete user if desired. For safety, let's keep user for now or explicit request.
            });

            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
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
