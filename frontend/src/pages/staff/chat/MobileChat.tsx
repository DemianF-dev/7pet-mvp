import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, PlusCircle } from 'lucide-react';
import { MobileShell } from '../../../layouts/MobileShell';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../services/api';
import ConversationList from '../../../components/chat/ConversationList';
import ChatWindow from '../../../components/chat/ChatWindow';
import { Conversation } from '../../../types/chat';

export const MobileChat = () => {
    const { user } = useAuthStore();
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    // Fetch Conversations (Reusing logic)
    const { data: conversations = [], isLoading } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const res = await api.get('/chat/conversations');
            return res.data as Conversation[];
        },
        enabled: Boolean(user)
    });

    // If a conversation is active, show the Chat Window (Full Screen Mobile)
    if (activeConversationId) {
        return (
            <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900 flex flex-col">
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
            title="Mensagens"
            rightAction={
                <button className="text-blue-600">
                    <PlusCircle size={24} />
                </button>
            }
        >
            <div className="pb-20">
                <div className="py-2">
                    <input
                        type="search"
                        placeholder="Buscar mensagens..."
                        className="w-full bg-gray-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm font-medium border-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <MessageSquare size={48} className="mb-4 opacity-20" />
                        <p className="font-medium text-sm">Nenhuma conversa ainda</p>
                    </div>
                ) : (
                    <ConversationList
                        conversations={conversations}
                        onSelect={setActiveConversationId}
                        activeId={activeConversationId}
                    />
                )}
            </div>
        </MobileShell>
    );
};
