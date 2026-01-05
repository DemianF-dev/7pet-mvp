import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AppointmentStatus, InvoiceStatus } from '@prisma/client';
import * as appointmentService from '../services/appointmentService';
import bcrypt from 'bcryptjs';

const getNextStaffId = async (role: string) => {
    if (role === 'CLIENTE') {
        const lastClient = await prisma.user.findFirst({
            where: { role: 'CLIENTE', staffId: { gte: 1000 } },
            orderBy: { staffId: 'desc' },
            select: { staffId: true }
        });
        return Math.max(lastClient?.staffId || 1000, 1000) + 1;
    } else {
        const lastStaff = await prisma.user.findFirst({
            where: { role: { not: 'CLIENTE' }, staffId: { lt: 1000 } },
            orderBy: { staffId: 'desc' },
            select: { staffId: true }
        });
        // Special case: if no staff yet, it returns 0 as per user request (OP-0000)
        if (!lastStaff) return 0;
        return (lastStaff.staffId || 0) + 1;
    }
};

const RESTRICTED_EMAILS = ['oidemianf@gmail.com', 'demian@master'];
const MASTER_EMAIL = 'oidemianf@gmail.com';

const isRestricted = (email?: string | null) => {
    if (!email) return false;
    return RESTRICTED_EMAILS.some(e => email.toLowerCase().includes(e.toLowerCase()));
};

const getDefaultPermissions = async (role: string) => {
    try {
        const rolePerm = await prisma.rolePermission.findUnique({
            where: { role }
        });
        return rolePerm?.permissions || '[]';
    } catch (e) {
        console.error('Error getting default permissions:', e);
        return '[]';
    }
};

export const getKPIs = async (req: Request, res: Response) => {
    try {
        // Run business rules first
        await appointmentService.processNoShows();

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const currentMonthRevenue = await prisma.paymentRecord.aggregate({
            where: { paidAt: { gte: firstDayOfMonth } },
            _sum: { amount: true }
        });

        const lastMonthRevenue = await prisma.paymentRecord.aggregate({
            where: {
                paidAt: {
                    gte: lastMonth,
                    lt: firstDayOfMonth
                }
            },
            _sum: { amount: true }
        });

        const appointmentsLast30Days = await prisma.appointment.groupBy({
            by: ['status'],
            where: {
                startAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
            },
            _count: true
        });

        const servicePopularity = await prisma.service.findMany({
            include: {
                _count: {
                    select: { appointments: true }
                }
            },
            orderBy: {
                appointments: { _count: 'desc' }
            },
            take: 5
        });

        const newCustomersThisMonth = await prisma.customer.count({
            where: {
                createdAt: { gte: firstDayOfMonth }
            }
        });

        const blockedActiveCustomers = await prisma.customer.count({
            where: { isBlocked: true }
        });

        const pendingHighValueQuotes = await prisma.quote.count({
            where: {
                status: 'SOLICITADO',
                totalAmount: { gt: 500 }
            }
        });

        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const completedAppointmentsCount = await prisma.appointment.count({
            where: {
                status: 'FINALIZADO',
                startAt: { gte: last30Days }
            }
        });
        const revenueLast30Days = await prisma.paymentRecord.aggregate({
            where: { paidAt: { gte: last30Days } },
            _sum: { amount: true }
        });
        const ticketMedio = completedAppointmentsCount > 0
            ? (revenueLast30Days._sum.amount || 0) / completedAppointmentsCount
            : 0;

        const allRelevantAppointments = await prisma.appointment.count({
            where: {
                startAt: { gte: last30Days },
                status: { notIn: ['CANCELADO'] }
            }
        });
        const noShowsCount = await prisma.appointment.count({
            where: {
                startAt: { gte: last30Days },
                status: 'NO_SHOW'
            }
        });
        const noShowRate = allRelevantAppointments > 0 ? (noShowsCount / allRelevantAppointments) * 100 : 0;

        const pendingInvoices = await prisma.invoice.aggregate({
            where: { status: 'PENDENTE' },
            _sum: { amount: true }
        });

        const topCustomersRaw = await prisma.invoice.groupBy({
            by: ['customerId'],
            where: { status: 'PAGO' },
            _sum: { amount: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: 5
        });

        const topCustomersDetails = await Promise.all(topCustomersRaw.map(async (c) => {
            const customer = await prisma.customer.findUnique({ where: { id: c.customerId } });
            return {
                name: customer?.name || 'Cliente Desconhecido',
                totalSpent: c._sum.amount || 0
            };
        }));

        res.json({
            revenue: {
                current: currentMonthRevenue._sum.amount || 0,
                previous: lastMonthRevenue._sum.amount || 0,
                growth: lastMonthRevenue._sum.amount ?
                    ((currentMonthRevenue._sum.amount || 0) - lastMonthRevenue._sum.amount) / lastMonthRevenue._sum.amount * 100 : 0
            },
            appointments: {
                distribution: appointmentsLast30Days,
                total: appointmentsLast30Days.reduce((acc, curr) => acc + (curr._count as number), 0)
            },
            services: servicePopularity.map(s => ({
                name: s.name,
                count: s._count.appointments
            })),
            growth: {
                newCustomers: newCustomersThisMonth
            },
            alerts: {
                blockedCustomers: blockedActiveCustomers,
                highValueQuotes: pendingHighValueQuotes
            },
            ticketMedio,
            noShowRate,
            pendingBalance: pendingInvoices._sum.amount || 0,
            topCustomers: topCustomersDetails
        });
    } catch (error) {
        console.error('Error fetching KPIs:', error);
        res.status(500).json({ error: 'Erro ao buscar métricas gerenciais.' });
    }
};

export const getReports = async (req: Request, res: Response) => {
    try {
        const { start, end } = req.query;
        const startDate = start ? new Date(start as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endDate = end ? new Date(end as string) : new Date();

        const invoices = await prisma.invoice.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                customer: true,
                appointment: {
                    include: { services: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(invoices);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório.' });
    }
};

export const listUsers = async (req: Request, res: Response) => {
    try {
        const currentUser = (req as any).user;
        const requesterIsSuper = isRestricted(currentUser?.email);
        const { trash } = req.query;

        const users = await prisma.user.findMany({
            where: {
                deletedAt: trash === 'true' ? { not: null } : null
            },
            include: { customer: true },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`[listUsers] 🔍 Encontrados ${users.length} usuários no banco (trash: ${trash})`);


        // If requester is not super, hide restricted users from the list
        const filteredUsers = (requesterIsSuper ? users : users.filter(u => !isRestricted(u.email))).map(u => {
            const userJson: any = { ...u };
            // Apenas o Master pode ver o campo plainPassword
            if (currentUser?.email !== MASTER_EMAIL) {
                delete userJson.plainPassword;
            }
            if (!requesterIsSuper) {
                delete userJson.passwordHash;
            }
            return userJson;
        });

        res.json(filteredUsers);
    } catch (error) {
        console.error('Error in listUsers:', error);
        res.status(500).json({ error: 'Erro ao listar usuários.', details: error instanceof Error ? error.message : String(error) });
    }
};

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const currentUserProfile = (req as any).user;

        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado' });

        // STRICT MASTER PROTECTION
        if (targetUser.email === MASTER_EMAIL && currentUserProfile?.email !== MASTER_EMAIL) {
            return res.status(403).json({ error: 'Apenas o próprio Master pode alterar seu cargo.' });
        }

        // STRICT ADMIN CREATION PROTECTION
        if ((role === 'ADMIN' || role === 'MASTER') && currentUserProfile?.email !== MASTER_EMAIL) {
            return res.status(403).json({ error: 'Apenas o Master pode promover usuários para Administrador.' });
        }

        // Access Control (Legacy for other restricted users)
        if (isRestricted(targetUser.email) && !isRestricted(currentUserProfile?.email)) {
            return res.status(403).json({ error: 'Acesso negado: este perfil é restrito.' });
        }

        const updateData: any = { role };

        if (role !== 'CLIENTE' && (!targetUser || !targetUser.staffId)) {
            updateData.staffId = await getNextStaffId(role); // Fixed: Pass role to getNextStaffId
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData
        });

        res.json(user);
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ error: 'Erro ao atualizar cargo.' });
    }
};

export const getUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentUser = (req as any).user;

        const user = await prisma.user.findUnique({
            where: { id },
            include: { customer: true }
        });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        // Access Control: Restricted users can only be accessed by each other
        if (isRestricted(user.email) && !isRestricted(currentUser?.email)) {
            return res.status(403).json({ error: 'Acesso negado: este perfil é restrito.' });
        }

        const userJson: any = { ...user };
        if (currentUser?.email !== MASTER_EMAIL) {
            delete userJson.plainPassword;
        }

        res.json(userJson);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const currentUser = (req as any).user;
        const {
            email, password, role, division, name, phone, notes, permissions,
            admissionDate, birthday, document, address, color,
            firstName, lastName
        } = req.body;

        // STRICT ADMIN CREATION PROTECTION
        if ((role === 'ADMIN' || role === 'MASTER') && currentUser?.email !== MASTER_EMAIL) {
            return res.status(403).json({ error: 'Apenas o usuário Master pode criar novos Administradores.' });
        }

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: 'E-mail já cadastrado' });

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                plainPassword: password, // Salva senha em texto puro para o Master
                role: role || null,
                division: division || 'CLIENTE',
                name,
                firstName,
                lastName,
                phone,
                notes,
                permissions: permissions || await getDefaultPermissions(role),
                admissionDate: admissionDate ? new Date(admissionDate) : undefined,
                birthday: birthday ? new Date(birthday) : undefined,
                document,
                address,
                color: color || '#3B82F6',
                staffId: (role && role !== 'CLIENTE') ? await getNextStaffId(role) : undefined,
            }
        });

        res.status(201).json(user);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentUserProfile = (req as any).user;

        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado' });

        // STRICT MASTER PROTECTION: Only Master can edit Master
        if (targetUser.email === MASTER_EMAIL && currentUserProfile?.email !== MASTER_EMAIL) {
            return res.status(403).json({ error: 'Apenas o próprio Master pode alterar seus dados.' });
        }

        // Access Control (Legacy)
        if (isRestricted(targetUser.email) && !isRestricted(currentUserProfile?.email)) {
            return res.status(403).json({ error: 'Acesso negado: este perfil é restrito.' });
        }

        const {
            name, phone, notes, permissions, role, division,
            email, password,
            admissionDate, birthday, document, address, color,
            firstName, lastName
        } = req.body;

        const updateData: any = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;

        if (firstName !== undefined || lastName !== undefined) {
            const finalFirst = firstName !== undefined ? firstName : (targetUser?.firstName || '');
            const finalLast = lastName !== undefined ? lastName : (targetUser?.lastName || '');
            updateData.name = `${finalFirst} ${finalLast}`.trim();
        } else if (name !== undefined) {
            updateData.name = name;
        }

        if (phone !== undefined) updateData.phone = phone;
        if (notes !== undefined) updateData.notes = notes;
        if (permissions !== undefined) updateData.permissions = permissions;
        if (color !== undefined) updateData.color = color;

        // Suporte para division (novo campo para departamentos)
        if (division !== undefined) {
            updateData.division = division;
        }

        if (role !== undefined) {
            // STRICT ADMIN PROMOTION PROTECTION
            if ((role === 'ADMIN' || role === 'MASTER') && currentUserProfile?.email !== MASTER_EMAIL) {
                return res.status(403).json({ error: 'Apenas o Master pode promover usuários para Administrador.' });
            }

            updateData.role = role;
            if (role !== 'CLIENTE' && (!targetUser || !targetUser.staffId)) {
                updateData.staffId = await getNextStaffId(role); // Fixed: Pass role
            }
            if (permissions === undefined) {
                updateData.permissions = await getDefaultPermissions(role);
            }
        }

        if (email !== undefined) updateData.email = email;
        if (document !== undefined) updateData.document = document;
        if (address !== undefined) updateData.address = address;
        if (admissionDate !== undefined) updateData.admissionDate = admissionDate ? new Date(admissionDate) : null;
        if (birthday !== undefined) updateData.birthday = birthday ? new Date(birthday) : null;

        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
            updateData.plainPassword = password; // Atualiza senha em texto puro para o Master
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData
        });

        res.json(user);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentUserProfile = (req as any).user;

        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado' });

        // STRICT MASTER PROTECTION
        if (targetUser.email === MASTER_EMAIL && currentUserProfile?.email !== MASTER_EMAIL) {
            return res.status(403).json({ error: 'O usuário Master não pode ser excluído por terceiros.' });
        }

        if (isRestricted(targetUser.email) && !isRestricted(currentUserProfile?.email)) {
            return res.status(403).json({ error: 'Acesso negado: este perfil é restrito.' });
        }

        await prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
};

export const restoreUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentUserProfile = (req as any).user;

        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado' });

        if (isRestricted(targetUser.email) && !isRestricted(currentUserProfile?.email)) {
            return res.status(403).json({ error: 'Acesso negado: este perfil é restrito.' });
        }

        await prisma.user.update({
            where: { id },
            data: { deletedAt: null }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Restore user error:', error);
        res.status(500).json({ error: 'Erro ao restaurar usuário' });
    }
};

export const listRolePermissions = async (req: Request, res: Response) => {
    try {
        const perms = await prisma.rolePermission.findMany();
        res.json(perms);
    } catch (error) {
        console.error('Error in listRolePermissions:', error);
        res.status(500).json({ error: 'Erro ao listar permissões por cargo', details: error instanceof Error ? error.message : String(error) });
    }
};

export const updateRolePermissions = async (req: Request, res: Response) => {
    try {
        const { role } = req.params;
        const { permissions, label } = req.body;

        const perms = await prisma.rolePermission.upsert({
            where: { role },
            update: { permissions, label },
            create: { role, permissions, label: label || role, updatedAt: new Date() }
        });
        res.json(perms);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar permissões por cargo' });
    }
};

export const deleteRole = async (req: Request, res: Response) => {
    try {
        const { role } = req.params;
        if (['ADMIN', 'GESTAO', 'CLIENTE', 'MASTER'].includes(role.toUpperCase())) {
            return res.status(400).json({ error: 'Não é possível excluir cargos do sistema.' });
        }
        await prisma.rolePermission.delete({
            where: { role }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir cargo' });
    }
};
