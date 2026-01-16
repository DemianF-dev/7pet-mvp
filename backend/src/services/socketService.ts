import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import Logger from '../lib/logger';

class SocketService {
    private io: Server | null = null;
    private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>

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

        this.io.on('connection', (socket: Socket) => {
            Logger.info(`🔌 Socket connected: ${socket.id}`);

            // Basic auth handshake or queryparam
            const userId = socket.handshake.query.userId as string;
            if (userId) {
                if (!this.userSockets.has(userId)) {
                    this.userSockets.set(userId, new Set());
                    // Notify everyone that this user came online
                    this.io?.emit('user_status', { userId, status: 'online' });
                }
                this.userSockets.get(userId)?.add(socket.id);

                socket.join(`user:${userId}`);
                Logger.info(`👤 User ${userId} linked to socket ${socket.id}. Online: ${this.userSockets.get(userId)?.size} sessions.`);
            }

            socket.on('disconnect', () => {
                Logger.info(`🔌 Socket disconnected: ${socket.id}`);
                if (userId) {
                    const userSessions = this.userSockets.get(userId);
                    if (userSessions) {
                        userSessions.delete(socket.id);
                        if (userSessions.size === 0) {
                            this.userSockets.delete(userId);
                            // Notify everyone that this user went offline
                            this.io?.emit('user_status', { userId, status: 'offline' });
                        }
                    }
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
