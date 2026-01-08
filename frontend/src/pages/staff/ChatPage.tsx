import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Menu, MessageSquare, Search, PlusCircle, Video, Phone, MoreVertical, Paperclip, Smile, Send } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import StaffSidebar from '../../components/StaffSidebar';
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

    // Filter conversations
    const filteredConversations = conversations.filter(c => {
        const otherParticipant = c.participants.find(p => p.user.id !== user?.id)?.user.name;
        const name = c.name || otherParticipant || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="flex bg-gray-50 dark:bg-gray-900 min-h-screen">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">
                {/* Header (Bitrix Style) */}
                <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shrink-0 z-20">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="text-blue-600" size={24} />
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Bate-papo e Chamadas</h1>
                    </div>
                    {/* Add header actions here if needed */}
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
            </main>
        </div>
    );
}
