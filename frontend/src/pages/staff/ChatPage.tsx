import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Search, PlusCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import type { User } from '../../types/user';

import ConversationList from '../../components/chat/ConversationList';
import ChatWindow from '../../components/chat/ChatWindow';
import { Conversation } from '../../types/chat';
import QueryState from '../../components/system/QueryState';
import AppImage from '../../components/ui/AppImage';


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
            const query = userSearchQuery.trim();
            const url = query ? `/chat/users?query=${encodeURIComponent(query)}` : '/chat/users';
            console.log(`[ChatPage] Buscando usuários. URL: ${url}, Query: "${query}"`);
            
            const res = await api.get(url);
            console.log(`[ChatPage] Resposta da API:`, res.data);
            
            // Se não houver query, tentar obter todos os usuários
            if (!query || query.trim() === '') {
                console.log('[ChatPage] Query vazia, buscando todos os usuários...');
            }
            
            // Debug: Verificar estrutura da resposta
            console.log('[ChatPage] Estrutura da resposta:', typeof res.data, Array.isArray(res.data));
            
            // Tentar diferentes abordagens dependendo da estrutura
            let users = [];
            
            if (Array.isArray(res.data)) {
                // A resposta já é um array
                users = res.data;
            } else if (res.data && Array.isArray(res.data.users)) {
                // A resposta tem propriedade 'users'
                users = res.data.users;
            } else if (res.data && res.data.debug && Array.isArray(res.data.users)) {
                // A resposta tem dados de debug
                users = res.data.users;
            } else {
                console.error('[ChatPage] Estrutura de resposta inesperada:', res.data);
                users = [];
            }
            
            console.log(`[ChatPage] Usuários recebidos (bruto): ${users.length}`);
            
            // Filter out current user
            const filteredUsers = users.filter((u: any) => u.id !== user?.id);
            console.log(`[ChatPage] Usuários após filtro (exceto ${user?.id}): ${filteredUsers.length}`);
            
            return filteredUsers;
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
            <section className="h-[calc(100vh-32px)] md:h-[calc(100vh-32px)] flex flex-col overflow-hidden bg-white dark:bg-gray-800 rounded-inherit relative">
                {/* Header (Bitrix Style) */}
                <div className="h-16 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-6 shrink-0 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                            <MessageSquare size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">Centro de Mensagens</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Colaboração e Atendimento</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowNewChatModal(true)}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 uppercase tracking-widest"
                    >
                        <PlusCircle size={14} strokeWidth={3} /> Nova Conversa
                    </button>
                </div>

                {/* Main Content Area - Dual Pane */}
                <div className="flex-1 flex overflow-hidden min-h-0">
                    {/* Left Pane - List */}
                    <div className={`w-full md:w-80 border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex flex-col shrink-0 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                        {/* Search & Actions */}
                        <div className="p-4 space-y-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Pesquisar conversas..."
                                    className="w-full bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-2xl py-2.5 pl-11 pr-4 text-sm font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all outline-none"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                                <button className="px-4 py-2 bg-blue-600 text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/20 shrink-0">Recentes</button>
                                <button className="px-4 py-2 text-gray-500 hover:bg-white dark:hover:bg-gray-700 text-[9px] font-black rounded-full uppercase tracking-widest transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-600 shrink-0">Favoritos</button>
                                <button className="px-4 py-2 text-gray-500 hover:bg-white dark:hover:bg-gray-700 text-[9px] font-black rounded-full uppercase tracking-widest transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-600 shrink-0">Grupos</button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-hidden min-h-0">
                            <QueryState
                                isLoading={isLoading}
                                className="h-full"
                            >
                                <ConversationList
                                    conversations={filteredConversations}
                                    onSelect={setActiveConversationId}
                                    activeId={activeConversationId}
                                />
                            </QueryState>
                        </div>
                    </div>

                    {/* Right Pane - Chat Window */}
                    <div className={`flex-1 bg-white dark:bg-gray-800 flex flex-col overflow-hidden min-h-0 ${!activeConversationId ? 'items-center justify-center' : ''}`}>
                        {activeConversationId ? (
                            <ChatWindow
                                conversationId={activeConversationId}
                                onBack={() => setActiveConversationId(null)}
                                className="h-full"
                            />
                        ) : (
                            <div className="text-center p-12 text-gray-400 flex flex-col items-center animate-in fade-in zoom-in duration-700 max-w-sm">
                                <div className="w-28 h-28 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-[40px] shadow-2xl flex items-center justify-center mb-8 text-blue-500 relative group">
                                    <div className="absolute inset-0 bg-blue-500/20 rounded-inherit blur-2xl group-hover:blur-3xl transition-all duration-1000 opacity-50" />
                                    <MessageSquare size={48} strokeWidth={1.2} className="relative transform group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-800 dark:text-gray-100 tracking-tight mb-4">Suas conversas aparecem aqui</h3>
                                <p className="text-sm font-medium text-gray-400 leading-relaxed">
                                    Conecte-se com sua equipe em tempo real. Selecione uma conversa ao lado ou inicie uma nova para começar.
                                </p>
                                <button
                                    onClick={() => setShowNewChatModal(true)}
                                    className="mt-8 px-8 py-3 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all active:scale-95"
                                >
                                    Iniciar Novo Papo
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

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

                                <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                                    {isSearchingUsers && <div className="text-center py-4 text-gray-400 text-sm">Buscando...</div>}

                                    {!isSearchingUsers && searchResults.length === 0 && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                            {userSearchQuery.trim() ? 'Nenhum usuário encontrado para esta busca.' : 'Nenhum usuário disponível no momento.'}
                                        </div>
                                    )}

                                    {searchResults.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => createConversationMutation.mutate(u.id)}
                                            disabled={createConversationMutation.isPending}
                                            className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition flex items-center gap-3 group disabled:opacity-50"
                                        >
                                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0">
                                                {u.photo ? <AppImage src={u.photo} alt={u.name} className="w-full h-full object-cover" /> : <UserIcon size={20} />}
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
