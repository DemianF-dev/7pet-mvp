
import React, { useState, useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import { Brain, X, Send, Play, Minimize2, Loader2, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

// Simple cn replacement if not imported
const classNames = (...classes: (string | undefined | null | boolean)[]) => classes.filter(Boolean).join(' ');

export const AIChatWidget = () => {
    const { user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Authorization Check: Must be logged in AND have one of these roles
    const allowed = ['ADMIN', 'MASTER', 'GESTAO'];

    if (!user) return null;

    const userRole = (user.division || user.role || '').toUpperCase();
    const isAllowed = allowed.includes(userRole);

    const getBrainUrl = () => {
        const envUrl = import.meta.env.VITE_API_URL;
        let baseUrl = envUrl || (import.meta.env.PROD ? '/api' : 'http://localhost:3001');

        // Remove trailing slash
        baseUrl = baseUrl.replace(/\/$/, "");

        // Ensure protocol
        if (baseUrl && !baseUrl.startsWith('http') && !baseUrl.startsWith('/')) {
            baseUrl = `https://${baseUrl}`;
        }

        return `${baseUrl}/brain/chat`;
    };

    const { token } = useAuthStore();

    const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
        api: getBrainUrl(),
        headers: {
            'Authorization': `Bearer ${token}`
        },
        onError: (err) => {
            console.error("AI Chat Error:", err);
        }
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    if (!isAllowed) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end print:hidden">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[90vw] max-w-[400px] h-[500px] max-h-[70vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="p-3 bg-gradient-to-r from-violet-600 to-indigo-600 flex justify-between items-center text-white shrink-0">
                        <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-yellow-300" />
                            <h3 className="font-bold text-sm">Cérebro 7Pet</h3>
                            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-medium">BETA</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <Minimize2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-gray-900/50">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 text-sm mt-8 space-y-2">
                                <Sparkles className="w-8 h-8 mx-auto text-indigo-400 mb-2" />
                                <p>Olá! Sou sua inteligência auxiliar.</p>
                                <p className="text-xs">Posso ver dados financeiros e ajudar com relatórios.</p>
                                <button
                                    onClick={() => {
                                        const event = { target: { value: 'Qual o resumo financeiro de hoje?' } } as any;
                                        handleInputChange(event);
                                    }}
                                    className="text-xs text-indigo-600 font-medium hover:underline mt-2"
                                >
                                    Ex: "Qual o resumo financeiro de hoje?"
                                </button>
                            </div>
                        )}

                        {messages.map(m => (
                            <div
                                key={m.id}
                                className={classNames(
                                    "flex flex-col max-w-[85%] text-sm rounded-2xl p-3 shadow-sm",
                                    m.role === 'user'
                                        ? "self-end bg-indigo-600 text-white rounded-br-none"
                                        : "self-start bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-bl-none"
                                )}
                            >
                                <div className="whitespace-pre-wrap">{m.content}</div>
                                {m.toolInvocations?.map(tool => (
                                    <div key={tool.toolCallId} className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                                        <div className="flex items-center gap-1 text-gray-500">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span>Buscando dados...</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}

                        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                            <div className="self-start bg-white dark:bg-gray-700 p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0 flex gap-2">
                        <input
                            className="flex-1 bg-gray-100 dark:bg-gray-900 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Pergunte algo ao Cérebro..."
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={classNames(
                    "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 group",
                    isOpen ? "bg-gray-200 text-gray-600 rotate-90" : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                )}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <Brain className="w-7 h-7 group-hover:animate-pulse" />
                )}

                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                    </span>
                )}
            </button>
        </div>
    );
};
