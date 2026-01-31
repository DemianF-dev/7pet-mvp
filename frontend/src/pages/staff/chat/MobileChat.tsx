import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Plus, Search, X, User as UserIcon } from 'lucide-react';
import { MobileShell } from '../../../layouts/MobileShell';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';
import ConversationList from '../../../components/chat/ConversationList';
import ChatWindow from '../../../components/chat/ChatWindow';
import { Conversation } from '../../../types/chat';
import { AppImage } from '../../../components/ui';
import { toast } from 'react-hot-toast';

export const MobileChat = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');

    // Fetch Conversations
    const { data: conversations = [], isLoading } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const res = await api.get('/chat/conversations');
            return res.data as Conversation[];
        },
        enabled: Boolean(user)
    });

    const filteredConversations = useMemo(() => {
        return conversations.filter(c => {
            const otherParticipant = c.participants.find(p => p.user.id !== user?.id)?.user.name;
            const name = c.name || otherParticipant || '';
            return name.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [conversations, searchTerm, user?.id]);

    // Search Users for New Chat
    const { data: searchResults = [], isLoading: isSearchingUsers } = useQuery({
        queryKey: ['users-search', userSearchQuery],
        queryFn: async () => {
            const query = userSearchQuery.trim();
            const url = query ? `/chat/users?query=${encodeURIComponent(query)}` : '/chat/users';
            const res = await api.get(url);

            let users = [];
            if (Array.isArray(res.data)) {
                users = res.data;
            } else if (res.data && Array.isArray(res.data.users)) {
                users = res.data.users;
            }

            return users.filter((u: any) => u.id !== user?.id);
        },
        enabled: showNewChatModal
    });

    // Create Conversation Mutation
    const createChatMutation = useMutation({
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
            setUserSearchQuery('');
        }
    });

    // If a conversation is active, show the Chat Window (Full Screen Mobile)
    if (activeConversationId) {
        return (
            <div className="fixed inset-0 z-[100] bg-white dark:bg-zinc-900 flex flex-col animate-in slide-in-from-right duration-300">
                <ChatWindow
                    conversationId={activeConversationId}
                    onBack={() => setActiveConversationId(null)}
                    className="flex-1"
                />
            </div>
        );
    }

    return (
        <MobileShell
            title="Chat & Suporte"
            rightAction={
                <button
                    onClick={() => setShowNewChatModal(true)}
                    className="p-2 text-blue-600 active:scale-90 transition-transform"
                >
                    <Plus size={28} strokeWidth={2.5} />
                </button>
            }
        >
            <div className="space-y-6 pb-24">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="search"
                        placeholder="Buscar conversas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium shadow-sm"
                    />
                </div>

                {/* List */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sincronizando Mensagens...</p>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center px-10">
                        <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center mb-6">
                            <MessageSquare size={40} className="opacity-20" />
                        </div>
                        <p className="font-bold text-gray-600 dark:text-gray-300">Nenhuma conversa encontrada</p>
                        <p className="text-xs mt-1">Busque um colega clicando no botão de "+" no topo.</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <ConversationList
                            conversations={filteredConversations}
                            onSelect={(id) => {
                                // Vibration feedback
                                if ('vibrate' in navigator) navigator.vibrate(10);
                                setActiveConversationId(id);
                            }}
                            activeId={activeConversationId}
                        />
                    </div>
                )}
            </div>

            {/* New Chat Modal (Mobile Optimized) */}
            {showNewChatModal && (
                <div className="fixed inset-0 z-[110] bg-white dark:bg-zinc-950 flex flex-col animate-in slide-in-from-bottom duration-300">
                    {/* Modal Header */}
                    <div className="h-16 shrink-0 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between px-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
                        <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Novo Papo</h2>
                        <button
                            onClick={() => setShowNewChatModal(false)}
                            className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full text-gray-500 active:scale-90 transition-all"
                        >
                            <X size={20} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Modal Search */}
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Nome ou email do usuário..."
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-zinc-900 border-none rounded-2xl pl-11 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-3">
                            {isSearchingUsers ? (
                                <div className="text-center py-10">
                                    <div className="inline-block w-6 h-6 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-sm font-bold text-gray-400">
                                        {userSearchQuery ? 'Nenhum usuário encontrado.' : 'Busque por um colega acima.'}
                                    </p>
                                </div>
                            ) : (
                                searchResults.map((u: any) => (
                                    <button
                                        key={u.id}
                                        onClick={() => createChatMutation.mutate(u.id)}
                                        className="w-full flex items-center gap-4 p-4 rounded-3xl bg-gray-50 dark:bg-zinc-900 active:scale-[0.98] transition-all border border-transparent active:border-blue-500/30"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center font-bold text-blue-600 shadow-sm overflow-hidden shrink-0">
                                            {u.photo ? (
                                                <AppImage src={u.photo} alt={u.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-lg">{u.name.charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">{u.name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{u.email}</p>
                                            <span className="inline-block px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-[8px] font-black uppercase mt-1">
                                                {u.role || u.division || 'STAFF'}
                                            </span>
                                        </div>
                                        <Plus size={18} className="text-blue-600" />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </MobileShell>
    );
};
