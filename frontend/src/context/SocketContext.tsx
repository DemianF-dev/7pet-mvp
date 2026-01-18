import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

interface SocketContextData {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextData>({} as SocketContextData);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, token } = useAuthStore();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!user || !token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

        // Connect immediately without timeout
        // In production, we might need a specific VITE_SOCKET_URL if the backend is on a different domain/port
        const targetUrl = import.meta.env.VITE_SOCKET_URL || socketUrl;

        if (import.meta.env.DEV) {
            console.log(`🔌 Initializing Socket.io connection to: ${targetUrl}`);
        }

        const newSocket = io(targetUrl, {
            query: { userId: user.id },
            auth: { token },
            transports: ['polling', 'websocket'], // Use polling first for Vercel compatibility
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 500, // Faster retry
            reconnectionAttempts: 10,
            timeout: 5000,
        });

        newSocket.on('connect', () => {
            if (import.meta.env.DEV) console.log('🔌 Socket connected:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            if (import.meta.env.DEV) console.log('🔌 Socket disconnected:', reason);
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [user?.id, token]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
