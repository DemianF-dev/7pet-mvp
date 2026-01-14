import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Menu, MessageSquare, Search, PlusCircle, Video, Phone, MoreVertical, Paperclip, Smile, Send } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

import ConversationList from '../../components/chat/ConversationList';
import ChatWindow from '../../components/chat/ChatWindow';
import { Conversation } from '../../types/chat';

export default function ChatPage() {
    const { user } = useAuthStore();
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Conversations
    const { data: conversations = [], isLoading } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const res = await api.get('/chat/conversations');
            return res.data as Conversation[];
        },
        enabled: Boolean(user)
    });

    // Check for chatId in URL on mount
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const chatId = params.get('chatId');
        if (chatId) {
            setActiveConversationId(chatId);
            // Optional: clear param to avoid re-triggering
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    // New Chat Modal State
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');

    // Search Users
    const { data: searchResults = [], isLoading: isSearchingUsers } = useQuery({
        queryKey: ['users-search', userSearchQuery],
        queryFn: async () => {
            const res = await api.get(`/chat/users?query=${encodeURIComponent(userSearchQuery)}`);
            return res.data as { id: string; name: string; email: string; photo?: string; role?: string; division?: string }[];
        },
        enabled: showNewChatModal
    });

    const queryClient = useQueryClient(); // Don't forget to import this

    // Create Conversation Mutation
    const { mutate: createChat, isPending: isCreating } = useMutation({ // renamed for clarity if needed, or stick to createConversationMutation
        mutationFn: async (userId: string) => {
            return api.post('/chat/conversations', {
                participantIds: [userId],
                type: 'DIRECT'
            });
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            setActiveConversationId(data.data.id);
            setShowNewChatModal(false);
            setSearchQuery(''); // clear local filter
        }
    });
    const createConversationMutation = { mutate: createChat, isPending: isCreating }; // alias for compatibility with my code block below

    // Filter conversations
    const filteredConversations = conversations.filter(c => {
        const otherParticipant = c.participants.find(p => p.user.id !== user?.id)?.user.name;
        const name = c.name || otherParticipant || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <>
            <main className="flex flex-col h-screen overflow-hidden">
                {/* Header (Bitrix Style) */}
                <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shrink-0 z-20">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="text-blue-600" size={24} />
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Bate-papo e Chamadas</h1>
                    </div>
                    <button
                        onClick={() => setShowNewChatModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <PlusCircle size={18} /> Nova Conversa
                    </button>
                </div>

                {/* Main Content Area - Dual Pane */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Pane - List */}
                    <div className={`w-full md:w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                        {/* Search & Actions */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar..."
                                    className="w-full bg-gray-100 dark:bg-gray-700/50 border-none rounded-full py-2 pl-10 text-sm focus:ring-1 focus:ring-blue-500"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                {/* Categories or Filters placeholder */}
                                <button className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">Recentes</button>
                                <button className="px-3 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-medium rounded-full transition-colors">Trabalho</button>
                                <button className="px-3 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-medium rounded-full transition-colors">Privado</button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-hidden">
                            <ConversationList
                                conversations={filteredConversations}
                                onSelect={setActiveConversationId}
                                activeId={activeConversationId}
                            />
                        </div>
                    </div>

                    {/* Right Pane - Chat Window */}
                    <div className={`flex-1 bg-gray-50 dark:bg-gray-900/50 flex flex-col items-center justify-center ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                        {activeConversationId ? (
                            <ChatWindow
                                conversationId={activeConversationId}
                                onBack={() => setActiveConversationId(null)}
                                className="h-full w-full"
                            />
                        ) : (
                            <div className="text-center p-8 text-gray-400 flex flex-col items-center">
                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                    <MessageSquare size={32} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Selecione uma conversa</h3>
                                <p className="text-sm max-w-xs mt-2">Escolha uma pessoa ou grupo na lista lateral para iniciar o bate-papo.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main >

            {/* New Chat Modal (Global Search) */}
            {
                showNewChatModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                                <h3 className="font-bold text-gray-800 dark:text-white">Nova Conversa</h3>
                                <button onClick={() => setShowNewChatModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none">&times;</button>
                            </div>

                            <div className="p-4">
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar usuário (nome ou email)..."
                                        className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded-lg py-2.5 pl-10 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
                                        value={userSearchQuery}
                                        onChange={e => setUserSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {isSearchingUsers && <div className="text-center py-4 text-gray-400 text-sm">Buscando...</div>}

                                    {!isSearchingUsers && searchResults.length === 0 && (
                                        <div className="text-center py-4 text-gray-400 text-sm">Nenhum usuário encontrado.</div>
                                    )}

                                    {searchResults.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => createConversationMutation.mutate(u.id)}
                                            disabled={createConversationMutation.isPending}
                                            className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition flex items-center gap-3 group disabled:opacity-50"
                                        >
                                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0">
                                                {u.photo ? <img src={u.photo} alt={u.name} className="w-full h-full object-cover" /> : <UserIcon size={20} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 block truncate">{u.name}</span>
                                                <div className="flex gap-2 text-xs">
                                                    <span className="text-gray-500 dark:text-gray-400">{u.email}</span>
                                                    <span className="bg-gray-100 dark:bg-gray-700 px-1.5 rounded text-gray-600 dark:text-gray-300 uppercase scale-90 origin-left">{u.role || u.division}</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}

function UserIcon({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
