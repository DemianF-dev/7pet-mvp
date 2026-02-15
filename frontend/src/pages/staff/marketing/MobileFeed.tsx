import { useState, useEffect } from 'react';
import { socketManager } from '../../../services/socketManager';
import api from '../../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
    Send, MessageCircle, Heart,
    Calendar, TrendingUp, Search, Plus,
    Paperclip, Smile, CheckSquare
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

interface FeedWidgets {
    nextAppointments: any[];
    myTasks: { status: string; count: number }[];
    popularPosts: Post[];
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

    // Fetch Widgets
    const { data: widgets, isLoading: widgetsLoading } = useQuery({
        queryKey: ['feed-widgets'],
        queryFn: async () => {
            const res = await api.get('/staff/widgets');
            return res.data as FeedWidgets;
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
                {/* 1. Welcome Card */}
                <div className="bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl p-6 text-white shadow-lg relative overflow-hidden mobile-card">
                    <div className="relative z-10">
                        <h3 className="font-bold text-lg mb-1">Bem-vindo ao 7Pet</h3>
                        <p className="opacity-90 text-sm">Organize suas tarefas e colabore com a equipe.</p>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4">
                        <MessageCircle size={80} />
                    </div>
                </div>

                {/* 2. Search */}
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

                {/* 3. Mobile Widgets */}
                <div className="space-y-4">
                    {/* Next Appointments Widget */}
                    <MobileWidgetCard title="Próximos Eventos" icon={<Calendar size={16} className="text-blue-500" />}>
                        {widgetsLoading ? <div className="h-16 animate-pulse bg-gray-100 dark:bg-zinc-800 rounded-lg" /> : (
                            <div className="space-y-2">
                                {((widgets?.nextAppointments || []).length === 0) && <p className="text-xs text-gray-400 dark:text-zinc-400">Sem eventos próximos.</p>}
                                {(widgets?.nextAppointments || []).slice(0, 3).map((apt: any) => (
                                    <div key={apt.id} className="flex gap-2 items-start p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg flex flex-col items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800">
                                            <span className="text-[8px] uppercase font-bold">{new Date(apt.startAt).toLocaleString('pt-BR', { month: 'short' })}</span>
                                            <span className="text-sm font-bold leading-none">{new Date(apt.startAt).getDate()}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{apt.pet?.name} - {apt.service?.name || 'Serviço'}</div>
                                            <div className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">
                                                {new Date(apt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(widgets?.nextAppointments?.length || 0) > 3 && (
                                    <button className="w-full text-center text-xs text-blue-500 font-medium hover:underline pt-1">
                                        Ver todos ({widgets?.nextAppointments?.length})
                                    </button>
                                )}
                            </div>
                        )}
                    </MobileWidgetCard>

                    {/* My Tasks Widget */}
                    <MobileWidgetCard title="Minhas Tarefas" icon={<CheckSquare size={16} className="text-green-500" />}>
                        {widgetsLoading ? <div className="h-16 animate-pulse bg-gray-100 dark:bg-zinc-800 rounded-lg" /> : (
                            <div className="space-y-2">
                                {widgets?.myTasks?.map((task: any) => (
                                    <div key={task.status} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-zinc-700/50 last:border-0">
                                        <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">
                                            {task.status.toLowerCase().replace('_', ' ')}
                                        </span>
                                        <span className="bg-gray-100 dark:bg-zinc-700 text-gray-800 dark:text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                            {task.count}
                                        </span>
                                    </div>
                                ))}
                                {(!widgets?.myTasks || widgets.myTasks.length === 0) && 
                                    <p className="text-xs text-gray-400 dark:text-zinc-400">Nenhuma tarefa ativa.</p>
                                }
                            </div>
                        )}
                    </MobileWidgetCard>

                    {/* Popular Posts Widget */}
                    <MobileWidgetCard title="Posts Populares" icon={<TrendingUp size={16} className="text-purple-500" />}>
                        {widgetsLoading ? <div className="h-16 animate-pulse bg-gray-100 dark:bg-zinc-800 rounded-lg" /> : (
                            <div className="space-y-3">
                                {(widgets?.popularPosts || []).slice(0, 2).map((post: Post) => (
                                    <div key={post.id} className="flex gap-2 items-start">
                                        <div 
                                            className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white"
                                            style={{ backgroundColor: post.author.color || '#3b82f6' }}
                                        >
                                            {post.author.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-blue-600 mb-0.5 truncate">{post.author.name}</div>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{post.content}</p>
                                            <div className="flex gap-3 mt-1 text-[9px] text-gray-400">
                                                <span>{(post.reactions || []).length} curtidas</span>
                                                <span>{(post.comments || []).length} comentários</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!widgets?.popularPosts || widgets.popularPosts.length === 0) && 
                                    <p className="text-xs text-gray-400 dark:text-zinc-400">Nenhuma postagem popular.</p>
                                }
                            </div>
                        )}
                    </MobileWidgetCard>
                </div>

                {/* 4. Posts List */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <h2 className="text-sm font-bold text-gray-800 dark:text-white">Feed</h2>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700"></div>
                    </div>
                    
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
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">Novo Post</h3>
                            <button
                                onClick={() => createPostMutation.mutate(newPostContent)}
                                disabled={!newPostContent.trim() || createPostMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50"
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

const MobileWidgetCard = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => {
    return (
        <div className="mobile-card p-4">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 font-bold text-sm text-gray-700 dark:text-gray-200">
                    {icon}
                    {title}
                </div>
            </div>
            {children}
        </div>
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
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm"
                        style={{ backgroundColor: post.author.color || '#3b82f6' }}
                    >
                        {post.author.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-blue-600 uppercase leading-none mb-0.5">{post.author.name}</h4>
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
                        className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${hasLiked ? 'text-pink-500' : 'text-gray-400'
                            }`}
                    >
                        <Heart size={14} fill={hasLiked ? 'currentColor' : 'none'} />
                        {post.reactions.length > 0 && post.reactions.length} Curtir
                    </button>
                    <button
                        onClick={() => setIsCommenting(!isCommenting)}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400"
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
                                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-[8px] font-bold shrink-0">
                                    {c.author.name[0].toUpperCase()}
                                </div>
                                <div className="bg-white dark:bg-zinc-800 p-2 rounded-xl rounded-tl-none shadow-sm border border-gray-100 dark:border-zinc-700 max-w-[85%]">
                                    <span className="block text-[9px] font-bold text-blue-600 uppercase mb-0.5">{c.author.name}</span>
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
