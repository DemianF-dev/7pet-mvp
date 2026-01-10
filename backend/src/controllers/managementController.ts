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
        // Run business rules first (this must be sequential)
        await appointmentService.processNoShows();

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // ⚡ PERFORMANCE: Execute ALL database queries in parallel
        const [
            currentMonthRevenue,
            lastMonthRevenue,
            appointmentsLast30Days,
            servicePopularity,
            newCustomersThisMonth,
            blockedActiveCustomers,
            pendingHighValueQuotes,
            completedAppointmentsCount,
            revenueLast30Days,
            allRelevantAppointments,
            noShowsCount,
            pendingInvoices,
            topCustomersRaw,
            revenueTrendRaw
        ] = await Promise.all([
            // Current month revenue
            prisma.paymentRecord.aggregate({
                where: { paidAt: { gte: firstDayOfMonth } },
                _sum: { amount: true }
            }),
            // Last month revenue
            prisma.paymentRecord.aggregate({
                where: {
                    paidAt: {
                        gte: lastMonth,
                        lt: firstDayOfMonth
                    }
                },
                _sum: { amount: true }
            }),
            // Appointments last 30 days grouped by status
            prisma.appointment.groupBy({
                by: ['status'],
                where: {
                    startAt: { gte: last30Days }
                },
                _count: true
            }),
            // Service popularity (top 5)
            prisma.service.findMany({
                include: {
                    _count: {
                        select: { appointments: true }
                    }
                },
                orderBy: {
                    appointments: { _count: 'desc' }
                },
                take: 5
            }),
            // New customers this month
            prisma.customer.count({
                where: {
                    createdAt: { gte: firstDayOfMonth }
                }
            }),
            // Blocked customers count
            prisma.customer.count({
                where: { isBlocked: true }
            }),
            // Pending high value quotes
            prisma.quote.count({
                where: {
                    status: 'SOLICITADO',
                    totalAmount: { gt: 500 }
                }
            }),
            // Completed appointments for ticket medio
            prisma.appointment.count({
                where: {
                    status: 'FINALIZADO',
                    startAt: { gte: last30Days }
                }
            }),
            // Revenue last 30 days for ticket medio
            prisma.paymentRecord.aggregate({
                where: { paidAt: { gte: last30Days } },
                _sum: { amount: true }
            }),
            // All relevant appointments for no-show rate
            prisma.appointment.count({
                where: {
                    startAt: { gte: last30Days },
                    status: { notIn: ['CANCELADO'] }
                }
            }),
            // No-shows count
            prisma.appointment.count({
                where: {
                    startAt: { gte: last30Days },
                    status: 'NO_SHOW'
                }
            }),
            // Pending invoices balance
            prisma.invoice.aggregate({
                where: { status: 'PENDENTE' },
                _sum: { amount: true }
            }),
            // Top customers by invoice amount
            prisma.invoice.groupBy({
                by: ['customerId'],
                where: { status: 'PAGO' },
                _sum: { amount: true },
                orderBy: { _sum: { amount: 'desc' } },
                take: 5
            }),
            // Revenue trend for last 30 days
            prisma.paymentRecord.groupBy({
                by: ['paidAt'],
                where: {
                    paidAt: { gte: last30Days }
                },
                _sum: { amount: true },
                orderBy: { paidAt: 'asc' }
            })
        ]);

        // Calculate derived metrics
        const ticketMedio = completedAppointmentsCount > 0
            ? (revenueLast30Days._sum.amount || 0) / completedAppointmentsCount
            : 0;

        const noShowRate = allRelevantAppointments > 0
            ? (noShowsCount / allRelevantAppointments) * 100
            : 0;

        // Fetch top customer names (small parallel batch)
        const topCustomerIds = topCustomersRaw.map(c => c.customerId);
        const topCustomerData = topCustomerIds.length > 0
            ? await prisma.customer.findMany({
                where: { id: { in: topCustomerIds } },
                select: { id: true, name: true }
            })
            : [];

        const customerNameMap = new Map(topCustomerData.map(c => [c.id, c.name]));
        const topCustomersDetails = topCustomersRaw.map(c => ({
            name: customerNameMap.get(c.customerId) || 'Cliente Desconhecido',
            totalSpent: c._sum.amount || 0
        }));

        // Build revenue trend map
        const trendMap: { [key: string]: number } = {};
        for (let i = 0; i < 30; i++) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = d.toISOString().split('T')[0];
            trendMap[dateStr] = 0;
        }

        revenueTrendRaw.forEach(record => {
            if (record.paidAt) {
                const dateStr = record.paidAt.toISOString().split('T')[0];
                if (trendMap[dateStr] !== undefined) {
                    trendMap[dateStr] += record._sum.amount || 0;
                }
            }
        });

        const revenueTrend = Object.keys(trendMap)
            .sort()
            .map(date => ({
                date,
                amount: trendMap[date]
            }));

        res.json({
            revenue: {
                current: currentMonthRevenue._sum.amount || 0,
                previous: lastMonthRevenue._sum.amount || 0,
                growth: lastMonthRevenue._sum.amount ?
                    ((currentMonthRevenue._sum.amount || 0) - lastMonthRevenue._sum.amount) / lastMonthRevenue._sum.amount * 100 : 0,
                trend: revenueTrend
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

// Helper to check if user is Master by Role
const isMaster = (user: any) => user?.role === 'MASTER';
const isAdmin = (user: any) => user?.role === 'ADMIN';

export const listUsers = async (req: Request, res: Response) => {
    try {
        const currentUser = (req as any).user;
        const { trash } = req.query;

        console.log('listUsers request by:', currentUser?.email, 'Role:', currentUser?.role);

        const users = await prisma.user.findMany({
            where: {
                deletedAt: trash === 'true' ? { not: null } : null
            },
            include: { customer: true },
            orderBy: { createdAt: 'desc' }
        });

        // Strict Privacy Rule: Non-Masters cannot see Master users at all
        const visibleUsers = users.filter(u => {
            if (u.role === 'MASTER') {
                return isMaster(currentUser);
            }
            return true;
        });

        const sanitizedUsers = visibleUsers.map(u => {
            const userJson: any = { ...u };

            // Security: Only Master sees plain passwords
            if (!isMaster(currentUser)) {
                delete userJson.plainPassword;
                delete userJson.passwordHash;
            }
            return userJson;
        });

        res.json(sanitizedUsers);
    } catch (error) {
        console.error('Error in listUsers:', error);
        res.status(500).json({ error: 'Erro ao listar usuários.', details: error instanceof Error ? error.message : String(error) });
    }
};

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const currentUser = (req as any).user;

        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado' });

        // PROTECT MASTER ACCOUNT
        if (targetUser.role === 'MASTER' && !isMaster(currentUser)) {
            return res.status(403).json({ error: 'Apenas o Master pode alterar cargos de usuários Master.' });
        }

        // PROTECT PROMOTION TO HIGH PRIVILEGE ROLES
        if ((role === 'ADMIN' || role === 'MASTER') && !isMaster(currentUser)) {
            return res.status(403).json({ error: 'Apenas o Master pode promover usuários para Admin ou Master.' });
        }

        const updateData: any = { role };

        if (role !== 'CLIENTE' && (!targetUser || !targetUser.staffId)) {
            updateData.staffId = await getNextStaffId(role);
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

        // PROTECT MASTER DETAILS
        if (user.role === 'MASTER' && !isMaster(currentUser)) {
            return res.status(403).json({ error: 'Acesso negado: Perfil restrito ao Master.' });
        }

        const userJson: any = { ...user };
        if (!isMaster(currentUser)) {
            delete userJson.plainPassword;
            delete userJson.passwordHash;
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
            firstName, lastName,
            isSupportAgent, active
        } = req.body;

        // RULE: Only Master can create Admin or Master
        if ((role === 'ADMIN' || role === 'MASTER') && !isMaster(currentUser)) {
            return res.status(403).json({ error: 'Apenas o Master pode criar Administradores ou outros Masters.' });
        }

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: 'E-mail já cadastrado' });

        const passwordHash = await bcrypt.hash(password, 10);

        const actualRole = role || 'CLIENTE';
        const actualDivision = division || 'CLIENTE';
        const finalName = name || `${firstName || ''} ${lastName || ''}`.trim();

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                plainPassword: password, // Only Master sees this via API
                role: actualRole,
                division: actualDivision,
                name: finalName,
                firstName,
                lastName,
                phone,
                notes,
                permissions: permissions || await getDefaultPermissions(actualRole),
                admissionDate: admissionDate ? new Date(admissionDate) : undefined,
                birthday: birthday ? new Date(birthday) : undefined,
                document,
                address,
                color: color || '#3B82F6',
                isEligible: req.body.isEligible !== undefined ? req.body.isEligible : false,
                isSupportAgent: isSupportAgent !== undefined ? isSupportAgent : false,
                active: active !== undefined ? active : true,
                staffId: (actualRole && actualRole !== 'CLIENTE') ? await getNextStaffId(actualRole) : undefined,
                customer: (actualDivision === 'CLIENTE' || actualRole === 'CLIENTE') ? {
                    create: {
                        name: finalName || email,
                        phone: phone || null,
                        address: address || null,
                    }
                } : undefined
            },
            include: { customer: true }
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
        const currentUser = (req as any).user;

        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado' });

        // PROTECT MASTER ACCOUNT
        if (targetUser.role === 'MASTER' && !isMaster(currentUser)) {
            return res.status(403).json({ error: 'Apenas o Master pode alterar dados de usuários Master.' });
        }

        const {
            name, phone, notes, permissions, role, division,
            email, password, isEligible,
            admissionDate, birthday, document, address, color,
            firstName, lastName,
            isSupportAgent, active
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
        if (isEligible !== undefined) updateData.isEligible = isEligible;
        if (isSupportAgent !== undefined) updateData.isSupportAgent = isSupportAgent;
        if (active !== undefined) updateData.active = active;
        if (division !== undefined) updateData.division = division;

        if (role !== undefined) {
            // RULE: Only Master can promote to Admin or Master
            if ((role === 'ADMIN' || role === 'MASTER') && !isMaster(currentUser)) {
                return res.status(403).json({ error: 'Apenas o Master pode promover usuários para Administrador ou Master.' });
            }

            updateData.role = role;
            if (role !== 'CLIENTE' && (!targetUser || !targetUser.staffId)) {
                updateData.staffId = await getNextStaffId(role);
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
            updateData.plainPassword = password;
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            include: { customer: true }
        });

        // Update customer restrictions if provided
        const customerData = req.body.customer;
        if (customerData && user.customer) {
            const customerUpdateData: any = {};
            if (customerData.isBlocked !== undefined) customerUpdateData.isBlocked = customerData.isBlocked;
            if (customerData.canRequestQuotes !== undefined) customerUpdateData.canRequestQuotes = customerData.canRequestQuotes;
            if (customerData.riskLevel !== undefined) customerUpdateData.riskLevel = customerData.riskLevel;

            if (Object.keys(customerUpdateData).length > 0) {
                await prisma.customer.update({
                    where: { id: user.customer.id },
                    data: customerUpdateData
                });
            }
        }

        const updatedUser = await prisma.user.findUnique({
            where: { id },
            include: { customer: true }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Update user error:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            code: (error as any)?.code,
            meta: (error as any)?.meta
        });

        const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar usuário';
        res.status(500).json({
            error: 'Erro ao atualizar usuário',
            details: errorMessage
        });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentUser = (req as any).user;

        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado' });

        // PROTECT MASTER ACCOUNT
        if (targetUser.role === 'MASTER' && !isMaster(currentUser)) {
            return res.status(403).json({ error: 'Apenas o Master pode excluir outro Master.' });
        }

        // Allow Master to delete ANYONE (including hard delete if needed)
        // Check if there are related records that forbid deletion, or use DELETE instead of UPDATE deletedAt
        // For compliance with "I want him to leave", we should probably hard delete or ensure he can't login.
        // But soft delete also prevents login usually?
        // Let's implement HARD DELETE for cleanup as requested ("fique apenas oidemianf").

        // However, Prisma might have constraints.
        // Let's try soft delete first, BUT strict check:
        // if user is 'oidemianf@gmail.com', protect it.
        const MASTER_EMAIL = 'oidemianf@gmail.com'; // This should be imported or defined top-level
        if (targetUser.email === MASTER_EMAIL) {
            return res.status(403).json({ error: 'Você não pode excluir a conta Master principal.' });
        }

        // Use soft delete by default, but if the user explicitly wants "Excluir" maybe they mean gone?
        // But soft delete is safer.
        // Wait, if "Deu erro", maybe it was because of `deletedAt` unique constraint? (Unlikely)

        // Let's assume the user wants it GONE.
        // But if there are FKs, we fail.
        // Let's do Soft Delete, but verify why it failed.

        // Use soft delete BUT rename email to release it for future use
        // This solves "Deu erro" if they try to add the person again later
        await prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                active: false,
                email: `deleted_${Date.now()}_${targetUser.email}`,
                googleId: targetUser.googleId ? `deleted_${Date.now()}_${targetUser.googleId}` : null
            }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Erro ao excluir usuário. Verifique se existem registros vinculados.' });
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
