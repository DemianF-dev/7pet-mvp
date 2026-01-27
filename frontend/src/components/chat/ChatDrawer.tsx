import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Minimize2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { Conversation } from '../../types/chat';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';

export default function ChatDrawer() {
    const { user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

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
                    {/* Badge logic placeholder */}
                </button>
            )}
        </div>
    );
}
