import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ChatMessage = ({ message, sender, suggestions, onSuggestionClick }) => {
    const isAI = sender === 'ai';
    const formatMessage = (text) => {
        return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-extrabold text-amber-300">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };
    
    return (
        <div className={`flex flex-col animate-message-entry ${isAI ? 'items-start' : 'items-end'}`}>
            <div className={`flex items-end gap-3 ${isAI ? 'justify-start' : 'justify-end'} w-full`}>
                {isAI && (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-amber-500 border border-amber-500/50 text-base font-bold">AI</div>
                )}
                <div className={`max-w-md rounded-2xl px-5 py-3 text-white shadow-lg shadow-black/20 transition-all duration-300 ${isAI ? 'rounded-bl-none bg-slate-800' : 'rounded-br-none bg-indigo-600'}`}>
                    <p className="text-base leading-relaxed">{formatMessage(message)}</p>
                </div>
            </div>
            {suggestions && suggestions.length > 0 && (
                <div className={`mt-3 flex flex-wrap gap-2 ${isAI ? 'pl-14' : 'pr-3'} max-w-full`}>
                    {suggestions.map((text, index) => (
                        <button
                            key={index}
                            onClick={() => onSuggestionClick(text)}
                            className="rounded-full border border-amber-500/50 bg-slate-800 px-4 py-1.5 text-sm text-amber-300 transition-all hover:bg-amber-500 hover:text-gray-900 shadow-md whitespace-nowrap"
                        >
                            {text}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const TypingIndicator = () => (
    <div className="flex items-end gap-3 justify-start animate-message-entry">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-amber-500 border border-amber-500/50 text-base font-bold">AI</div>
        <div className="flex items-center space-x-2 rounded-2xl bg-slate-800 px-5 py-3 shadow-md shadow-black/20">
            <span className="text-slate-400">Agent is composing...</span>
            <div className="flex space-x-1.5 ml-2">
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-amber-500 [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-amber-500 [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-amber-500"></span>
            </div>
        </div>
    </div>
);

export default function Agent() {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [showInput, setShowInput] = useState(false);
    const [isFinalHandoff, setIsFinalHandoff] = useState(false);
    
    const [offerKey, setOfferKey] = useState(null); 

    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!sessionId) {
            const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            setSessionId(newSessionId);
        }
        setMessages([
            {
                text: "Welcome to **Smart Finance AI**. I am ready to assist with your institutional financial queries. Are you interested in a personal loan today?",
                sender: 'ai',
                suggestions: ['Yes, tell me more', 'Not right now, thank you']
            }
        ]);
    }, []);
    
    const parseResponseForSuggestions = (responseText) => {
        const suggestionRegex = /\(([^)]+)\)/;
        const match = responseText.match(suggestionRegex);

        if (match && match[1]) {
            const suggestions = match[1].split('/').map(s => s.trim());
            const cleanText = responseText.replace(suggestionRegex, '').trim();
            return { text: cleanText, suggestions };
        }

        return { text: responseText, suggestions: [] };
    };

    const handleSendMessage = async (text, isSuggestion = false) => {
        const userMessage = text.trim();
        if (!userMessage || isLoading) return;

        let currentMessages = [...messages];
        if (isSuggestion && currentMessages.length > 0) {
            const lastMessage = currentMessages[currentMessages.length - 1];
            if (lastMessage.suggestions) {
                lastMessage.suggestions = [];
            }
        }

        currentMessages.push({ text: userMessage, sender: 'user' });
        setMessages(currentMessages);
        setInputValue('');
        setIsLoading(true);
        setShowInput(false);
        setIsFinalHandoff(false); 

        if (isSuggestion && userMessage.toLowerCase().includes('not right now') && messages.length < 3) {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    text: "Understood. Feel free to ask about our **Risk Management tools**, **Investment Strategies**, or **Regulatory Compliance**.",
                    sender: 'ai',
                    suggestions: ['Risk Management tools', 'Investment Strategies', 'Regulatory Compliance']
                }]);
                setIsLoading(false);
                setShowInput(true);
            }, 1000);
            return;
        }

        try {
            const response = await fetch('http://localhost:5002/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, message: userMessage }),
            });

            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            
            const data = await response.json();
            
            const apiSuggestions = data.suggestions || [];
            const { text: parsedText, suggestions: parsedSuggestions } = parseResponseForSuggestions(data.response);
            const finalSuggestions = apiSuggestions.length > 0 ? apiSuggestions : parsedSuggestions;

            if (data.offerKey) {
                setOfferKey(data.offerKey);
                setIsFinalHandoff(true); 
            }

            setMessages(prev => [...prev, { text: parsedText, sender: 'ai', suggestions: finalSuggestions }]);

            if (finalSuggestions.length === 0 && !data.offerKey) {
                setShowInput(true);
            }

        } catch (error) {
            setMessages(prev => [...prev, { text: "Connection error: I am experiencing difficulties communicating with the core system. Please check the network connection and try again.", sender: 'ai' }]);
            setShowInput(true);
        } finally {
            setIsLoading(false);
        }
    };

    const globalStyles = `
        @keyframes message-entry {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-message-entry {
            animation: message-entry 0.3s ease-out forwards;
        }
        @keyframes pulse-dot {
            0%, 60%, 100% { opacity: 0.3; }
            30% { opacity: 1; }
        }
        .animate-pulse-dot {
            animation: pulse-dot 1.2s infinite;
        }
    `;

    return (
        <div className="flex h-screen w-full flex-col bg-slate-950 font-sans overflow-hidden">
            <style>{globalStyles}</style>
            
            <header className="flex-shrink-0 border-b border-amber-500/30 bg-slate-900 px-6 py-4 shadow-xl shadow-black/30">
                <div className="flex items-center gap-4">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-amber-500 border border-amber-500/50 text-xl font-bold">
                        SFA
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 bg-green-500 animate-pulse"></span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Smart Finance AI Assistant</h1>
                        <p className="text-sm text-amber-400">Institutional Advisor Status: Online</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
                <div className="space-y-6">
                    {messages.map((msg, index) => (
                        <ChatMessage
                            key={index}
                            message={msg.text}
                            sender={msg.sender}
                            suggestions={msg.suggestions}
                            onSuggestionClick={(text) => handleSendMessage(text, true)}
                        />
                    ))}
                    {isLoading && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </div>
            </main>

            {isFinalHandoff ? (
                <footer className="flex-shrink-0 border-t border-amber-500/30 bg-slate-900 p-4 shadow-2xl shadow-black/50">
                    <div className="flex justify-between gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="flex-1 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-xl transition duration-300 shadow-lg shadow-black/30 text-lg"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline mr-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" /></svg>
                            Exit Chat
                        </button>
                       <button
                            onClick={() => navigate(`/application/${offerKey}`)}
                            disabled={!offerKey} 
                            className="flex-1 flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-3 px-4 rounded-xl transition duration-300 shadow-xl shadow-amber-500/30 text-lg disabled:bg-slate-600 disabled:text-slate-400 disabled:shadow-none"
                        >
                            Proceed to Application
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline ml-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                </footer>
            ) : showInput && (
                <footer className="flex-shrink-0 border-t border-amber-500/30 bg-slate-900 p-4 shadow-2xl shadow-black/50">
                    <div className="relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' ? handleSendMessage(inputValue) : null}
                            placeholder={isLoading ? "Agent is composing a response..." : "Type your query here..."}
                            disabled={isLoading}
                            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-4 pl-5 pr-16 text-white placeholder-slate-500 transition duration-300 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-70 text-lg"
                        />
                        <button
                            onClick={() => handleSendMessage(inputValue)}
                            disabled={!inputValue.trim() || isLoading}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-amber-500 p-2.5 text-gray-950 transition duration-300 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </div>
                </footer>
            )}
        </div>
    );
}