import { io, Socket } from 'socket.io-client';
import { useSocketStore } from '../store/socketStore';
import logger from '../utils/logger';

/**
 * SocketManager Singleton
 * Controls the Socket.io lifecycle for the entire application.
 * Optimized for mobile: handles pause/resume, reconnection limits, and auth-ready connection.
 */
class SocketManager {
    private socket: Socket | null = null;
    private userId: string | null = null;
    private token: string | null = null;
    private isPaused: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 6;
    private disabledUntil: number = 0;

    /**
     * Get the raw socket instance if needed
     */
    getRawSocket(): Socket | null {
        return this.socket;
    }

    /**
     * Connect to the socket server
     * Only works if userId and token are provided and we are not in the "disabled" period
     */
    connect(userId: string, token: string) {
        if (this.disabledUntil > Date.now()) {
            const waitTime = Math.ceil((this.disabledUntil - Date.now()) / 1000);
            logger.warn(`🔌 Socket connection disabled for another ${waitTime}s (Circuit Breaker)`);
            useSocketStore.getState().setStatus('error');
            return;
        }

        if (this.socket?.connected && this.userId === userId && this.token === token) {
            return;
        }

        // Clean up previous socket if exists
        if (this.socket) {
            this.socket.disconnect();
        }

        this.userId = userId;
        this.token = token;

        const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

        logger.debug('🔌 Initializing socket connection', { url: socketUrl });
        useSocketStore.getState().setStatus('connecting');

        this.socket = io(socketUrl, {
            auth: { token },
            // We'll move userId to an 'identify' event after connection to avoid PII in logs/query
            transports: ['websocket', 'polling'], // Prefer websocket, fallback to polling
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts,
            timeout: 10000,
        });

        this.setupListeners();
    }

    private setupListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            logger.info('🔌 Socket connected', { id: this.socket?.id });
            this.reconnectAttempts = 0;

            // audit-v2: Log transport name (DEV ONLY)
            if (import.meta.env.DEV) {
                console.log(`[SOCKET_AUDIT] transport: ${this.socket?.io.engine.transport.name}`);
                const listeners = (this.socket as any)._callbacks ? Object.keys((this.socket as any)._callbacks).length : 0;
                console.log(`[SOCKET_AUDIT] total event categories: ${listeners}`);
            }

            useSocketStore.getState().setConnected(this.socket?.id, this.socket?.io.engine.transport.name);

            // Identify user safely
            if (this.userId) {
                this.socket?.emit('identify', { userId: this.userId });
            }
        });

        this.socket.on('disconnect', (reason) => {
            logger.warn('🔌 Socket disconnected', { reason });
            useSocketStore.getState().setStatus('disconnected');

            if (reason === 'io server disconnect') {
                // the disconnection was initiated by the server, you need to reconnect manually
                if (!this.isPaused) this.socket?.connect();
            }
        });

        this.socket.on('connect_error', (error) => {
            this.reconnectAttempts++;
            logger.error('🔌 Socket connection error', {
                message: error.message,
                attempt: this.reconnectAttempts
            });

            useSocketStore.getState().setError(error.message, this.reconnectAttempts);

            // Circuit Breaker: if we fail too many times, disable connection for 2 minutes
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.disabledUntil = Date.now() + 120000; // 2 minutes
                logger.error('🚨 Socket Circuit Breaker triggered. Disabling for 2 minutes.');
                useSocketStore.getState().setDisabledUntil(this.disabledUntil);
                this.socket?.disconnect();
            }
        });

        // Listen for transport upgrades
        this.socket.io.engine.on('upgrade', (transport) => {
            logger.debug('🔌 Socket transport upgraded', { transport: transport.name });
            useSocketStore.getState().setTransport(transport.name);
        });
    }

    disconnect(reason: string = 'manual') {
        logger.info('🔌 Socket manual disconnect', { reason });
        this.socket?.disconnect();
        this.userId = null;
        this.token = null;
        useSocketStore.getState().setStatus('disconnected');
    }

    /**
     * Called when app goes to background
     */
    pause() {
        if (this.socket?.connected) {
            logger.debug('🔌 Pausing socket connection (Background)');
            this.isPaused = true;
            this.socket.disconnect();
            useSocketStore.getState().setStatus('paused');
        }
    }

    /**
     * Called when app returns to foreground
     */
    resume() {
        if (this.isPaused && this.userId && this.token) {
            logger.debug('🔌 Resuming socket connection (Foreground)');
            this.isPaused = false;
            this.connect(this.userId, this.token);
        }
    }

    on(event: string, handler: (...args: any[]) => void) {
        this.socket?.on(event, handler);
    }

    off(event: string, handler: (...args: any[]) => void) {
        this.socket?.off(event, handler);
    }

    emit(event: string, data: any) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            logger.warn(`🔌 Cannot emit ${event}: socket not connected`);
        }
    }

    getStatus() {
        return useSocketStore.getState().status;
    }
}

export const socketManager = new SocketManager();
