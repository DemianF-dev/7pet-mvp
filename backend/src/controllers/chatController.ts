import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import Logger from '../lib/logger';
import { socketService } from '../services/socketService';

export const getConversations = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user?.id;

        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId }
                }
            },
            include: {
                participants: {
                    include: {
                        user: { select: { id: true, name: true, color: true } }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { lastMessageAt: 'desc' }
        });

        const conversationsWithUnread = await Promise.all(conversations.map(async (conv) => {
            const myParticipant = conv.participants.find(p => p.userId === userId);
            const lastReadAt = myParticipant?.lastReadAt;

            const unreadCount = await prisma.message.count({
                where: {
                    conversationId: conv.id,
                    senderId: { not: userId },
                    createdAt: lastReadAt ? { gt: lastReadAt } : undefined
                }
            });

            return {
                ...conv,
                unreadCount
            };
        }));

        res.json(conversationsWithUnread);
    } catch (error) {
        Logger.error('Error fetching conversations', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // conversationId
        const messages = await prisma.message.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, name: true, color: true } }
            }
        });
        res.json(messages);
    } catch (error) {
        Logger.error('Error fetching messages', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // conversationId
        const { content } = req.body;
        // @ts-ignore
        const senderId = req.user?.id;

        const message = await prisma.message.create({
            data: {
                content,
                conversationId: id,
                senderId
            },
            include: {
                sender: { select: { id: true, name: true, color: true } }
            }
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id },
            data: { lastMessageAt: new Date() }
        });

        // 1. Broadcast to chat room (for users with ChatWindow open)
        Logger.info(`📨 Sending chat:new_message to chat room: chat:${id}`);
        socketService.notifyChat(id, 'chat:new_message', message);

        // 2. Fetch conversation participants
        const conversation = await prisma.conversation.findUnique({
            where: { id },
            include: { participants: true }
        });

        if (conversation) {
            const otherParticipants = conversation.participants.filter(p => p.userId !== senderId);
            const senderName = message.sender.name || 'Alguém';

            Logger.info(`📨 Notifying ${otherParticipants.length} other participants`);

            // 3. Send chat:new_message to each participant's personal room 
            // (ensures delivery even if they're not in the chat room)
            for (const p of otherParticipants) {
                Logger.info(`📨 Sending chat:new_message to user room: user:${p.userId}`);
                socketService.notifyUser(p.userId, 'chat:new_message', message);
            }

            // 4. Create persistent notifications for history/badges
            for (const p of otherParticipants) {
                try {
                    const { createNotification } = require('./notificationController');
                    await createNotification(p.userId, {
                        title: `Nova mensagem de ${senderName}`,
                        body: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                        type: 'chat',
                        referenceId: id,
                        icon: message.sender.color || undefined,
                        data: { url: `/staff/chat`, chatId: id }
                    });
                    Logger.info(`📨 Created notification for user: ${p.userId}`);
                } catch (notifError) {
                    Logger.error('Failed to create notification for chat', notifError);
                }
            }
        }

        res.status(201).json(message);
    } catch (error) {
        Logger.error('Error sending message', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

export const createConversation = async (req: Request, res: Response) => {
    try {
        const { participantIds, type, name } = req.body;
        // @ts-ignore
        const creatorId = req.user?.id;

        // Ensure creator is included
        const allParticipants = Array.from(new Set([...(participantIds || []), creatorId]));

        const conversation = await prisma.conversation.create({
            data: {
                type: type || 'DIRECT',
                name,
                updatedAt: new Date(),
                lastMessageAt: new Date(),
                participants: {
                    create: allParticipants.map(uid => ({
                        userId: uid as string
                    }))
                }
            },
            include: {
                participants: {
                    include: { user: { select: { id: true, name: true } } }
                }
            }
        });

        // Notify participants
        allParticipants.forEach(uid => {
            socketService.notifyUser(uid as string, 'chat:new_conversation', conversation);
        });

        res.status(201).json(conversation);
    } catch (error) {
        Logger.error('Error creating conversation', error);
        res.status(500).json({ error: 'Failed to start chat' });
    }
};

export const getSupportAgents = async (req: Request, res: Response) => {
    try {
        const agents = await prisma.user.findMany({
            where: {
                isSupportAgent: true,
                active: true
            },
            select: {
                id: true,
                name: true,
                role: true,
                email: true,
                division: true
            }
        });
        res.json(agents);
    } catch (error) {
        Logger.error('Error fetching support agents', error);
        res.status(500).json({ error: 'Failed to fetch agents' });
    }
};

export const searchUsers = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        const whereClause: any = { active: true };

        if (query && typeof query === 'string') {
            whereClause.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } }
            ];
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            take: 50,
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                division: true
            }
        });
        res.json(users);
    } catch (error) {
        Logger.error('Error searching users', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
};

export const sendAttention = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // conversationId
        // @ts-ignore
        const senderId = req.user?.id;
        // @ts-ignore
        const senderRole = req.user?.role;

        // Verify if user is admin/director
        if (senderRole !== 'ADMIN' && senderRole !== 'MASTER' && senderRole !== 'GESTAO') {
            return res.status(403).json({ error: 'Apenas administradores podem chamar atenção.' });
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id },
            include: {
                participants: {
                    include: { user: { select: { id: true, name: true } } }
                }
            }
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Conversa não encontrada' });
        }

        const sender = conversation.participants.find(p => p.userId === senderId)?.user;
        const otherParticipants = conversation.participants.filter(p => p.userId !== senderId);

        // Broadcast attention via socket
        socketService.notifyChat(id, 'chat:attention', {
            conversationId: id,
            senderName: sender?.name || 'Administrador',
            message: 'Atenção, vc tem mensagem importante no seu chat.'
        });

        // Create formal notification for each participant
        for (const p of otherParticipants) {
            try {
                // Also notify their personal room in case they are not in the chat page
                socketService.notifyUser(p.userId, 'chat:attention', {
                    conversationId: id,
                    senderName: sender?.name || 'Administrador',
                    message: 'Atenção, vc tem mensagem importante no seu chat.'
                });

                const { createNotification } = require('./notificationController');
                await createNotification(p.userId, {
                    title: `⚠️ CHAMADA DE ATENÇÃO`,
                    body: `O administrador ${sender?.name} está chamando sua atenção no chat.`,
                    type: 'system',
                    referenceId: id,
                    data: { url: `/staff/chat`, chatId: id, forceAlert: true }
                });
            } catch (err) {
                Logger.error('Error sending attention notification', err);
            }
        }

        res.json({ success: true });
    } catch (error) {
        Logger.error('Error sending attention', error);
        res.status(500).json({ error: 'Failed to send attention' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // conversationId
        // @ts-ignore
        const userId = req.user?.id;

        await prisma.participant.update({
            where: {
                userId_conversationId: {
                    userId,
                    conversationId: id
                }
            },
            data: {
                lastReadAt: new Date()
            }
        });

        res.json({ success: true });
    } catch (error) {
        Logger.error('Error marking conversation as read', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
};
