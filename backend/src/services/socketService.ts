import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import Logger from '../lib/logger';

class SocketService {
    private io: Server | null = null;
    private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>

    // Private Helpers
    private linkUser(userId: string, socket: Socket) {
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
            this.io?.emit('user_status', { userId, status: 'online' });
        }
        this.userSockets.get(userId)?.add(socket.id);
        socket.join(`user:${userId}`);
        socket.data.userId = userId;
        Logger.info(`👤 User ${userId} linked to socket ${socket.id}. sessions: ${this.userSockets.get(userId)?.size}`);
    }

    private async unlinkUser(userId: string | undefined, socketId: string) {
        if (!userId) return;
        const userSessions = this.userSockets.get(userId);
        if (userSessions) {
            userSessions.delete(socketId);
            if (userSessions.size === 0) {
                this.userSockets.delete(userId);
                this.io?.emit('user_status', { userId, status: 'offline' });

                // Update Last Seen in DB
                try {
                    // Lazy import to avoid circular dependencies if any, though top-level is fine usually
                    const prisma = require('../lib/prisma').default;
                    await prisma.user.update({
                        where: { id: userId },
                        data: { lastSeenAt: new Date() }
                    });
                } catch (e) {
                    Logger.error(`Failed to update lastSeenAt for user ${userId}:`, e);
                }
            }
        }
    }

    initialize(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: [
                    'http://localhost:5173',
                    'http://127.0.0.1:5173',
                    'http://localhost:3000',
                    'http://localhost:5174',
                    'https://my7.pet',
                    'https://www.my7.pet',
                    'https://7pet-mvp.vercel.app',
                    'https://7pet-backend.vercel.app'
                ],
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        // 🛡️ Socket.io Handshake Middleware (Authentication)
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            const secret = process.env.JWT_SECRET;

            if (!token || !secret) {
                Logger.warn('🔌 Socket blocked: Missing token or JWT_SECRET');
                return next(new Error('Authentication error: Missing token'));
            }

            try {
                const decoded: any = jwt.verify(token, secret, {
                    algorithms: ['HS256']
                });
                socket.data.userId = decoded.userId;
                next();
            } catch (err) {
                Logger.error('🔌 Socket blocked: Invalid token');
                next(new Error('Authentication error: Invalid token'));
            }
        });

        this.io.on('connection', (socket: Socket) => {
            Logger.info(`🔌 Socket connected: ${socket.id}`);

            // User ID is now securely stored in socket.data from the middleware
            const userId = socket.data.userId;

            if (userId) {
                this.linkUser(userId, socket);
            }

            // Handle manual re-identification if needed (e.g. after temp token refresh)
            socket.on('identify', (data: { userId: string }) => {
                if (data.userId && data.userId !== userId) {
                    Logger.info(`👤 Socket ${socket.id} re-identifying as ${data.userId}`);
                    this.unlinkUser(userId, socket.id);
                    this.linkUser(data.userId, socket);
                }
            });

            socket.on('disconnect', () => {
                Logger.info(`🔌 Socket disconnected: ${socket.id}`);
                const currentUserId = socket.data.userId;
                if (currentUserId) {
                    this.unlinkUser(currentUserId, socket.id);
                }
            });

            // Handle joining chat rooms
            socket.on('join_chat', (conversationId: string) => {
                socket.join(`chat:${conversationId}`);
                Logger.info(`Socket ${socket.id} joined chat:${conversationId}`);
            });
            socket.on('leave_chat', (conversationId: string) => {
                socket.leave(`chat:${conversationId}`);
            });
        });

        Logger.info('✅ SocketService initialized');
    }

    getIO(): Server {
        if (!this.io) {
            throw new Error('Socket.io not initialized!');
        }
        return this.io;
    }

    // Helpers
    notifyUser(userId: string, event: string, data: any) {
        Logger.info(`🔔 Socket: Emitting ${event} to user:${userId}`);
        this.io?.to(`user:${userId}`).emit(event, data);
    }

    notifyChat(conversationId: string, event: string, data: any) {
        Logger.info(`🔔 Socket: Emitting ${event} to chat:${conversationId}`);
        this.io?.to(`chat:${conversationId}`).emit(event, data);
    }

    isUserOnline(userId: string): boolean {
        return this.userSockets.has(userId) && (this.userSockets.get(userId)?.size || 0) > 0;
    }

    emit(event: string, data: any) {
        Logger.info(`🔔 Socket: Broadcasting ${event} to all`);
        this.io?.emit(event, data);
    }
}

export const socketService = new SocketService();
