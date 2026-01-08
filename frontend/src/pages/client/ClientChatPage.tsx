import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { Conversation } from '../../types/chat';
import ConversationList from '../../components/chat/ConversationList';
import ChatWindow from '../../components/chat/ChatWindow';
import { MessageSquare, Plus, User, ArrowLeft, Headphones, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function ClientChatPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [modalTab, setModalTab] = useState<'support' | 'financial'>('support');
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

    // Fetch Agents
    const { data: agents = [] } = useQuery({
        queryKey: ['agents'],
        queryFn: async () => {
            const res = await api.get('/chat/agents');
            return res.data as { id: string; name: string; photo?: string; role?: string; division?: string }[];
        },
        enabled: showNewChatModal
    });

    const createConversationMutation = useMutation({
        mutationFn: async (agentId: string) => {
            return api.post('/chat/conversations', {
                participantIds: [agentId],
                type: 'DIRECT'
            });
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            setActiveConversationId(data.data.id);
            setShowNewChatModal(false);
            toast.success('Conversa iniciada!');
        },
        onError: () => toast.error('Erro ao iniciar conversa')
    });

    // Filter conversations
    const filteredConversations = conversations.filter(c => {
        const otherParticipant = c.participants.find(p => p.user.id !== user?.id)?.user.name;
        const name = c.name || otherParticipant || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col overflow-hidden">
            {/* Modern Header */}
            <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/client/dashboard')}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 text-gray-500 hover:text-gray-700 hover:scale-105"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Headphones size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-800">Atendimento</h1>
                            <p className="text-xs text-gray-500">Fale com nossa equipe</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setShowNewChatModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 flex items-center gap-2 hover:scale-[1.02]"
                >
                    <Sparkles size={16} />
                    <span className="hidden sm:inline">Novo Chat</span>
                </button>
            </header>

            {/* Main Content - Fixed Height with Scroll */}
            <div className="flex-1 flex overflow-hidden">
                {/* Conversations List */}
                <div className={`w-full md:w-80 lg:w-96 bg-white/60 backdrop-blur-sm border-r border-gray-200/50 flex flex-col ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                    {/* Search */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar conversa..."
                                className="w-full bg-gray-100/80 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Conversation List with Scroll */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-4">
                                <MessageSquare size={40} className="mb-3 opacity-50" />
                                <p className="text-sm text-center">Nenhuma conversa ainda</p>
                                <button
                                    onClick={() => setShowNewChatModal(true)}
                                    className="mt-4 text-blue-600 text-sm font-medium hover:underline"
                                >
                                    Iniciar primeira conversa
                                </button>
                            </div>
                        ) : (
                            <ConversationList
                                conversations={filteredConversations}
                                onSelect={setActiveConversationId}
                                activeId={activeConversationId}
                            />
                        )}
                    </div>
                </div>

                {/* Chat Window - Fixed Height */}
                <div className={`flex-1 flex flex-col overflow-hidden ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                    {activeConversationId ? (
                        <ChatWindow
                            conversationId={activeConversationId}
                            onBack={() => setActiveConversationId(null)}
                            className="flex-1"
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gradient-to-br from-gray-50/50 to-blue-50/30">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/10">
                                <MessageSquare size={40} className="text-blue-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-700 mb-2">Selecione uma conversa</h2>
                            <p className="text-sm max-w-xs text-gray-500">
                                Escolha uma conversa ao lado ou inicie um novo atendimento com nossa equipe.
                            </p>
                            <button
                                onClick={() => setShowNewChatModal(true)}
                                className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all duration-200 flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Novo Atendimento
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">Novo Atendimento</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Escolha com quem deseja conversar</p>
                            </div>
                            <button
                                onClick={() => setShowNewChatModal(false)}
                                className="p-2 hover:bg-white/80 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-4">
                            {/* Department Tabs */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setModalTab('support')}
                                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${modalTab === 'support'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    🎧 Atendimento
                                </button>
                                <button
                                    onClick={() => setModalTab('financial')}
                                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${modalTab === 'financial'
                                            ? 'bg-green-600 text-white shadow-lg shadow-green-500/25'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    💰 Financeiro
                                </button>
                            </div>

                            {/* Agent List */}
                            <div className="space-y-2 max-h-72 overflow-y-auto">
                                {agents
                                    .filter(agent => {
                                        if (modalTab === 'financial') {
                                            return agent.division === 'FINANCEIRO';
                                        }
                                        return agent.division !== 'FINANCEIRO';
                                    })
                                    .map(agent => (
                                        <button
                                            key={agent.id}
                                            onClick={() => createConversationMutation.mutate(agent.id)}
                                            disabled={createConversationMutation.isPending}
                                            className="w-full text-left p-3.5 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200 flex items-center gap-3 group disabled:opacity-50"
                                        >
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 shadow-lg shadow-blue-500/20">
                                                {agent.photo ? (
                                                    <img src={agent.photo} alt={agent.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    agent.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-semibold text-gray-800 group-hover:text-blue-700 block truncate">
                                                    {agent.name}
                                                </span>
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1 ${modalTab === 'financial'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {agent.role === 'ADMIN' || agent.role === 'GESTAO' ? 'Gestão' : 'Especialista'}
                                                </span>
                                            </div>
                                        </button>
                                    ))}

                                {agents.filter(agent => modalTab === 'financial' ? agent.division === 'FINANCEIRO' : agent.division !== 'FINANCEIRO').length === 0 && (
                                    <div className="text-center py-8 text-gray-400">
                                        <User size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Nenhum {modalTab === 'support' ? 'atendente' : 'responsável'} disponível</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
