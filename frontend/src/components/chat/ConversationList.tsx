import { MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Conversation } from '../../types/chat'; // We'll need to define this type or import it

interface ConversationListProps {
    conversations: Conversation[];
    onSelect: (id: string) => void;
    activeId?: string | null;
}

export default function ConversationList({ conversations, onSelect, activeId }: ConversationListProps) {
    const { user } = useAuthStore();

    return (
        <div className="w-full h-full overflow-y-auto p-2 space-y-1 bg-gray-50 dark:bg-gray-900/50">
            <div className="text-xs font-semibold text-gray-500 px-2 py-2 uppercase tracking-wider flex justify-between items-center">
                <span>Conversas Recentes</span>
                <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[10px]">{conversations.length}</span>
            </div>

            {conversations.length === 0 && (
                <div className="text-center text-sm text-gray-400 py-8 flex flex-col items-center gap-2">
                    <MessageSquare size={32} className="opacity-20" />
                    Nenhuma conversa iniciada
                </div>
            )}

            {conversations.map(conv => {
                const otherParticipant = conv.participants.find(p => p.user.id !== user?.id)?.user;
                const name = conv.name || otherParticipant?.name || 'Chat';
                const m = conv.messages[0];
                const lastMsg = m ? (m.content || (m.fileType?.startsWith('image/') ? '📷 Foto' : '📎 Arquivo')) : 'Inicie uma conversa';
                const isActive = activeId === conv.id;
                const isUnread = (conv.unreadCount || 0) > 0;

                return (
                    <button
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        className={`w-full text-left p-3 rounded-xl flex gap-3 items-center transition-all group ${isActive
                            ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700'
                            : 'hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                            }`}
                    >
                        <div className="relative shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                }`}>
                                {name[0]?.toUpperCase()}
                            </div>
                            {isUnread && !isActive && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 font-bold shrink-0">
                                    {conv.unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <span className={`text-sm truncate ${isUnread && !isActive ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-700 dark:text-gray-200'} ${isActive ? 'text-gray-900 dark:text-white' : ''}`}>
                                    {name}
                                </span>
                                {/* Timestamp placeholder if available */}
                            </div>
                            <div className={`text-xs truncate ${isActive ? 'text-gray-500' : isUnread ? 'text-gray-900 dark:text-gray-300 font-medium' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                                {lastMsg}
                            </div>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
