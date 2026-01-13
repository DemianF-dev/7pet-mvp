import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Send, Paperclip, Smile, MoreVertical, Phone, AlertCircle, PlusCircle, Search, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

import { Message } from '../../types/chat';

interface ChatWindowProps {
    conversationId: string;
    onBack?: () => void;
    className?: string;
}

export default function ChatWindow({ conversationId, onBack, className = '' }: ChatWindowProps) {
    const { socket } = useSocket();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [msg, setMsg] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);

    const handleAttention = async () => {
        if (!window.confirm('Chamar atenção de todos nesta conversa?')) return;
        try {
            await api.post(`/chat/${conversationId}/attention`);
        } catch (error) {
            console.error('Erro ao chamar atenção:', error);
        }
    };

    const handleDeleteChat = async () => {
        if (!window.confirm('Tem certeza que deseja apagar esta conversa para todos? ESTA AÇÃO É IRREVERSÍVEL.')) return;
        try {
            await api.delete(`/chat/${conversationId}`);
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            if (onBack) onBack();
        } catch (error) {
            console.error('Erro ao apagar conversa:', error);
            alert('Falha ao apagar conversa.');
        }
    };

    const handleAddParticipant = async (targetUserId: string) => {
        try {
            await api.post(`/chat/${conversationId}/participants`, { userId: targetUserId });
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
            setShowAddModal(false);
        } catch (error) {
            console.error('Erro ao adicionar participante:', error);
            alert('Falha ao adicionar participante.');
        }
    };

    const handleTransferChat = async (targetUserId: string) => {
        if (!window.confirm('Deseja transferir este atendimento? Você perderá acesso à conversa.')) return;
        try {
            await api.post(`/chat/${conversationId}/transfer`, { targetUserId });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            if (onBack) onBack();
            setShowTransferModal(false);
        } catch (error) {
            console.error('Erro ao transferir chat:', error);
            alert('Falha ao transferir chat.');
        }
    };

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
                // If we already have this message (by proper ID), ignore
                if (old?.find(m => m.id === message.id)) return old;

                // Check if we have a temp message with same content (optimistic) and replace it
                // Logic: Find a temp message from 'me' with same content
                const isMyMessage = message.senderId === user?.id;
                if (isMyMessage) {
                    const tempMsgIndex = old?.findIndex(m => m.id.startsWith('temp-') && m.content === message.content);
                    if (tempMsgIndex !== undefined && tempMsgIndex !== -1 && old) {
                        const newCache = [...old];
                        newCache[tempMsgIndex] = message; // Swap temp for real
                        return newCache;
                    }
                }

                return [...(old || []), message];
            });

            // If new message arrives and we are in the chat, mark as read immediately
            api.post(`/chat/${conversationId}/read`).catch(() => { });
            queryClient.setQueryData(['conversations'], (old: any) => {
                if (!old) return old;
                return old.map((conv: any) =>
                    conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
                );
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

    // Scroll on load and mark as read
    useEffect(() => {
        if (messages.length) {
            setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);

            // Mark as read when conversation is opened/messages loaded
            api.post(`/chat/${conversationId}/read`)
                .then(() => {
                    // Update the conversations list unread count optimistically
                    queryClient.setQueryData(['conversations'], (old: any) => {
                        if (!old) return old;
                        return old.map((conv: any) =>
                            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
                        );
                    });
                })
                .catch(err => console.error('Error marking as read:', err));
        }
    }, [messages.length, conversationId, queryClient]);

    const sendMutation = useMutation({
        mutationFn: async (content: string) => {
            return api.post(`/chat/${conversationId}/messages`, { content });
        },
        onMutate: async (newContent) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });

            // Snapshot the previous value
            const previousMessages = queryClient.getQueryData<Message[]>(['messages', conversationId]);

            // Optimistically update to the new value
            const optimisticMessage: Message = {
                id: `temp-${Date.now()}`,
                content: newContent,
                conversationId,
                senderId: user?.id || 'me',
                sender: { id: user?.id || 'me', name: user?.name, color: user?.color },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
                return [...(old || []), optimisticMessage];
            });

            // Scroll to bottom immediately
            setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 10);

            return { previousMessages };
        },
        onError: (err, newContent, context) => {
            if (context?.previousMessages) {
                queryClient.setQueryData(['messages', conversationId], context.previousMessages);
            }
            alert('Falha ao enviar mensagem. Verifique a conexão.');
        },
        onSettled: () => {
            // We don't necessarily need to invalidate immediately if socket handles the real update
            // But it's good practice to ensure consistency
            // queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        },
        onSuccess: (data) => {
            setMsg('');
            // Replace temp ID with real ID in cache if needed, but usually regex replacement or socket/invalidation handles it
            queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
                return old?.map(m => m.id.startsWith('temp-') && m.content === data.data.content ? data.data : m) || [];
            });
        }
    });

    return (
        <div className={`flex flex-col h-full w-full bg-gray-50 dark:bg-gray-900/50 pb-20 md:pb-0 ${className}`}>
            {/* Toolbar */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="md:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 transition-colors">
                            <ChevronDown className="rotate-90" size={20} />
                        </button>
                    )}
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-800 dark:text-gray-100">Bate-papo</span>
                        <span className="text-xs text-green-500 flex items-center gap-1">● Online</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                    {(user?.role === 'ADMIN' || user?.role === 'MASTER' || user?.role === 'GESTAO') && (
                        <button
                            onClick={handleAttention}
                            title="Chamar Atenção"
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-full transition-colors flex items-center gap-1"
                        >
                            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest mr-1">Atenção</span>
                            <AlertCircle size={18} />
                        </button>
                    )}
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><Phone size={18} /></button>
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <MoreVertical size={18} />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/staff/chat?chatId=${conversationId}`;
                                        navigator.clipboard.writeText(url);
                                        setShowMenu(false);
                                        alert('Link da conversa copiado!');
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <Paperclip size={16} /> Compartilhar Conversa
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddModal(true);
                                        setShowMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <PlusCircle size={16} /> Incluir Participante
                                </button>
                                <button
                                    onClick={() => {
                                        setShowTransferModal(true);
                                        setShowMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <MoreVertical size={16} className="rotate-90" /> Transferir Atendimento
                                </button>
                                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                                <button
                                    onClick={handleDeleteChat}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                    <AlertCircle size={16} /> Apagar Conversa
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showAddModal && <UserSelectionModal title="Incluir Participante" onSelect={handleAddParticipant} onClose={() => setShowAddModal(false)} />}
            {showTransferModal && <UserSelectionModal title="Transferir Atendimento" onSelect={handleTransferChat} onClose={() => setShowTransferModal(false)} />}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
                {messages.map((m, index) => {
                    const isMe = m.senderId === user?.id;
                    const msgDate = new Date(m.createdAt);
                    const prevMsg = messages[index - 1];
                    const prevDate = prevMsg ? new Date(prevMsg.createdAt) : null;

                    // Check if we need a day separator
                    const showDaySeparator = !prevDate ||
                        msgDate.toDateString() !== prevDate.toDateString();

                    // Format date for separator
                    const formatDateSeparator = (date: Date) => {
                        const today = new Date();
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);

                        if (date.toDateString() === today.toDateString()) {
                            return 'Hoje';
                        } else if (date.toDateString() === yesterday.toDateString()) {
                            return 'Ontem';
                        } else {
                            return date.toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                            });
                        }
                    };

                    // Format time
                    const formatTime = (date: Date) => {
                        return date.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    };

                    return (
                        <React.Fragment key={m.id}>
                            {showDaySeparator && (
                                <div className="flex justify-center my-4">
                                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-1 rounded-full text-xs font-medium shadow-sm">
                                        {formatDateSeparator(msgDate)}
                                    </span>
                                </div>
                            )}
                            <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`rounded-2xl p-3 px-4 text-sm shadow-sm break-words ${isMe
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700'
                                            }`}
                                    >
                                        <p className="mb-1">{m.content}</p>
                                        <span className={`text-[10px] block text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                            {formatTime(msgDate)}
                                        </span>
                                    </div>
                                    {!isMe && <span className="text-[10px] text-gray-400 mt-1 ml-1">{m.sender?.name}</span>}
                                </div>
                            </div>
                        </React.Fragment>
                    )
                })}
            </div>

            {/* Input Area (Bitrix style) */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-2 border border-transparent focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all">
                    <textarea
                        className="w-full text-sm bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[40px] text-gray-800 dark:text-gray-200 placeholder-gray-400"
                        placeholder="Digite sua mensagem (Ctrl+Enter para enviar)..."
                        value={msg}
                        onChange={e => setMsg(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                if (msg.trim()) {
                                    sendMutation.mutate(msg);
                                    setMsg(''); // Clear immediately for UX
                                }
                            }
                        }}
                    />
                    <div className="flex justify-between items-center mt-2 px-1">
                        <div className="flex gap-2 text-gray-400">
                            <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"><Paperclip size={18} /></button>
                            <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"><Smile size={18} /></button>
                        </div>
                        <button
                            disabled={!msg.trim()} // || sendMutation.isPending -> Removed to allow rapid fire
                            onClick={() => {
                                if (msg.trim()) {
                                    sendMutation.mutate(msg);
                                    setMsg(''); // Clear immediately for UX
                                }
                            }}
                            className="p-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm flex items-center gap-2 text-xs font-bold uppercase tracking-wide"
                        >
                            Enviar <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function UserSelectionModal({ title, onSelect, onClose }: { title: string, onSelect: (id: string) => void, onClose: () => void }) {
    const [query, setQuery] = useState('');
    const { data: results = [], isLoading } = useQuery({
        queryKey: ['users-search', query],
        queryFn: async () => {
            if (!query) return [];
            const res = await api.get(`/chat/users?query=${encodeURIComponent(query)}`);
            return res.data;
        }
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-white">
                    <h3 className="font-bold">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">&times;</button>
                </div>
                <div className="p-4">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar usuário..."
                            className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-lg py-2.5 pl-10 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {isLoading && <div className="text-center py-4 text-gray-400">Buscando...</div>}
                        {results.map((u: any) => (
                            <button
                                key={u.id}
                                onClick={() => onSelect(u.id)}
                                className="w-full text-left p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition flex items-center gap-3"
                            >
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                    <UserIcon size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 block truncate">{u.name}</span>
                                    <span className="text-[10px] text-gray-500">{u.email}</span>
                                </div>
                            </button>
                        ))}
                        {query && results.length === 0 && !isLoading && (
                            <div className="text-center py-4 text-sm text-gray-500">Nenhum usuário encontrado.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
