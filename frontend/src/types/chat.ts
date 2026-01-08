export interface Message {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    sender: { id: string; name: string };
    conversationId: string;
}

export interface Conversation {
    id: string;
    type: string;
    name?: string;
    lastMessageAt: string;
    participants: { user: { id: string; name: string; color?: string } }[];
    messages: Message[];
}
