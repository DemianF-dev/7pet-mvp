import axios from 'axios';
import Logger from '../lib/logger';

/**
 * Railway Socket.io Client
 * 
 * Allows backend to emit Socket.io events via HTTP POST to Railway realtime server.
 * This is necessary because Vercel doesn't support WebSocket servers.
 */
class RailwaySocketClient {
    private serverUrl: string;
    private secret: string;
    private enabled: boolean;

    constructor() {
        this.serverUrl = process.env.SOCKET_SERVER_URL || '';
        this.secret = process.env.SOCKET_SERVER_SECRET || '';
        this.enabled = !!this.serverUrl && !!this.secret;

        if (!this.enabled) {
            Logger.warn('⚠️ Railway Socket: SOCKET_SERVER_URL or SOCKET_SERVER_SECRET not configured');
            Logger.warn('⚠️ Real-time events will NOT work!');
        } else {
            Logger.info(`✅ Railway Socket: Connected to ${this.serverUrl}`);
        }
    }

    /**
     * Emit event to all connected clients
     */
    async emit(event: string, data: any): Promise<void> {
        if (!this.enabled) {
            Logger.warn(`Railway Socket disabled - would emit: ${event}`);
            return;
        }

        try {
            await axios.post(`${this.serverUrl}/emit`, {
                event,
                data
            }, {
                headers: {
                    'X-Socket-Secret': this.secret,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });

            Logger.info(`📡 Railway Socket: Emitted ${event}`);
        } catch (error) {
            Logger.error(`❌ Railway Socket: Failed to emit ${event}`, error);
        }
    }

    /**
     * Emit event to specific room
     */
    async emitToRoom(room: string, event: string, data: any): Promise<void> {
        if (!this.enabled) {
            Logger.warn(`Railway Socket disabled - would emit to room ${room}: ${event}`);
            return;
        }

        try {
            await axios.post(`${this.serverUrl}/emit`, {
                event,
                data,
                room
            }, {
                headers: {
                    'X-Socket-Secret': this.secret,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });

            Logger.info(`📡 Railway Socket: Emitted ${event} to room ${room}`);
        } catch (error) {
            Logger.error(`❌ Railway Socket: Failed to emit ${event} to room ${room}`, error);
        }
    }

    /**
     * Notify specific user (uses user:userId room)
     */
    async notifyUser(userId: string, event: string, data: any): Promise<void> {
        return this.emitToRoom(`user:${userId}`, event, data);
    }

    /**
     * Notify chat room (uses chat:conversationId room)
     */
    async notifyChat(conversationId: string, event: string, data: any): Promise<void> {
        return this.emitToRoom(`chat:${conversationId}`, event, data);
    }

    /**
     * Check if user is online (not implemented via HTTP, always returns false)
     * For future: could expose /status endpoint on Railway
     */
    isUserOnline(userId: string): boolean {
        // This requires a GET request to Railway, not implementing for now
        Logger.warn(`Railway Socket: isUserOnline not implemented, returning false for ${userId}`);
        return false;
    }
}

export const railwaySocketClient = new RailwaySocketClient();
