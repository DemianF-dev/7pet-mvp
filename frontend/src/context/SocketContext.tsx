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

        // Delay socket connection to not block initial render
        const connectTimeout = setTimeout(() => {
            const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

            // Ensure we connect to base URL, socket.io handles /socket.io path
            const newSocket = io(socketUrl, {
                query: { userId: user.id },
                auth: { token },
                transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
                autoConnect: true,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 3, // Limit reconnection attempts
                timeout: 10000, // Connection timeout
            });

            newSocket.on('connect', () => {
                if (import.meta.env.DEV) console.log('🔌 Socket connected');
                setIsConnected(true);
            });

            newSocket.on('disconnect', () => {
                if (import.meta.env.DEV) console.log('🔌 Socket disconnected');
                setIsConnected(false);
            });

            newSocket.on('connect_error', (error) => {
                if (import.meta.env.DEV) console.log('Socket connection error (non-critical):', error.message);
            });

            setSocket(newSocket);
        }, 1000); // Wait 1 second before connecting

        return () => {
            clearTimeout(connectTimeout);
            if (socket) {
                socket.disconnect();
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
