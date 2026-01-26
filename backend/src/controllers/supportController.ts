import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import { notificationService } from '../services/notificationService';
import { z } from 'zod';

const MASTER_EMAIL = 'oidemianf@gmail.com';

export const createTicket = async (req: Request, res: Response) => {
    try {
        const { name, description, imageUrl } = req.body;
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        const ticket = await prisma.bugReport.create({
            data: {
                userId: user.id,
                name: user.name || user.email,
                description,
                imageUrl
            }
        });

        // Notify Master
        // We find the master user first
        const masterUser = await prisma.user.findUnique({
            where: { email: MASTER_EMAIL }
        });

        if (masterUser) {
            await prisma.notification.create({
                data: {
                    id: randomUUID(),
                    userId: masterUser.id,
                    title: 'Novo Chamado Técnico',
                    message: `Novo chamado de ${user.name}: ${description.substring(0, 50)}...`,
                    type: 'BUG_REPORT',
                    relatedId: ticket.id,
                    priority: 'HIGH'
                }
            });
        }

        res.status(201).json(ticket);
    } catch (error: any) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Erro ao criar chamado.', details: error });
    }
};

export const listTickets = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const isMaster = user.email === MASTER_EMAIL;

        const where = isMaster ? {} : { userId: user.id };

        const tickets = await prisma.bugReport.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        res.json(tickets);
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao listar chamados.' });
    }
};

export const updateTicketStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user = (req as any).user;

        if (user.email !== MASTER_EMAIL) {
            return res.status(403).json({ error: 'Apenas o Master pode atualizar status.' });
        }

        const currentTicket = await prisma.bugReport.findUnique({ where: { id } });
        if (!currentTicket) return res.status(404).json({ error: 'Chamado não encontrado.' });

        const ticket = await prisma.bugReport.update({
            where: { id },
            data: {
                status,
                resolvedAt: status === 'CONCLUIDO' ? new Date() : null
            }
        });

        // Notify Requester
        if (status !== currentTicket.status) {
            await notificationService.notifySupportResponse(
                ticket.id,
                ticket.userId,
                `O status do seu chamado técnico foi atualizado para: ${status}. Confira em Suporte.`
            );
        }

        res.json(ticket);
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao atualizar chamado.' });
    }
};
