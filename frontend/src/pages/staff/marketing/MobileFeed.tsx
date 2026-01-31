import { useState, useEffect } from 'react';
import { socketManager } from '../../../services/socketManager';
import api from '../../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
    Send, MessageCircle, Heart, User,
    Calendar, TrendingUp, Search, Plus,
    X, Paperclip, Smile
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../store/authStore';
import { MobileShell } from '../../../layouts/MobileShell';

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

export const MobileFeed = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

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
        const handleNewPost = (newPost: Post) => {
            queryClient.setQueryData(['feed'], (old: Post[] | undefined) => [newPost, ...(old || [])]);
        };
        const handlePostUpdate = () => queryClient.invalidateQueries({ queryKey: ['feed'] });

        socketManager.on('feed:new_post', handleNewPost);
        socketManager.on('feed:post_updated', handlePostUpdate);
        socketManager.on('feed:post_reaction_updated', handlePostUpdate);

        return () => {
            socketManager.off('feed:new_post', handleNewPost);
            socketManager.off('feed:post_updated', handlePostUpdate);
            socketManager.off('feed:post_reaction_updated', handlePostUpdate);
        };
    }, [queryClient]);

    const createPostMutation = useMutation({
        mutationFn: async (content: string) => api.post('/feed', { content }),
        onSuccess: () => {
            setNewPostContent('');
            setIsComposeOpen(false);
            toast.success('Publicado!');
        }
    });

    const filteredPosts = posts.filter(p =>
        p.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.author.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <MobileShell
            title="Mural 7Pet"
            rightAction={
                <button
                    onClick={() => setIsComposeOpen(true)}
                    className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 active:scale-90 transition-transform"
                >
                    <Plus size={20} />
                </button>
            }
        >
            <div className="space-y-6 pb-20">
                {/* 1. Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="search"
                        placeholder="Buscar no mural..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm font-medium"
                    />
                </div>

                {/* 2. Posts List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <TrendingUp size={48} className="mb-4 opacity-10" />
                            <p className="text-sm font-medium uppercase tracking-widest">O mural está vazio</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filteredPosts.map((post) => (
                                <MobilePostCard key={post.id} post={post} user={user} />
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Compose Modal */}
            <AnimatePresence>
                {isComposeOpen && (
                    <div className="fixed inset-0 z-[100] bg-white dark:bg-zinc-900 flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
                        <header className="flex justify-between items-center mb-8">
                            <button onClick={() => setIsComposeOpen(false)} className="text-sm font-bold text-gray-400 uppercase tracking-widest">Fechar</button>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Novo Post</h3>
                            <button
                                onClick={() => createPostMutation.mutate(newPostContent)}
                                disabled={!newPostContent.trim() || createPostMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
                            >
                                {createPostMutation.isPending ? '...' : 'Publicar'}
                            </button>
                        </header>

                        <textarea
                            autoFocus
                            placeholder="O que está acontecendo no 7Pet?"
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-medium leading-relaxed resize-none p-0"
                        />

                        <div className="flex items-center gap-4 py-4 border-t border-gray-100 dark:border-zinc-800">
                            <button className="p-2 text-gray-400"><Paperclip size={20} /></button>
                            <button className="p-2 text-gray-400"><Smile size={20} /></button>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </MobileShell>
    );
};

const MobilePostCard = ({ post, user }: { post: Post; user: any }) => {
    const queryClient = useQueryClient();
    const [commentText, setCommentText] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);

    const hasLiked = post.reactions.some(r => r.authorId === user?.id);

    const likeMutation = useMutation({
        mutationFn: async () => api.post(`/feed/${post.id}/react`, { type: 'LIKE' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] })
    });

    const commentMutation = useMutation({
        mutationFn: async () => api.post(`/feed/${post.id}/comment`, { content: commentText }),
        onSuccess: () => {
            setCommentText('');
            setIsCommenting(false);
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        }
    });

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mobile-card !p-0 overflow-hidden"
        >
            <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-xs shadow-sm"
                        style={{ backgroundColor: post.author.color || '#3b82f6' }}
                    >
                        {post.author.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-blue-600 uppercase leading-none mb-0.5">{post.author.name}</h4>
                        <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold uppercase">
                            <Calendar size={10} />
                            {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug whitespace-pre-wrap">
                    {post.content}
                </p>

                <div className="flex items-center gap-6 pt-3 border-t border-gray-100 dark:border-zinc-800">
                    <button
                        onClick={() => likeMutation.mutate()}
                        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${hasLiked ? 'text-pink-500' : 'text-gray-400'
                            }`}
                    >
                        <Heart size={14} fill={hasLiked ? 'currentColor' : 'none'} />
                        {post.reactions.length > 0 && post.reactions.length} Curtir
                    </button>
                    <button
                        onClick={() => setIsCommenting(!isCommenting)}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400"
                    >
                        <MessageCircle size={14} />
                        {post.comments.length > 0 && post.comments.length} Comentar
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isCommenting && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gray-50 dark:bg-zinc-800/50 p-4 space-y-4 border-t border-gray-100 dark:border-zinc-800"
                    >
                        {post.comments.map(c => (
                            <div key={c.id} className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-[8px] font-black shrink-0">
                                    {c.author.name[0].toUpperCase()}
                                </div>
                                <div className="bg-white dark:bg-zinc-800 p-2 rounded-xl rounded-tl-none shadow-sm border border-gray-100 dark:border-zinc-700 max-w-[85%]">
                                    <span className="block text-[9px] font-black text-blue-600 uppercase mb-0.5">{c.author.name}</span>
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight">{c.content}</p>
                                </div>
                            </div>
                        ))}

                        <div className="relative">
                            <input
                                autoFocus
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && commentText.trim() && commentMutation.mutate()}
                                placeholder="Seu comentário..."
                                className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-full pl-4 pr-10 py-2 text-xs font-medium"
                            />
                            <button
                                onClick={() => commentMutation.mutate()}
                                disabled={!commentText.trim() || commentMutation.isPending}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 disabled:opacity-50"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
