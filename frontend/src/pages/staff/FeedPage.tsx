import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Send, MessageCircle, Heart, MoreHorizontal, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

// Types
interface Post {
    id: string;
    content: string;
    createdAt: string;
    author: { id: string; name: string; color?: string; role?: string };
    comments: Comment[];
    reactions: Reaction[];
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    author: { id: string; name: string };
}

interface Reaction {
    id: string;
    type: string;
    authorId: string;
}

export default function FeedPage() {
    const { socket } = useSocket();
    const queryClient = useQueryClient();
    const [newPostContent, setNewPostContent] = useState('');

    // Fetch Posts
    const { data: posts = [], isLoading } = useQuery({
        queryKey: ['feed'],
        queryFn: async () => {
            const res = await api.get('/feed');
            return res.data as Post[];
        }
    });

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('feed:new_post', (newPost: Post) => {
            queryClient.setQueryData(['feed'], (old: Post[] | undefined) => {
                return [newPost, ...(old || [])];
            });
            toast.success('Novo post no feed!');
        });

        socket.on('feed:post_updated', () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        });

        socket.on('feed:post_reaction_updated', () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        });

        return () => {
            socket.off('feed:new_post');
            socket.off('feed:post_updated');
            socket.off('feed:post_reaction_updated');
        };
    }, [socket, queryClient]);

    // Mutations
    const createPostMutation = useMutation({
        mutationFn: async (content: string) => {
            return api.post('/feed', { content });
        },
        onSuccess: () => {
            setNewPostContent('');
            toast.success('Post publicado!');
        },
        onError: () => toast.error('Erro ao publicar post.')
    });

    const handlePostSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;
        createPostMutation.mutate(newPostContent);
    };

    return (
        <div className="container mx-auto p-4 max-w-3xl">
            <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Feed Interno</h1>

            {/* Create Post Widget */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-8 border border-gray-100 dark:border-gray-700">
                <form onSubmit={handlePostSubmit}>
                    <textarea
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                        placeholder="Compartilhe novidades, avisos ou ideias com a equipe..."
                        rows={3}
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        style={{ color: 'var(--color-text-primary)' }}
                    />
                    <div className="flex justify-between items-center mt-3">
                        <div className="text-xs text-gray-500">
                            Visível para: <b>Todos os Funcionários</b>
                        </div>
                        <button
                            type="submit"
                            disabled={createPostMutation.isPending || !newPostContent.trim()}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {createPostMutation.isPending ? 'Enviando...' : <><Send size={16} /> Publicar</>}
                        </button>
                    </div>
                </form>
            </div>

            {/* Feed Stream */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="text-center py-10 text-gray-400">Carregando feed...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">Nenhuma publicação ainda. Seja o primeiro!</div>
                ) : (
                    posts.map((post: Post) => (
                        <PostCard key={post.id} post={post} />
                    ))
                )}
            </div>
        </div>
    );
}

function PostCard({ post }: { post: Post }) {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(post.comments.length > 0);

    const likeMutation = useMutation({
        mutationFn: async () => {
            return api.post(`/feed/${post.id}/react`, { type: 'LIKE' });
        }
    });

    const commentMutation = useMutation({
        mutationFn: async () => {
            return api.post(`/feed/${post.id}/comment`, { content: commentText });
        },
        onSuccess: () => {
            setCommentText('');
            // Optimistic update handled by socket or invalidate
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        }
    });

    const hasLiked = post.reactions.some(r => r.authorId === user?.id);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm"
                        style={{ backgroundColor: post.author.color || '#3b82f6' }}
                    >
                        {post.author.name?.charAt(0).toUpperCase() || <User size={20} />}
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{post.author.name}</div>
                        <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()} às {new Date(post.createdAt).toLocaleTimeString()}</div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal size={20} />
                    </button>
                </div>

                <div className="mb-4 whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                    {post.content}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => likeMutation.mutate()}
                        className={`flex items-center gap-1.5 text-sm transition-colors ${hasLiked ? 'text-pink-500 font-medium' : 'text-gray-500 hover:text-pink-500'}`}
                    >
                        <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} />
                        Like ({post.reactions.length})
                    </button>
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-500 transition-colors"
                    >
                        <MessageCircle size={18} /> Comentar ({post.comments.length})
                    </button>
                </div>
            </div>

            {/* Comments Section */}
            {(showComments) && (
                <div className="bg-gray-50 dark:bg-gray-900/30 p-4 border-t border-gray-100 dark:border-gray-700">
                    {/* List comments */}
                    {post.comments.map(c => (
                        <div key={c.id} className="mb-3 flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                {c.author.name?.[0].toUpperCase()}
                            </div>
                            <div className="flex-1 bg-white dark:bg-gray-800 p-2.5 rounded-lg rounded-tl-none shadow-sm text-sm border border-gray-100 dark:border-gray-700">
                                <span className="font-semibold block text-xs mb-1 opacity-70">{c.author.name}</span>
                                <span style={{ color: 'var(--color-text-primary)' }}>{c.content}</span>
                            </div>
                        </div>
                    ))}

                    {/* Add Comment */}
                    <div className="flex gap-2 mt-4">
                        <input
                            className="flex-1 px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Escreva um comentário..."
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && commentText.trim() && commentMutation.mutate()}
                            style={{ color: 'var(--color-text-primary)' }}
                        />
                        <button
                            onClick={() => commentMutation.mutate()}
                            disabled={!commentText.trim() || commentMutation.isPending}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 transition"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
