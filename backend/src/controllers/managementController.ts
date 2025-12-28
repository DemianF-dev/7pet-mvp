import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AppointmentStatus, InvoiceStatus } from '@prisma/client';
import * as appointmentService from '../services/appointmentService';

export const getKPIs = async (req: Request, res: Response) => {
    try {
        // Run business rules first
        await appointmentService.processNoShows();

        const now = new Date();
        // Force start of day to avoid time issues? (optional, but good for debug)
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        console.log(`[KPI] Fetching for month starting: ${firstDayOfMonth.toISOString()}`);


        // 1. Revenue Metrics (Current Month vs Last Month)
        const currentMonthRevenue = await prisma.paymentRecord.aggregate({
            where: {
                paidAt: { gte: firstDayOfMonth }
            },
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

        // 2. Appointment Stats (Efficiency/Cancellation)
        const appointmentsLast30Days = await prisma.appointment.groupBy({
            by: ['status'],
            where: {
                startAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
            },
            _count: true
        });

        // 3. Service Popularity
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

        // 4. Customer Growth
        const newCustomersThisMonth = await prisma.customer.count({
            where: {
                createdAt: { gte: firstDayOfMonth }
            }
        });

        // 5. Operational Alerts
        // - Blocked customers with activity
        const blockedActiveCustomers = await prisma.customer.count({
            where: { isBlocked: true }
        });

        // - Pending high-value quotes (> 500)
        const pendingHighValueQuotes = await prisma.quote.count({
            where: {
                status: 'SOLICITADO',
                totalAmount: { gt: 500 }
            }
        });

        res.json({
            revenue: {
                current: currentMonthRevenue._sum.amount || 0,
                previous: lastMonthRevenue._sum.amount || 0,
                growth: lastMonthRevenue._sum.amount ?
                    ((currentMonthRevenue._sum.amount || 0) - lastMonthRevenue._sum.amount) / lastMonthRevenue._sum.amount * 100 : 0
            },
            appointments: {
                distribution: appointmentsLast30Days,
                total: appointmentsLast30Days.reduce((acc, curr) => acc + curr._count, 0)
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
            }
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
        const users = await prisma.user.findMany({
            include: { customer: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
};

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: { role }
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar cargo.' });
    }
};

export const getUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            include: { customer: true }
        });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
};

import bcrypt from 'bcryptjs';

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name, phone, notes, permissions, role,
            email, password, // Admin only fields
            admissionDate, birthday, document, address
        } = req.body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (notes !== undefined) updateData.notes = notes;
        if (permissions !== undefined) updateData.permissions = permissions;
        if (role !== undefined) updateData.role = role;

        // New Fields
        if (email !== undefined) updateData.email = email;
        if (document !== undefined) updateData.document = document;
        if (address !== undefined) updateData.address = address;
        if (admissionDate !== undefined) updateData.admissionDate = admissionDate ? new Date(admissionDate) : null;
        if (birthday !== undefined) updateData.birthday = birthday ? new Date(birthday) : null;

        // Password Hashing
        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
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
        // Soft delete if possible, or simple delete. Prompt implies 'delete'.
        // Schema added 'deletedAt', so let's use it.
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
