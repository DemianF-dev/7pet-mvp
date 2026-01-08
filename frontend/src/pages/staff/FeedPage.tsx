import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Send, MessageCircle, Heart, MoreHorizontal, User, Calendar, CheckSquare, TrendingUp, Paperclip, Smile, Search, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import StaffSidebar from '../../components/StaffSidebar';

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

interface FeedWidgets {
    nextAppointments: any[];
    myTasks: { status: string; count: number }[];
    popularPosts: Post[];
}

export default function FeedPage() {
    const { socket } = useSocket();
    const queryClient = useQueryClient();
    const [newPostContent, setNewPostContent] = useState('');
    const [activeTab, setActiveTab] = useState('mensagem');

    // Fetch Posts
    const { data: posts = [], isLoading: postsLoading } = useQuery({
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
        if (!socket) return;

        socket.on('feed:new_post', (newPost: Post) => {
            queryClient.setQueryData(['feed'], (old: Post[] | undefined) => [newPost, ...(old || [])]);
            toast.success('Novo post no feed!');
        });

        socket.on('feed:post_updated', () => queryClient.invalidateQueries({ queryKey: ['feed'] }));
        socket.on('feed:post_reaction_updated', () => queryClient.invalidateQueries({ queryKey: ['feed'] }));

        return () => {
            socket.off('feed:new_post');
            socket.off('feed:post_updated');
            socket.off('feed:post_reaction_updated');
        };
    }, [socket, queryClient]);

    // Create Post Mutation
    const createPostMutation = useMutation({
        mutationFn: async (content: string) => api.post('/feed', { content }),
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
        <div className="flex bg-gray-50 dark:bg-gray-900 min-h-screen">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-4 lg:p-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Main Feed Area (8 columns) */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Rich Input Widget (Bitrix Style) */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            {/* Tabs */}
                            <div className="flex border-b border-gray-100 dark:border-gray-700">
                                {['MENSAGEM', 'EVENTO', 'ENQUETE', 'ARQUIVO', 'MAIS'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab.toLowerCase())}
                                        className={`px-6 py-3 text-xs font-bold tracking-wider hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${activeTab === tab.toLowerCase() ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handlePostSubmit} className="p-4">
                                <textarea
                                    className="w-full p-4 min-h-[120px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-300 resize-none transition-all placeholder-gray-400 text-sm"
                                    placeholder={activeTab === 'mensagem' ? "Escreva algo para a equipe..." : `Criar ${activeTab}... (Em breve)`}
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                />

                                <div className="flex justify-between items-center mt-4">
                                    <div className="flex items-center gap-2">
                                        <button type="button" className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"><Paperclip size={18} /></button>
                                        <button type="button" className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"><Smile size={18} /></button>
                                        <button type="button" className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"><User size={18} /></button>
                                        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-2" />
                                        <span className="text-xs text-blue-500 font-medium cursor-pointer hover:underline">Para todos os usuários</span>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={createPostMutation.isPending || !newPostContent.trim()}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition flex items-center gap-2 text-sm font-bold uppercase tracking-wide shadow-sm"
                                    >
                                        {createPostMutation.isPending ? 'Enviando...' : 'Enviar'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Feed Filter (Optional) */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white mr-4">Feed</h2>
                            <div className="flex-1 max-w-sm relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 text-sm focus:ring-1 focus:ring-blue-500" placeholder="Filtro e pesquisa" />
                            </div>
                        </div>

                        {/* Posts Stream */}
                        <div className="space-y-6">
                            {postsLoading ? (
                                <div className="text-center py-10"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" /></div>
                            ) : posts.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                    <p>Nenhuma publicação ainda.</p>
                                </div>
                            ) : (
                                posts.map(post => <PostCard key={post.id} post={post} />)
                            )}
                        </div>
                    </div>

                    {/* Right Widgets Sidebar (4 columns) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Widget: Pulse / Info (Optional) */}
                        <div className="bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="font-bold text-lg mb-1">Bem-vindo ao 7Pet</h3>
                                <p className="opacity-90 text-sm">Organize suas tarefas e colabore com a equipe.</p>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4">
                                <MessageCircle size={100} />
                            </div>
                        </div>

                        {/* Widget: Next Events */}
                        <WidgetCard title="Próximos Eventos" icon={<Calendar size={18} className="text-blue-500" />}>
                            {widgetsLoading ? <div className="h-20 animate-pulse bg-gray-100 rounded" /> : (
                                <div className="space-y-3">
                                    {widgets?.nextAppointments?.length === 0 && <p className="text-xs text-gray-400">Sem eventos próximos.</p>}
                                    {widgets?.nextAppointments?.map((apt: any) => (
                                        <div key={apt.id} className="flex gap-3 items-start group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg -mx-2 transition">
                                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg flex flex-col items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800">
                                                <span className="text-[10px] uppercase font-bold">{new Date(apt.startAt).toLocaleString('pt-BR', { month: 'short' })}</span>
                                                <span className="text-lg font-bold leading-none">{new Date(apt.startAt).getDate()}</span>
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">{apt.pet?.name} - {apt.service?.name || 'Serviço'}</div>
                                                <div className="text-xs text-gray-500 mt-1">{new Date(apt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="w-full text-center text-xs text-blue-500 font-medium hover:underline pt-2">Ver agenda completa</button>
                                </div>
                            )}
                        </WidgetCard>

                        {/* Widget: My Tasks */}
                        <WidgetCard title="Minhas Tarefas" icon={<CheckSquare size={18} className="text-green-500" />}>
                            {widgetsLoading ? <div className="h-20 animate-pulse bg-gray-100 rounded" /> : (
                                <div className="space-y-2">
                                    {widgets?.myTasks?.map((task: any) => (
                                        <div key={task.status} className="flex justify-between items-center py-1.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                                            <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{task.status.toLowerCase().replace('_', ' ')}</span>
                                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white px-2 py-0.5 rounded-full text-xs font-bold">{task.count}</span>
                                        </div>
                                    ))}
                                    {(!widgets?.myTasks || widgets.myTasks.length === 0) && <p className="text-xs text-gray-400">Nenhuma tarefa ativa.</p>}
                                </div>
                            )}
                        </WidgetCard>

                        {/* Widget: Popular Posts */}
                        <WidgetCard title="Posts mais populares" icon={<TrendingUp size={18} className="text-purple-500" />}>
                            {widgetsLoading ? <div className="h-20 animate-pulse bg-gray-100 rounded" /> : (
                                <div className="space-y-4">
                                    {widgets?.popularPosts?.map((post: Post) => (
                                        <div key={post.id} className="flex gap-3 items-start">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" style={{ backgroundColor: post.author.color }}>
                                                {/* Avatar placeholder */}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-blue-600 mb-0.5">{post.author.name}</div>
                                                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{post.content}</p>
                                                <div className="flex gap-2 mt-1 text-[10px] text-gray-400">
                                                    <span>{post.reactions.length} likes</span>
                                                    <span>{post.comments.length} coments</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </WidgetCard>

                    </div>
                </div>
            </main>
        </div>
    );
}

// Subcomponents
function WidgetCard({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800">
                <div className="flex items-center gap-2 font-bold text-sm text-gray-700 dark:text-gray-200">
                    {icon}
                    {title}
                </div>
                <button className="text-gray-400 hover:text-blue-500 transition"><PlusCircle size={14} /></button>
            </div>
            <div className="p-4">
                {children}
            </div>
        </div>
    )
}

function PlusCircle({ size }: { size: number }) { // Quick lucide fix if missing import
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>
}

function PostCard({ post }: { post: Post }) {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(post.comments.length > 0);

    const likeMutation = useMutation({
        mutationFn: async () => api.post(`/feed/${post.id}/react`, { type: 'LIKE' }),
    });

    const commentMutation = useMutation({
        mutationFn: async () => api.post(`/feed/${post.id}/comment`, { content: commentText }),
        onSuccess: () => {
            setCommentText('');
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        }
    });

    const hasLiked = post.reactions.some(r => r.authorId === user?.id);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group hover:shadow-md transition-shadow">
            <div className="p-5">
                <div className="flex items-start gap-4 mb-4">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-sm text-lg"
                        style={{ backgroundColor: post.author.color || '#3b82f6' }}
                    >
                        {post.author.name?.charAt(0).toUpperCase() || <User size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-bold text-blue-600 hover:underline cursor-pointer text-sm">{post.author.name}</div>
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                    {new Date(post.createdAt).toLocaleDateString()} às {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                    Para: Todos
                                </div>
                            </div>
                            <button className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mb-4 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                </div>

                <div className="flex items-center gap-6 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => likeMutation.mutate()}
                        className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${hasLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'}`}
                    >
                        <Heart size={16} fill={hasLiked ? 'currentColor' : 'none'} />
                        Curtir {post.reactions.length > 0 && <span className="bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded-full text-[10px] ml-1">{post.reactions.length}</span>}
                    </button>
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-blue-500 transition-colors"
                    >
                        <MessageCircle size={16} /> Comentar {post.comments.length > 0 && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full text-[10px] ml-1">{post.comments.length}</span>}
                    </button>
                </div>
            </div>

            {(showComments || post.comments.length > 0) && (
                <div className="bg-gray-50 dark:bg-gray-900/30 p-4 border-t border-gray-100 dark:border-gray-700">
                    {post.comments.map(c => (
                        <div key={c.id} className="mb-3 flex gap-3 group/comment">
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold shrink-0">
                                {c.author.name?.[0].toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none shadow-sm text-sm border border-gray-200 dark:border-gray-700 inline-block max-w-[90%]">
                                    <span className="font-bold text-xs text-blue-600 mb-1 block">{c.author.name}</span>
                                    <span className="text-gray-700 dark:text-gray-300">{c.content}</span>
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1 ml-2 flex gap-3 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                    <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <button className="hover:text-blue-500">Responder</button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="flex gap-3 mt-4 items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                        <div className="flex-1 relative">
                            <input
                                className="w-full pl-4 pr-10 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                placeholder="Escreva um comentário..."
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && commentText.trim() && commentMutation.mutate()}
                            />
                            <button
                                onClick={() => commentMutation.mutate()}
                                disabled={!commentText.trim() || commentMutation.isPending}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-full transition disabled:opacity-50"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
