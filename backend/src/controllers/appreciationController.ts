import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import Logger from '../lib/logger';
import { socketService } from '../services/socketService';

export const create = async (req: Request, res: Response) => {
    try {
        const { badgeType, receiverId, comment } = req.body;
        // @ts-ignore
        const senderId = req.user?.id;

        if (!badgeType || !receiverId) {
            return res.status(400).json({ error: 'badgeType e receiverId são obrigatórios' });
        }

        // 1. Create Appreciation record
        const appreciation = await prisma.appreciation.create({
            data: {
                badgeType,
                senderId,
                receiverId,
                comment
            },
            include: {
                sender: { select: { id: true, name: true } },
                receiver: { select: { id: true, name: true } }
            }
        });

        // 2. Create Notification for the receiver
        const notification = await prisma.notification.create({
            data: {
                userId: receiverId,
                title: 'Parabéns! Você recebeu uma insígnia!',
                message: `Você recebeu a insígnia "${badgeType}" de ${appreciation.sender.name}.`,
                type: 'SUCCESS',
            }
        });
        socketService.notifyUser(receiverId, 'notification:new', notification);

        // 3. Create Automated Post in Feed
        const postContent = `Parabéns ${appreciation.receiver.name} por atingir a insígnia de ${badgeType}! Reconhecimento de ${comment || 'excelência'}, atribuído por ${appreciation.sender.name}.`;
        const post = await prisma.post.create({
            data: {
                content: postContent,
                authorId: senderId, // The admin/executor
                attachments: []
            },
            include: {
                author: { select: { id: true, name: true, color: true } },
                comments: true,
                reactions: true
            }
        });
        socketService.emit('feed:new_post', post);

        res.status(201).json(appreciation);
    } catch (error) {
        Logger.error('Error creating appreciation', error);
        res.status(500).json({ error: 'Failed to create appreciation' });
    }
};

export const getByUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const appreciations = await prisma.appreciation.findMany({
            where: { receiverId: userId },
            include: {
                sender: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(appreciations);
    } catch (error) {
        Logger.error('Error fetching appreciations', error);
        res.status(500).json({ error: 'Failed to fetch appreciations' });
    }
};
