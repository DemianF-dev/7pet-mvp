import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import Logger from '../lib/logger';

class SocketService {
    private io: Server | null = null;
    private userSockets: Map<string, string> = new Map(); // userId -> socketId

    initialize(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: '*', // Allow all origins for now (adjust for prod)
                methods: ['GET', 'POST']
            }
        });

        this.io.on('connection', (socket: Socket) => {
            Logger.info(`🔌 Socket connected: ${socket.id}`);

            // Basic auth handshake or queryparam
            const userId = socket.handshake.query.userId as string;
            if (userId) {
                this.userSockets.set(userId, socket.id);
                socket.join(`user:${userId}`);
                Logger.info(`👤 User ${userId} linked to socket ${socket.id}`);
            }

            socket.on('disconnect', () => {
                Logger.info(`🔌 Socket disconnected: ${socket.id}`);
                if (userId) {
                    this.userSockets.delete(userId);
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

    emit(event: string, data: any) {
        Logger.info(`🔔 Socket: Broadcasting ${event} to all`);
        this.io?.emit(event, data);
    }
}

export const socketService = new SocketService();
