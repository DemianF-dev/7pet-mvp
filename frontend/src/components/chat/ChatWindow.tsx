import React, { useState, useEffect, useRef } from 'react';
import { socketManager } from '../../services/socketManager';
import api from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Send, Paperclip, Smile, MoreVertical, Phone, AlertCircle, PlusCircle, Search, User as UserIcon, File as FileIcon, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

import { Message, Conversation } from '../../types/chat';
import AppImage from '../ui/AppImage';


interface ChatWindowProps {
    conversationId: string;
    onBack?: () => void;
    className?: string;
}

export default function ChatWindow({ conversationId, onBack, className = '' }: ChatWindowProps) {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [msg, setMsg] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    // Fetch conversation details
    const { data: conversation } = useQuery({
        queryKey: ['conversation', conversationId],
        queryFn: async () => {
            const res = await api.get(`/chat/${conversationId}`);
            return res.data as Conversation;
        },
        enabled: !!conversationId
    });

    const { data: messages = [] } = useQuery({
        queryKey: ['messages', conversationId],
        queryFn: async () => {
            const res = await api.get(`/chat/${conversationId}/messages`);
            return res.data as Message[];
        }
    });

    // Listen for new messages
    useEffect(() => {
        if (!conversationId) return;

        socketManager.emit('join_chat', conversationId);

        const handleMsg = (message: Message) => {
            if (message.conversationId !== conversationId) return;
            queryClient.setQueryData(['messages', conversationId], (old: Message[] | undefined) => {
                if (old?.find(m => m.id === message.id)) return old;
                const isMyMessage = message.senderId === user?.id;
                if (isMyMessage) {
                    const tempMsgIndex = old?.findIndex(m => m.id.startsWith('temp-') && m.content === message.content);
                    if (tempMsgIndex !== undefined && tempMsgIndex !== -1 && old) {
                        const newCache = [...old];
                        newCache[tempMsgIndex] = message;
                        return newCache;
                    }
                }
                return [...(old || []), message];
            });

            api.post(`/chat/${conversationId}/read`).catch(() => { });
            queryClient.setQueryData(['conversations'], (old: any) => {
                if (!old) return old;
                return old.map((conv: any) =>
                    conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
                );
            });

            setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
        };

        socketManager.on('chat:new_message', handleMsg);

        return () => {
            socketManager.off('chat:new_message', handleMsg);
            socketManager.emit('leave_chat', conversationId);
        }
    }, [conversationId, queryClient, user?.id]);

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
        mutationFn: async (payload: { content?: string, fileUrl?: string, fileType?: string, fileName?: string }) => {
            const res = await api.post(`/chat/${conversationId}/messages`, payload);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
            setMsg('');
        }
    });

    const handleFileUpload = async (file: File) => {
        if (!file) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post('/chat/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // After upload, send as message
            sendMutation.mutate({
                fileUrl: res.data.url,
                fileType: res.data.fileType,
                fileName: res.data.fileName
            });
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Falha ao enviar arquivo.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    return (
        <div className={`flex flex-col h-full w-full bg-gray-50 dark:bg-gray-900/50 overflow-hidden relative ${className}`}>
            {/* Toolbar */}
            <div className="h-16 shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between z-10 px-4 shadow-sm">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 transition-colors">
                            <ChevronDown className="rotate-90" size={24} />
                        </button>
                    )}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 overflow-hidden">
                            {conversation?.participants.find(p => p.user.id !== user?.id)?.user.name.charAt(0).toUpperCase() || 'BP'}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-800 dark:text-gray-100 leading-tight">
                                {conversation?.name ||
                                    conversation?.participants.find(p => p.user.id !== user?.id)?.user.name ||
                                    'Canal de Atendimento'}
                            </span>
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                Online agora
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                    {(user?.role === 'ADMIN' || user?.role === 'MASTER' || user?.role === 'GESTAO') && (
                        <button
                            onClick={handleAttention}
                            title="Chamar Atenção"
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-full transition-colors flex items-center gap-1"
                        >
                            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest mr-1">Atenção</span>
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scroll-smooth custom-scrollbar" ref={scrollRef}>
                <div className="flex flex-col gap-4">
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
                                        <div className={`p-4 rounded-2xl relative shadow-sm transition-all hover:shadow-md ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-tl-none'}`}>
                                            {!isMe && <span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5 text-blue-600 dark:text-blue-400">{m.sender?.name}</span>}

                                            {/* File Rendering */}
                                            {m.fileUrl && (
                                                <div className="mb-3">
                                                    {m.fileType?.startsWith('image/') ? (
                                                        <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-black/5 hover:border-black/10 transition-all">
                                                            <AppImage src={m.fileUrl} alt={m.fileName || 'Image'} className="max-w-full h-auto max-h-80 object-cover" />
                                                        </a>
                                                    ) : (
                                                        <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isMe ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-gray-50 dark:bg-gray-700 border-gray-100 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600'}`}>
                                                                <FileIcon size={20} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold truncate">{m.fileName}</p>
                                                                <p className="text-[10px] opacity-70 font-bold uppercase tracking-tighter">{m.fileType?.split('/')[1] || 'DOC'}</p>
                                                            </div>
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {m.content && <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed tracking-tight">{m.content}</p>}
                                            <div className={`flex items-center justify-end gap-1 mt-1.5 opacity-60`}>
                                                <span className="text-[9px] font-bold">
                                                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Input Area */}
            <div
                className={`p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 relative ${isDragging ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {isDragging && (
                    <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[2px] z-10 flex items-center justify-center pointer-events-none border-2 border-dashed border-blue-600 rounded-lg m-2">
                        <div className="flex flex-col items-center text-blue-600 bg-white/90 dark:bg-gray-800/90 p-4 rounded-2xl shadow-xl animate-in zoom-in duration-200">
                            <Paperclip size={32} className="mb-2" />
                            <span className="font-bold">Solte para enviar arquivo</span>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 max-w-6xl mx-auto">
                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all hover:text-blue-600 disabled:opacity-50"
                        title="Anexar arquivo"
                    >
                        {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
                    </button>
                    <button className="p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all hover:text-yellow-500"><Smile size={20} /></button>
                    <div className="flex-1 relative">
                        <textarea
                            rows={1}
                            placeholder="Escreva uma mensagem..."
                            className="w-full bg-gray-100 dark:bg-gray-700/50 border-none rounded-2xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 resize-none max-h-32 transition-all dark:text-white"
                            value={msg}
                            onChange={e => setMsg(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (msg.trim()) sendMutation.mutate({ content: msg.trim() });
                                }
                            }}
                        />
                    </div>
                    <button
                        onClick={() => msg.trim() && sendMutation.mutate({ content: msg.trim() })}
                        disabled={!msg.trim() || sendMutation.isPending}
                        className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:grayscale"
                    >
                        <Send size={20} />
                    </button>
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
