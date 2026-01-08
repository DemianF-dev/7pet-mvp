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

        res.json(conversations);
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
