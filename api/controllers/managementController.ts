import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AppointmentStatus, InvoiceStatus } from '@prisma/client';
import * as appointmentService from '../services/appointmentService';
import bcrypt from 'bcryptjs';
import { socketService } from '../services/socketService';
import * as auditService from '../services/auditService';


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

// Helper to check if user is Master by Role, Division or specific Email
const isMaster = (user: any) => user?.email === MASTER_EMAIL || user?.role === 'MASTER' || user?.division === 'MASTER';
const isAdmin = (user: any) => user?.role === 'ADMIN' || user?.division === 'ADMIN' || isMaster(user);

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
        console.log('[getKPIs] Starting...');
        // Run business rules first (this must be sequential)
        await appointmentService.processNoShows();
        console.log('[getKPIs] processNoShows finished');

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        let results: any[];
        try {
            console.log('[getKPIs] Running DB queries...');
            results = await Promise.all([
                // Current month revenue (0)
                prisma.paymentRecord.aggregate({
                    where: { paidAt: { gte: firstDayOfMonth } },
                    _sum: { amount: true }
                }),
                // Last month revenue (1)
                prisma.paymentRecord.aggregate({
                    where: {
                        paidAt: {
                            gte: lastMonth,
                            lt: firstDayOfMonth
                        }
                    },
                    _sum: { amount: true }
                }),
                // Appointments last 30 days grouped by status (2)
                prisma.appointment.groupBy({
                    by: ['status'],
                    where: {
                        startAt: { gte: last30Days }
                    },
                    _count: true
                }),
                // Service popularity (top 5) (3)
                prisma.service.findMany({
                    include: {
                        _count: {
                            select: { Appointment: true }
                        }
                    },
                    orderBy: {
                        Appointment: { _count: 'desc' }
                    },
                    take: 5
                }),
                // New customers this month (4)
                prisma.customer.count({
                    where: {
                        createdAt: { gte: firstDayOfMonth }
                    }
                }),
                // Blocked customers count (5)
                prisma.customer.count({
                    where: { isBlocked: true }
                }),
                // Pending high value quotes (6)
                prisma.quote.count({
                    where: {
                        status: 'SOLICITADO' as any,
                        totalAmount: { gt: 500 }
                    }
                }),
                // Completed appointments for ticket medio (7)
                prisma.appointment.count({
                    where: {
                        status: 'FINALIZADO' as any,
                        startAt: { gte: last30Days }
                    }
                }),
                // Revenue last 30 days for ticket medio (8)
                prisma.paymentRecord.aggregate({
                    where: { paidAt: { gte: last30Days } },
                    _sum: { amount: true }
                }),
                // All relevant appointments for no-show rate (9)
                prisma.appointment.count({
                    where: {
                        startAt: { gte: last30Days },
                        status: { notIn: ['CANCELADO' as any] }
                    }
                }),
                // No-shows count (10)
                prisma.appointment.count({
                    where: {
                        startAt: { gte: last30Days },
                        status: 'NO_SHOW' as any
                    }
                }),
                // Pending invoices balance (11)
                prisma.invoice.aggregate({
                    where: { status: 'PENDENTE' as any },
                    _sum: { amount: true }
                }),
                // Top customers by invoice amount (12)
                prisma.invoice.groupBy({
                    by: ['customerId'],
                    where: { status: 'PAGO' as any },
                    _sum: { amount: true },
                    orderBy: { _sum: { amount: 'desc' } },
                    take: 5
                }),
                // Revenue trend for last 30 days (13)
                prisma.paymentRecord.groupBy({
                    by: ['paidAt'],
                    where: {
                        paidAt: { gte: last30Days }
                    },
                    _sum: { amount: true },
                    orderBy: { paidAt: 'asc' }
                })
            ]);
            console.log('[getKPIs] DB queries finished');
        } catch (dbError) {
            console.error('[getKPIs] DATABASE ERROR:', dbError);
            throw dbError; // Propagate to outer catch
        }

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
        ] = results;

        // Calculate derived metrics
        const ticketMedio = completedAppointmentsCount > 0
            ? (revenueLast30Days._sum.amount || 0) / completedAppointmentsCount
            : 0;

        const noShowRate = allRelevantAppointments > 0
            ? (noShowsCount / allRelevantAppointments) * 100
            : 0;

        // Fetch top customer names (small parallel batch)
        const topCustomerIds = topCustomersRaw.map((c: any) => c.customerId);
        const topCustomerData = topCustomerIds.length > 0
            ? await prisma.customer.findMany({
                where: { id: { in: topCustomerIds } },
                select: { id: true, name: true }
            })
            : [];

        const customerNameMap = new Map(topCustomerData.map(c => [c.id, c.name]));
        const topCustomersDetails = topCustomersRaw.map((c: any) => ({
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

        revenueTrendRaw.forEach((record: any) => {
            if (record.paidAt) {
                // Prisma handles DateTime as Date objects
                const dateObj = record.paidAt instanceof Date ? record.paidAt : new Date(record.paidAt);
                const dateStr = dateObj.toISOString().split('T')[0];
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
                previous: lastMonthRevenue._sum.amount ? lastMonthRevenue._sum.amount : 0,
                growth: lastMonthRevenue._sum.amount ?
                    ((currentMonthRevenue._sum.amount || 0) - lastMonthRevenue._sum.amount) / lastMonthRevenue._sum.amount * 100 : 0,
                trend: revenueTrend
            },
            appointments: {
                distribution: appointmentsLast30Days,
                total: appointmentsLast30Days.reduce((acc: number, curr: any) => acc + (curr._count as number), 0)
            },
            services: servicePopularity.map((s: any) => ({
                name: s.name,
                count: s._count.Appointment
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
        res.status(500).json({ error: (error as Error).message || 'Erro ao buscar métricas gerenciais.' });
    }
};

export const verifyMaster = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const master = isMaster(user);
        res.json({ isMaster: master });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao verificar master' });
    }
};

export const getReports = async (req: Request, res: Response) => {
    try {
        const { start, end, source } = req.query;
        const startDate = start ? new Date(start as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endDate = end ? new Date(end as string) : new Date();

        const includeInvoices = !source || source === 'all' || source === 'invoice';
        const includePOS = !source || source === 'all' || source === 'pos';

        const [invoices, orders] = await Promise.all([
            includeInvoices ? prisma.invoice.findMany({
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
                    },
                    quotes: {
                        select: { id: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }) : Promise.resolve([]),
            includePOS ? prisma.order.findMany({
                where: {
                    status: { in: ['PAID', 'CANCELLED'] },
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                include: {
                    customer: true,
                    items: true
                },
                orderBy: { createdAt: 'desc' }
            }) : Promise.resolve([])
        ]);

        const normalizedOrders = orders.map((o: any) => ({
            id: o.id,
            amount: o.finalAmount,
            status: o.status === 'PAID' ? 'PAGO' : 'CANCELADO',
            createdAt: o.createdAt,
            customer: o.customer || { name: 'Venda S/ Identificação' },
            appointment: {
                services: o.items.map((i: any) => ({ name: i.description }))
            },
            isPOS: true
        }));

        const combined = [...invoices, ...normalizedOrders].sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        res.json(combined);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório.' });
    }
};


// Middlewares are using these helpers

export const listUsers = async (req: Request, res: Response) => {
    try {
        console.log('[listUsers] Request received');
        const currentUser = (req as any).user;
        const { trash } = req.query;

        console.log('listUsers request by:', currentUser?.email, 'Role:', currentUser?.role, 'Division:', currentUser?.division);

        const users = await prisma.user.findMany({
            where: {
                deletedAt: trash === 'true' ? { not: null } : null
            },
            include: { customer: true },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`[listUsers] Found ${users.length} users`);

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

            // Add online status
            try {
                userJson.isOnline = socketService.isUserOnline(u.id);
            } catch (sockErr) {
                console.warn(`[listUsers] Socket check failed for user ${u.id}`, sockErr);
                userJson.isOnline = false;
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

        // Audit Log
        await auditService.logSecurityEvent((req as any).audit, 'USER' as any, id, 'PERMISSION_CHANGED', `Cargo de ${user.name} alterado para ${role}`, { role: targetUser.role }, { role });

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
                        cpf: document || null,
                    }
                } : undefined
            },
            include: { customer: true }
        });

        // Audit Log
        await auditService.logSecurityEvent((req as any).audit, 'USER' as any, user.id, 'USER_CREATED', `Novo usuário ${user.name} (${user.role}) criado`, undefined, user);

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

        // PROTECT ADMIN/MASTER ACCOUNTS - Only Master can edit them
        const isMasterUser = isMaster(currentUser);
        if ((targetUser.role === 'MASTER' || targetUser.role === 'ADMIN') && !isMasterUser) {
            return res.status(403).json({ error: 'Apenas o Master pode alterar dados de usuários Administradores ou Master.' });
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

        // DEV ONLY: Gamification & Pause Menu Access
        // Only oidemianf@gmail.com can enable/disable games for users
        const DEV_EMAIL = 'oidemianf@gmail.com';
        if (currentUser.email === DEV_EMAIL) {
            if (req.body.pauseMenuEnabled !== undefined) updateData.pauseMenuEnabled = req.body.pauseMenuEnabled;
            if (req.body.allowedGames !== undefined) updateData.allowedGames = req.body.allowedGames;
        }

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

        // Sync Document (User) with CPF (Customer) if provided
        if (document !== undefined && user.customer) {
            await prisma.customer.update({
                where: { id: user.customer.id },
                data: { cpf: document }
            });
        }

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

        if (permissions !== undefined || role !== undefined) {
            socketService.notifyUser(id, 'USER_PERMISSIONS_UPDATED', {
                permissions: updatedUser?.permissions,
                role: updatedUser?.role
            });
        }

        // Audit Log
        await auditService.logSecurityEvent((req as any).audit, 'USER' as any, id, 'USER_UPDATED', `Dados de ${updatedUser?.name} atualizados`, targetUser, updatedUser);

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

        await prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                active: false
            }
        });

        // Audit Log
        await auditService.logSecurityEvent((req as any).audit, 'USER' as any, id, 'USER_DELETED_SOFT', `Usuário ${targetUser.name} movido para a lixeira`);

        res.json({ message: 'Usuário excluído com sucesso' });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
};

export const getRoleConfigs = async (req: Request, res: Response) => {
    try {
        const configs = await prisma.rolePermission.findMany({
            orderBy: { role: 'asc' }
        });
        res.json(configs);
    } catch (error) {
        console.error('Error fetching role configs:', error);
        res.status(500).json({ error: 'Erro ao buscar configurações de cargo' });
    }
};

export const updateRoleConfig = async (req: Request, res: Response) => {
    try {
        const { role } = req.params;
        const { label, permissions } = req.body;
        const currentUser = (req as any).user;

        if (!isMaster(currentUser) && (role.toUpperCase() === 'MASTER' || (isAdmin(currentUser) && role.toUpperCase() === 'ADMIN'))) {
            return res.status(403).json({ error: 'Você não tem permissão para alterar as permissões de este cargo.' });
        }

        const updated = await prisma.rolePermission.upsert({
            where: { role: role.toUpperCase() },
            update: {
                label,
                permissions: Array.isArray(permissions) ? JSON.stringify(permissions) : permissions,
                updatedAt: new Date()
            },
            create: {
                role: role.toUpperCase(),
                label: label || role,
                permissions: Array.isArray(permissions) ? JSON.stringify(permissions) : permissions,
                updatedAt: new Date()
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating role config:', error);
        res.status(500).json({ error: 'Erro ao atualizar configuração de cargo' });
    }
};

export const deleteRoleConfig = async (req: Request, res: Response) => {
    try {
        const { role } = req.params;
        const currentUser = (req as any).user;

        if (!isMaster(currentUser) && !isAdmin(currentUser)) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        if (role.toUpperCase() === 'MASTER') {
            return res.status(400).json({ error: 'O cargo MASTER é vitalício e não pode ser excluído.' });
        }

        await prisma.rolePermission.delete({
            where: { role: role.toUpperCase() }
        });

        res.json({ message: 'Cargo excluído com sucesso' });
    } catch (error) {
        console.error('Error deleting role config:', error);
        res.status(500).json({ error: 'Erro ao excluir cargo' });
    }
};

export const restoreUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentUserProfile = (req as any).user;

        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado' });

        if (isRestricted(targetUser.email) && !isMaster(currentUserProfile)) {
            return res.status(403).json({ error: 'Acesso negado: este perfil é restrito.' });
        }

        await prisma.user.update({
            where: { id },
            data: { deletedAt: null, active: true }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Restore user error:', error);
        res.status(500).json({ error: 'Erro ao restaurar usuário' });
    }
};

export const permanentDeleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentUser = (req as any).user;

        // Only Master or Admin can permanently delete
        if (!isMaster(currentUser) && !isAdmin(currentUser)) {
            return res.status(403).json({ error: 'Apenas o Master ou Administradores podem excluir permanentemente usuários.' });
        }

        const targetUser = await prisma.user.findUnique({
            where: { id },
            include: { customer: true }
        });

        if (!targetUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Check if user is in trash (soft deleted)
        if (!targetUser.deletedAt) {
            return res.status(400).json({
                error: 'O usuário deve estar na lixeira antes de ser excluído permanentemente. Mova-o para a lixeira primeiro.'
            });
        }

        // Store info for audit before deletion
        const userInfo = {
            email: targetUser.email,
            name: targetUser.name,
            role: targetUser.role
        };

        // Delete customer profile if exists (will cascade delete related records based on schema)
        if (targetUser.customer) {
            await prisma.customer.delete({
                where: { id: targetUser.customer.id }
            });
        }

        // Hard delete the user
        await prisma.user.delete({
            where: { id }
        });

        // Audit Log - mark as NOT revertible since it's permanent
        await auditService.logSecurityEvent((req as any).audit, 'USER' as any, id, 'USER_DELETED_PERMANENT' as any, `Usuário ${userInfo.name} (${userInfo.email}) foi excluído permanentemente do sistema`);

        res.json({
            message: 'Usuário excluído permanentemente. O e-mail está agora disponível para reutilização.',
            email: userInfo.email
        });

    } catch (error) {
        console.error('Permanent delete user error:', error);
        res.status(500).json({ error: 'Erro ao excluir usuário permanentemente' });
    }
};
