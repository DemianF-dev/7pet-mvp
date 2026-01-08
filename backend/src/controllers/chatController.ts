import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import Logger from '../lib/logger';
import { socketService } from '../services/socketService';

export const getConversations = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user?.userId;

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
        const senderId = req.user?.userId;

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

        socketService.notifyChat(id, 'chat:new_message', message);
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
        const creatorId = req.user?.userId;

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
