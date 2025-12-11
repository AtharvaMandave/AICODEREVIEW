'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
    MessageCircle,
    Send,
    X,
    Loader2,
    Bot,
    User,
    Sparkles,
    FileCode,
    ChevronDown,
    Lightbulb,
    RefreshCw,
    Zap,
    Search
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ChatPanel({ projectId, isOpen, onClose }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [isReindexing, setIsReindexing] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            fetchSuggestions();
        }
    }, [isOpen]);

    const fetchSuggestions = async () => {
        try {
            const response = await axios.get(`${API_URL}/chat/${projectId}/suggestions`);
            if (response.data.success) {
                setSuggestions(response.data.suggestions);
            }
        } catch (error) {
            console.error('Failed to fetch suggestions:', error);
        }
    };

    const handleReindex = async () => {
        setIsReindexing(true);
        try {
            const response = await axios.post(`${API_URL}/chat/${projectId}/reindex`);
            if (response.data.success) {
                // Add system message about reindexing
                setMessages(prev => [...prev, {
                    role: 'system',
                    content: `✅ ${response.data.message}`,
                    isSystem: true
                }]);
            }
        } catch (error) {
            console.error('Failed to reindex:', error);
            setMessages(prev => [...prev, {
                role: 'system',
                content: '❌ Failed to reindex project',
                isSystem: true,
                isError: true
            }]);
        } finally {
            setIsReindexing(false);
        }
    };

    const sendMessage = async (messageText = input) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage = messageText.trim();
        setInput('');

        // Add user message to chat
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // Prepare conversation history for context
            const history = messages
                .filter(m => !m.isSystem)
                .map(m => ({
                    role: m.role,
                    content: m.content
                }));

            const response = await axios.post(`${API_URL}/chat/${projectId}`, {
                message: userMessage,
                history
            });

            if (response.data.success) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: response.data.response,
                    relevantFiles: response.data.relevantFiles,
                    searchMethod: response.data.searchMethod
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'Sorry, I encountered an error processing your request.',
                    isError: true
                }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Failed to connect to the chat service. Please try again.',
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        sendMessage(suggestion);
    };

    const clearChat = () => {
        setMessages([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 w-[420px] h-[650px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-sm">Code Assistant</h3>
                        <p className="text-xs text-blue-100">RAG-powered codebase chat</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleReindex}
                        disabled={isReindexing}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Reindex for better search"
                    >
                        <RefreshCw className={`w-4 h-4 ${isReindexing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={clearChat}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-xs"
                        title="Clear chat"
                    >
                        Clear
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Sparkles className="w-7 h-7 text-white" />
                        </div>
                        <h4 className="font-semibold text-slate-900 mb-1">Chat with your codebase</h4>
                        <p className="text-sm text-slate-500 mb-6">Ask questions about architecture, logic, or specific files</p>

                        {suggestions.length > 0 && (
                            <div className="space-y-2 text-left">
                                <p className="text-xs text-slate-400 flex items-center gap-1 px-2">
                                    <Lightbulb className="w-3 h-3" />
                                    Try asking:
                                </p>
                                {suggestions.slice(0, 4).map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="block w-full text-left px-4 py-3 text-sm bg-white hover:bg-blue-50 rounded-xl text-slate-700 transition-all border border-slate-200 hover:border-blue-300 hover:shadow-sm"
                                    >
                                        <span className="text-blue-600 mr-2">→</span>
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    messages.map((message, idx) => (
                        <div key={idx}>
                            {message.isSystem ? (
                                <div className={`text-center text-xs py-2 px-4 rounded-lg ${message.isError ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {message.content}
                                </div>
                            ) : (
                                <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {message.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                    )}

                                    <div className={`max-w-[85%] ${message.role === 'user' ? 'order-first' : ''}`}>
                                        <div
                                            className={`p-3 rounded-2xl text-sm ${message.role === 'user'
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                                : message.isError
                                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                                    : 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                                }`}
                                        >
                                            <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                                        </div>

                                        {/* Search method indicator */}
                                        {message.searchMethod && (
                                            <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                                                {message.searchMethod === 'vector' ? (
                                                    <>
                                                        <Zap className="w-3 h-3 text-green-500" />
                                                        <span className="text-green-600">Semantic search</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Search className="w-3 h-3" />
                                                        <span>Keyword search</span>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {message.relevantFiles && message.relevantFiles.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {message.relevantFiles.slice(0, 4).map((file, fileIdx) => (
                                                    <span
                                                        key={fileIdx}
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg border border-slate-200"
                                                    >
                                                        <FileCode className="w-3 h-3" />
                                                        {file.split('/').pop()}
                                                    </span>
                                                ))}
                                                {message.relevantFiles.length > 4 && (
                                                    <span className="px-2 py-1 text-xs text-slate-500">
                                                        +{message.relevantFiles.length - 4} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {message.role === 'user' && (
                                        <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-slate-600" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                                <span>Analyzing codebase...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about your code..."
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || isLoading}
                        className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:shadow-none"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Floating button to open chat
export function ChatButton({ onClick, hasUnread }) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 hover:shadow-xl z-40"
        >
            <MessageCircle className="w-6 h-6" />
            {hasUnread && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
        </button>
    );
}
