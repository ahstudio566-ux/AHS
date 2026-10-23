
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SpeakerWaveIcon } from './icons/SpeakerWaveIcon';
import { SpeakerXMarkIcon } from './icons/SpeakerXMarkIcon';

interface FloatingAIAssistantProps {
    isOpen: boolean;
    onToggle: () => void;
    messages: ChatMessage[];
    isLoading: boolean;
    onSubmit: (message: string) => void;
    onClearChat: () => void;
}

const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({ isOpen, onToggle, messages, isLoading, onSubmit, onClearChat }) => {
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(true); // Default to speaking enabled
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [messages, isLoading, isOpen]);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'vi-VN';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                onSubmit(transcript); // Auto-submit on voice end
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [onSubmit]);

    // Handle Text-to-Speech
    useEffect(() => {
        if (!isSpeaking || !isOpen) {
            synthRef.current.cancel();
            return;
        }

        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'model' && !isLoading) {
            // Strip markdown for speech
            const textToSpeak = lastMessage.content.replace(/[*_#`]/g, '');
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = 'vi-VN';
            utterance.rate = 1.1; // Slightly faster
            synthRef.current.speak(utterance);
        }
    }, [messages, isSpeaking, isOpen, isLoading]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const toggleSpeaking = () => {
        if (isSpeaking) {
            synthRef.current.cancel();
        }
        setIsSpeaking(!isSpeaking);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSubmit(input);
            setInput('');
        }
    };

    const lastMessage = messages[messages.length - 1];
    const showSuggestions = !isLoading && lastMessage?.role === 'model' && lastMessage.suggestions;

    return (
        <div className="fixed bottom-24 md:bottom-8 right-6 z-[1002] pointer-events-none flex flex-col items-end space-y-4">
            {/* Cửa sổ Chat */}
            <div className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom-right ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto scale-100' : 'opacity-0 translate-y-10 pointer-events-none scale-90'}`}>
                <div className="w-[calc(100vw-2rem)] sm:w-[400px] h-[600px] max-h-[75vh] bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/40 ring-1 ring-black/5">
                    
                    {/* Header */}
                    <div className="relative z-10 flex flex-col h-full">
                        <header className="p-5 border-b border-slate-100/50 flex items-center justify-between flex-shrink-0 bg-white/40 backdrop-blur-md sticky top-0">
                            <div className="flex items-center space-x-4">
                                <div className="bg-gradient-to-br from-brand-400 to-brand-600 p-2.5 rounded-2xl shadow-lg shadow-brand-100 transform hover:rotate-6 transition-transform">
                                    <SparklesIcon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Trợ lý AI Xanh</h3>
                                    <p className="text-[10px] font-bold text-slate-400 flex items-center uppercase tracking-tighter">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                                        Sẵn sàng hỗ trợ 24/7
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={toggleSpeaking}
                                    className={`p-2.5 rounded-xl transition-all ${isSpeaking ? 'text-brand-600 bg-brand-50' : 'text-slate-400 hover:bg-slate-50'}`}
                                    title={isSpeaking ? "Tắt đọc giọng nói" : "Bật đọc giọng nói"}
                                >
                                    {isSpeaking ? <SpeakerWaveIcon className="w-5 h-5" /> : <SpeakerXMarkIcon className="w-5 h-5" />}
                                </button>
                                <button 
                                    onClick={onClearChat} 
                                    className="text-slate-400 hover:text-red-500 transition-all p-2.5 rounded-xl hover:bg-red-50"
                                    title="Xóa lịch sử chat"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                </button>
                                <button onClick={onToggle} className="text-slate-400 hover:text-slate-900 transition-all p-2.5 rounded-xl hover:bg-slate-100">
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </header>
                        
                        {/* Messages Area */}
                        <div className="flex-grow p-5 overflow-y-auto bg-slate-50/30">
                            <div className="space-y-6">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                            <div className={`px-5 py-3.5 shadow-sm text-sm leading-relaxed ${
                                                msg.role === 'user' 
                                                ? 'bg-brand-600 text-white rounded-[1.5rem] rounded-tr-none font-bold' 
                                                : 'bg-white text-slate-700 border border-slate-100 rounded-[1.5rem] rounded-tl-none font-medium'
                                            }`}>
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                                {msg.imageUrl && (
                                                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                                                        <img src={msg.imageUrl} alt="AI Generated" className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                                                <div className="mt-3 w-full space-y-2">
                                                    {msg.groundingChunks.map((chunk, chunkIndex) => (
                                                        chunk.maps && (
                                                            <a 
                                                                key={chunkIndex}
                                                                href={chunk.maps.uri}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-slate-100 hover:border-brand-400 hover:shadow-lg transition-all group"
                                                            >
                                                                <div className="bg-blue-50 p-2 rounded-xl group-hover:bg-blue-100 transition-colors shrink-0">
                                                                    <GlobeIcon className="w-4 h-4 text-blue-600" />
                                                                </div>
                                                                <div className="overflow-hidden min-w-0">
                                                                    <p className="font-black text-slate-900 group-hover:text-brand-700 truncate text-[11px] uppercase tracking-tight">{chunk.maps.title}</p>
                                                                    <p className="text-[10px] font-bold text-blue-500 group-hover:underline truncate uppercase tracking-tighter">Mở bản đồ</p>
                                                                </div>
                                                            </a>
                                                        )
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="px-5 py-3.5 rounded-[1.5rem] rounded-tl-none bg-white border border-slate-100 shadow-sm flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                                            <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                                            <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
 
                        {/* Input Area */}
                        <footer className="p-4 bg-white/60 backdrop-blur-md border-t border-slate-100/50 flex-shrink-0">
                            {showSuggestions && (
                                <div className="pb-4 overflow-x-auto no-scrollbar scroll-smooth">
                                  <div className="flex gap-2 min-w-max px-1">
                                    {lastMessage.suggestions?.map((suggestion, index) => (
                                      <button
                                        key={index}
                                        onClick={() => onSubmit(suggestion)}
                                        className="px-4 py-2 bg-brand-50 border border-brand-100 text-brand-700 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-brand-100 hover:border-brand-200 transition-all focus:outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm whitespace-nowrap"
                                      >
                                        {suggestion}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            <form onSubmit={handleSubmit} className="flex items-center space-x-2 bg-slate-100/50 p-2 rounded-[1.5rem] border border-slate-200 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10 focus-within:bg-white transition-all">
                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse' : 'text-slate-500 hover:bg-slate-200'}`}
                                    title="Nhập bằng giọng nói"
                                >
                                    <MicrophoneIcon className="w-5 h-5" />
                                </button>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={isListening ? "Đang nghe..." : "Hỏi về môi trường..."}
                                    className="flex-grow px-3 py-2 text-sm bg-transparent border-none focus:ring-0 text-slate-900 font-bold placeholder-slate-400"
                                    disabled={isLoading}
                                />
                                <button 
                                    type="submit" 
                                    disabled={isLoading || !input.trim()} 
                                    className="bg-brand-600 text-white rounded-xl p-3 shadow-lg shadow-brand-100 hover:bg-brand-700 hover:shadow-brand-200 transition-all disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed flex-shrink-0 active:scale-95"
                                >
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                </button>
                            </form>
                        </footer>
                    </div>
                </div>
            </div>
 
            {/* Floating Toggle Button */}
             <button
                onClick={onToggle}
                className={`group flex items-center justify-center w-16 h-16 rounded-[2rem] shadow-2xl transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-brand-500/30 pointer-events-auto relative ${isOpen ? 'bg-slate-900 rotate-90' : 'bg-gradient-to-br from-brand-500 to-brand-700'}`}
                aria-label={isOpen ? "Đóng Trợ lý AI" : "Mở Trợ lý AI"}
            >
                {!isOpen && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                    AI
                  </span>
                )}
                {isOpen ? <XMarkIcon className="w-7 h-7 text-white" /> : <SparklesIcon className="w-8 h-8 text-white animate-pulse"/>}
            </button>
        </div>
    );
};

export default FloatingAIAssistant;
