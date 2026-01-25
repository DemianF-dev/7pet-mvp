import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import Logger from '../lib/logger';
import { socketService } from '../services/socketService';
import { railwaySocketClient } from '../services/railwaySocketClient';
import { Prisma } from '@prisma/client';

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

export const getConversation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const userId = req.user?.id;

        const conversation = await prisma.conversation.findUnique({
            where: { id },
            include: {
                participants: {
                    include: {
                        user: { select: { id: true, name: true, color: true } }
                    }
                }
            }
        });

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Verify participation
        const isParticipant = conversation.participants.some(p => p.userId === userId);
        if (!isParticipant) {
            return res.status(403).json({ error: 'Access denied to this conversation' });
        }

        res.json(conversation);
    } catch (error) {
        Logger.error('Error fetching conversation', error);
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // conversationId
        Logger.info(`📂 Fetching messages for conversation: ${id}`);
        const messages = await prisma.message.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: 'asc' },
            include: {
                user: { select: { id: true, name: true, color: true } }
            }
        });

        // Map user to sender for frontend compatibility
        const mappedMessages = messages.map(m => {
            const { user, ...rest } = m;
            return {
                ...rest,
                sender: user || { id: 'unknown', name: 'Usuário Removido', color: '#999' }
            };
        });

        Logger.info(`✅ Found ${mappedMessages.length} messages`);
        res.json(mappedMessages);
    } catch (error) {
        Logger.error('Error fetching messages', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // conversationId
        const { content, fileUrl, fileType, fileName } = req.body;
        // @ts-ignore
        const senderId = req.user?.id;

        const message = await prisma.message.create({
            data: {
                id: randomUUID(),
                content,
                fileUrl,
                fileType,
                fileName,
                conversationId: id,
                senderId
            },
            include: {
                user: { select: { id: true, name: true, color: true } }
            }
        });

        // Map user to sender for frontend compatibility
        const mappedMessage = {
            ...message,
            sender: (message as any).user
        };
        delete (mappedMessage as any).user;

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id },
            data: { lastMessageAt: new Date() }
        });

        // 1. Broadcast to chat room (for users with ChatWindow open)
        Logger.info(`📨 Sending chat:new_message to chat room: chat:${id}`);
        railwaySocketClient.notifyChat(id, 'chat:new_message', mappedMessage);

        // 2. Fetch conversation participants
        const conversation = await prisma.conversation.findUnique({
            where: { id },
            include: { participants: true }
        });

        if (conversation) {
            const otherParticipants = conversation.participants.filter(p => p.userId !== senderId);
            const senderName = mappedMessage.sender.name || 'Alguém';

            Logger.info(`📨 Notifying ${otherParticipants.length} other participants`);

            // 3. Send chat:new_message to each participant's personal room 
            // (ensures delivery even if they're not in the chat room)
            for (const p of otherParticipants) {
                Logger.info(`📨 Sending chat:new_message to user room: user:${p.userId}`);
                railwaySocketClient.notifyUser(p.userId, 'chat:new_message', mappedMessage);
            }

            // 4. Create persistent notifications for history/badges
            for (const p of otherParticipants) {
                try {
                    const { createNotification } = require('./notificationController');
                    const displayBody = content
                        ? (content.substring(0, 50) + (content.length > 50 ? '...' : ''))
                        : (fileType?.startsWith('image/') ? '📷 Photo' : '📎 Arquivo');

                    await createNotification(p.userId, {
                        title: `Nova mensagem de ${senderName}`,
                        body: displayBody,
                        type: 'chat',
                        referenceId: id,
                        icon: mappedMessage.sender.color || undefined,
                        data: { url: `/staff/chat`, chatId: id }
                    });
                    Logger.info(`📨 Created notification for user: ${p.userId}`);
                } catch (notifError) {
                    Logger.error('Failed to create notification for chat', notifError);
                }
            }
        }

        res.status(201).json(mappedMessage);
    } catch (error) {
        Logger.error('❌ Error sending message:', error);
        res.status(500).json({
            error: 'Failed to send message',
            details: error instanceof Error ? error.message : String(error)
        });
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
                        id: randomUUID(),
                        userId: uid as string
                    }))
                }
            },
            include: {
                participants: {
                    include: { user: { select: { id: true, name: true, color: true } } }
                },
                messages: {
                    take: 1
                }
            }
        });

        // Map messages for conversation object
        const mappedConversation = {
            ...conversation,
            messagesBySender: [], // ensure field exists for mapping if needed
            messages: conversation?.messages.map(m => ({ ...m, sender: null })) || []
        };

        // Notify participants
        allParticipants.forEach(uid => {
            railwaySocketClient.notifyUser(uid as string, 'chat:new_conversation', mappedConversation);
        });

        res.status(201).json(mappedConversation);
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
                division: true,
                color: true
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
        // @ts-ignore
        const currentUserId = req.user?.id;

        Logger.info(`🔍 Chat user search initiated by ${currentUserId}. Query: "${query || ''}"`);

        // Debug: Primeiro contar todos os usuários ativos
        const totalActiveUsers = await prisma.user.count({
            where: { active: true }
        });
        Logger.info(`🐛 DEBUG: Total usuários ativos no banco: ${totalActiveUsers}`);

        // Se não há query, retorna todos os usuários ativos (exceto o atual)
        const whereClause: any = {
            active: true
        };

        // Remover filtro de usuário atual temporariamente para debug
        if (currentUserId && currentUserId !== 'test-debug') {
            whereClause.id = { not: currentUserId };
        }

        // Se há query, aplica filtro
        if (query && typeof query === 'string' && query.trim() !== '') {
            const searchTerm = query.trim();
            whereClause.OR = [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } }
            ];
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            take: 40,
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                division: true,
                color: true
            }
        });

        Logger.info(`✅ Search returned ${users.length} users`);

        // Debug: Log dos primeiros usuários encontrados
        if (users.length > 0) {
            Logger.info(`🐛 DEBUG: Primeiros usuários: ${JSON.stringify(users.slice(0, 3), null, 2)}`);
        }

        res.json({
            users: users,
            debug: {
                totalActive: totalActiveUsers,
                query: query || null,
                currentUserId: currentUserId || null
            }
        });
    } catch (error) {
        Logger.error('❌ Error searching users for chat', error);
        res.status(500).json({ error: 'Failed to search users', debug: (error as any).message });
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
        railwaySocketClient.notifyChat(id, 'chat:attention', {
            conversationId: id,
            senderName: sender?.name || 'Administrador',
            message: 'Atenção, vc tem mensagem importante no seu chat.'
        });

        // Create formal notification for each participant
        for (const p of otherParticipants) {
            try {
                // Also notify their personal room in case they are not in the chat page
                railwaySocketClient.notifyUser(p.userId, 'chat:attention', {
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

export const deleteConversation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const userId = req.user?.id;

        // Verify if user is participant
        const participant = await prisma.participant.findUnique({
            where: { userId_conversationId: { userId, conversationId: id } }
        });

        if (!participant) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // We delete the conversation for everyone (as requested 'apagar')
        // Alternatively, we could just remove the participant, but "apagar" usually means the thread
        await prisma.conversation.delete({
            where: { id }
        });

        res.json({ success: true });
    } catch (error) {
        Logger.error('Error deleting conversation', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
};

export const addParticipant = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userId: newUserId } = req.body;
        // @ts-ignore
        const userId = req.user?.id;

        // Check if existing participant is adding
        const participant = await prisma.participant.findUnique({
            where: { userId_conversationId: { userId, conversationId: id } }
        });

        if (!participant) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Upsert participant
        await prisma.participant.upsert({
            where: { userId_conversationId: { userId: newUserId, conversationId: id } },
            create: {
                id: randomUUID(),
                userId: newUserId,
                conversationId: id
            },
            update: {} // No change if already exists
        });

        // Update conversation to GROUP if it was DIRECT and now has > 2? 
        // Or just let it be. Let's upgrade to GROUP if name is provided or > 2 participants.

        const conversation = await prisma.conversation.findUnique({
            where: { id },
            include: { participants: { include: { user: { select: { id: true, name: true } } } } }
        });

        if (conversation && conversation.type === 'DIRECT' && conversation.participants.length > 2) {
            await prisma.conversation.update({
                where: { id },
                data: { type: 'GROUP' }
            });
        }

        // Notify new participant
        railwaySocketClient.notifyUser(newUserId, 'chat:new_conversation', conversation);

        res.json({ success: true, conversation });
    } catch (error) {
        Logger.error('Error adding participant', error);
        res.status(500).json({ error: 'Failed to add participant' });
    }
};

export const transferConversation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { targetUserId } = req.body;
        // @ts-ignore
        const userId = req.user?.id;

        // Verify if current user is participant
        const participant = await prisma.participant.findUnique({
            where: { userId_conversationId: { userId, conversationId: id } }
        });

        if (!participant) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // 1. Add new participant
        await prisma.participant.upsert({
            where: { userId_conversationId: { userId: targetUserId, conversationId: id } },
            create: {
                id: randomUUID(),
                userId: targetUserId,
                conversationId: id
            },
            update: {}
        });

        // 2. Remove current user (Transfer)
        await prisma.participant.delete({
            where: { userId_conversationId: { userId, conversationId: id } }
        });

        // 3. Send system message about transfer
        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { name: true } });
        const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

        await prisma.message.create({
            data: {
                id: randomUUID(),
                content: `Atendimento transferido de ${currentUser?.name} para ${targetUser?.name}`,
                conversationId: id,
                senderId: userId // Or a system dummy user if exists
            }
        });

        res.json({ success: true });
    } catch (error) {
        Logger.error('Error transferring conversation', error);
        res.status(500).json({ error: 'Failed to transfer conversation' });
    }
};

