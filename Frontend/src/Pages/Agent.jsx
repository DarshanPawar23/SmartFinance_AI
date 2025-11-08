import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function Agent() {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [showInput, setShowInput] = useState(false);
    const [isFinalHandoff, setIsFinalHandoff] = useState(false);
    
    // 1. ADD NEW STATE TO STORE THE UUID (offerKey)
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
        // Use the session ID from the chat controller, but initialize on first load
        if (!sessionId) {
            const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            setSessionId(newSessionId);
        }
        setMessages([
            {
                text: "Welcome to Smart Finance AI. Are you interested in a personal loan?",
                sender: 'ai',
                suggestions: ['Yes', 'No']
            }
        ]);
    }, []); // Removed sessionId from dependencies to prevent re-triggering
    
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
        // Do NOT reset offerKey here

        if (isSuggestion && userMessage.toLowerCase() === 'no' && messages.length < 3) {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    text: "No problem. You can ask me other questions about our services, like 'what is the maximum loan amount?' or 'what are the interest rates?'",
                    sender: 'ai',
                    suggestions: []
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

            // --- CATCH THE offerKey FROM THE BACKEND RESPONSE ---
            if (data.offerKey) {
                setOfferKey(data.offerKey); // Store the UUID
                setIsFinalHandoff(true);  // Show the buttons
            }

            setMessages(prev => [...prev, { text: parsedText, sender: 'ai', suggestions: finalSuggestions }]);

            // 💡 --- THIS IS THE FIX --- 💡
            // Check against data.offerKey directly, NOT the state variable
            if (finalSuggestions.length === 0 && !data.offerKey) {
                setShowInput(true);
            }

        } catch (error) {
            console.error("Failed to send message:", error);
            setMessages(prev => [...prev, { text: "I seem to be having technical difficulties. Please try again.", sender: 'ai' }]);
            setShowInput(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full flex-col bg-gray-950 font-sans">
            <header className="flex-shrink-0 border-b-2 border-green-500/30 bg-gray-900 px-6 py-4 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 2.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-gray-900 bg-green-400"></span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Smart Finance AI Assistant</h1>
                        <p className="text-sm text-green-400">Online</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6">
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

            {/* --- Footer Logic: Display final buttons or input --- */}
            {isFinalHandoff ? (
                // 🎯 FINAL HANDOFF BUTTONS
                <footer className="flex-shrink-0 border-t-2 border-green-500/30 bg-gray-900 p-4">
                    <div className="flex justify-between gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md shadow-gray-500/30"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" /></svg>
                            Exit
                        </button>
                       <button
                            onClick={() => navigate(`/application/${offerKey}`)}
                            disabled={!offerKey} 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md shadow-green-500/30 disabled:bg-gray-500"
                        >
                            Proceed Application
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                </footer>
            ) : showInput && (
                // NORMAL INPUT FIELD
                <footer className="flex-shrink-0 border-t-2 border-green-500/30 bg-gray-900 p-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' ? handleSendMessage(inputValue) : null}
                            placeholder={isLoading ? "Agent is typing..." : "Type your message..."}
                            disabled={isLoading}
                            className="w-full rounded-full border-2 border-gray-700 bg-gray-800 py-3 pl-5 pr-16 text-white placeholder-gray-500 transition duration-300 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                        />
                        <button
                            onClick={() => handleSendMessage(inputValue)}
                            disabled={!inputValue.trim() || isLoading}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-green-500 p-2.5 text-white transition duration-300 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:cursor-not-allowed disabled:bg-gray-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </div>
                </footer>
            )}
        </div>
    );
}

// ... (ChatMessage and TypingIndicator components are unchanged) ...
const ChatMessage = ({ message, sender, suggestions, onSuggestionClick }) => {
    const isAI = sender === 'ai';
    const formatMessage = (text) => {
        return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };
    
    return (
        <div className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}>
            <div className={`flex items-end gap-3 ${isAI ? 'justify-start' : 'justify-end'} w-full`}>
                {isAI && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500 text-sm font-bold text-white">AI</div>
                )}
                <div className={`max-w-md rounded-2xl px-4 py-3 text-white shadow-md ${isAI ? 'rounded-bl-none bg-gray-800' : 'rounded-br-none bg-green-600'}`}>
                    <p className="text-base">{formatMessage(message)}</p>
                </div>
            </div>
            {suggestions && suggestions.length > 0 && (
                <div className="mt-2 flex gap-2 pl-11">
                    {suggestions.map((text, index) => (
                        <button
                            key={index}
                            onClick={() => onSuggestionClick(text)}
                            className="rounded-full border-2 border-green-500/50 bg-gray-800 px-4 py-1.5 text-sm text-green-300 transition hover:bg-gray-700 hover:text-white"
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
    <div className="flex items-end gap-3 justify-start">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500 text-sm font-bold text-white">AI</div>
        <div className="flex items-center space-x-1.5 rounded-2xl bg-gray-800 px-4 py-3 shadow-md">
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></span>
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></span>
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></span>
        </div>
    </div>
);

export default Agent;
