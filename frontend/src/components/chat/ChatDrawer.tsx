import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, X, Send, User, ChevronDown, Minimize2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

// Types
interface Conversation {
    id: string;
    type: string;
    name?: string;
    lastMessageAt: string;
    participants: { user: { id: string; name: string; color?: string } }[];
    messages: Message[];
}

interface Message {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    sender: { id: string; name: string };
    conversationId: string;
}

export default function ChatDrawer() {
    const { socket } = useSocket();
    const { user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    // Fetch Conversations
    const { data: conversations = [] } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const res = await api.get('/chat/conversations');
            return res.data as Conversation[];
        },
        enabled: Boolean(user)
    });

    if (!user) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end print:hidden">
            {/* Main Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 h-[500px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all animate-in slide-in-from-bottom-4 duration-200">
                    {/* Header */}
                    <div className="p-3 bg-blue-600 text-white flex justify-between items-center shadow-sm z-10">
                        <div className="font-semibold flex items-center gap-2">
                            <MessageSquare size={18} />
                            Chat Interno
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition">
                            <Minimize2 size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex overflow-hidden relative">
                        {activeConversationId ? (
                            <ChatWindow
                                conversationId={activeConversationId}
                                onBack={() => setActiveConversationId(null)}
                            />
                        ) : (
                            <ConversationList
                                conversations={conversations}
                                onSelect={setActiveConversationId}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Float Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform active:scale-95 hover:bg-blue-700"
                >
                    <MessageSquare size={24} />
                    {/* Badge logic here */}
                </button>
            )}
        </div>
    );
}

function ConversationList({ conversations, onSelect }: { conversations: Conversation[], onSelect: (id: string) => void }) {
    const { user } = useAuthStore();

    return (
        <div className="w-full h-full overflow-y-auto p-2 space-y-1 bg-gray-50 dark:bg-gray-900/50">
            <div className="text-xs font-semibold text-gray-500 px-2 py-2 uppercase tracking-wider">Conversas Recentes</div>

            {conversations.length === 0 && (
                <div className="text-center text-sm text-gray-400 py-8 flex flex-col items-center gap-2">
                    <MessageSquare size={32} className="opacity-20" />
                    Nenhuma conversa iniciada
                </div>
            )}

            {conversations.map(conv => {
                const otherParticipant = conv.participants.find(p => p.user.id !== user?.id)?.user;
                const name = conv.name || otherParticipant?.name || 'Chat';
                const lastMsg = conv.messages[0]?.content || 'Inicie uma conversa';

                return (
                    <button
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-white dark:hover:bg-gray-800 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700 flex gap-3 items-center transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 shrink-0">
                            {name[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate dark:text-gray-200">{name}</div>
                            <div className="text-xs text-gray-500 truncate group-hover:text-gray-700 dark:group-hover:text-gray-400">{lastMsg}</div>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}

function ChatWindow({ conversationId, onBack }: { conversationId: string, onBack: () => void }) {
    const { socket } = useSocket();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [msg, setMsg] = useState('');

    const { data: messages = [] } = useQuery({
        queryKey: ['messages', conversationId],
        queryFn: async () => {
            const res = await api.get(`/chat/${conversationId}/messages`);
            return res.data as Message[];
        }
    });

    // Listen for new messages
    useEffect(() => {
        if (!socket) return;

        socket.emit('join_chat', conversationId);

        const handleMsg = (message: Message) => {
            if (message.conversationId !== conversationId) return;
            queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
                if (old?.find(m => m.id === message.id)) return old;
                return [...(old || []), message];
            });
            // Force scroll to bottom
            setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
        };

        socket.on('chat:new_message', handleMsg);

        return () => {
            socket.off('chat:new_message', handleMsg);
            socket.emit('leave_chat', conversationId);
        }
    }, [conversationId, socket, queryClient]);

    // Scroll on load
    useEffect(() => {
        if (messages.length) {
            setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
        }
    }, [messages.length, conversationId]);

    const sendMutation = useMutation({
        mutationFn: async () => {
            return api.post(`/chat/${conversationId}/messages`, { content: msg });
        },
        onSuccess: () => {
            setMsg('');
            setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
        }
    });

    return (
        <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-900/50">
            {/* Toolbar */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-2 z-10">
                <button onClick={onBack} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 transition-colors">
                    <ChevronDown className="rotate-90" size={20} />
                </button>
                <div className="font-semibold text-sm text-gray-700 dark:text-gray-200">Conversa</div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
                {messages.map(m => {
                    const isMe = m.senderId === user?.id;
                    return (
                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[85%] rounded-2xl p-2.5 px-4 text-sm shadow-sm break-words ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700'
                                    }`}
                            >
                                {m.content}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Input */}
            <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <input
                    className="flex-1 text-sm bg-gray-100 dark:bg-gray-700 border-none rounded-full px-4 focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-900 transition-colors"
                    placeholder="Digite sua mensagem..."
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && msg.trim() && sendMutation.mutate()}
                />
                <button
                    disabled={!msg.trim() || sendMutation.isPending}
                    onClick={() => sendMutation.mutate()}
                    className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    )
}
