export interface Message {
    id: string;
    content: string;
    createdAt: string;
    updatedAt?: string;
    senderId: string;
    sender: { id: string; name: string; color?: string };
    conversationId: string;
}

export interface Participant {
    id: string;
    userId: string;
    conversationId: string;
    lastReadAt?: string;
    user: { id: string; name: string; color?: string };
}

export interface Conversation {
    id: string;
    type: string;
    name?: string;
    lastMessageAt: string;
    participants: Participant[];
    messages: Message[];
    unreadCount?: number;
}
