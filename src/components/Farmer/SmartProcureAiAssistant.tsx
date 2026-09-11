import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AiChatMessage,
  buildContextSnapshot,
  generateDeterministicResponse,
} from '../../services/smartProcureAiEngine';
import {
  Sparkles,
  Wheat,
  X,
  Send,
  Mic,
  MicOff,
  RotateCcw,
  ArrowRight,
  Bot,
  User,
  ShieldCheck,
  Radio,
  ExternalLink,
  ChevronDown,
  Globe,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface SmartProcureAiAssistantProps {
  onNavigate: (tab: string) => void;
  onOpenNotifications?: () => void;
}

export const SmartProcureAiAssistant: React.FC<SmartProcureAiAssistantProps> = ({
  onNavigate,
  onOpenNotifications,
}) => {
  const {
    currentFarmer,
    getFarmerActiveBooking,
    getFarmerQueueStats,
    procurements,
    payments,
    centres,
    notifications,
    isOnline,
    language,
    setLanguage,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const activeBooking = getFarmerActiveBooking(currentFarmer.id);
  const queueStats = activeBooking ? getFarmerQueueStats(activeBooking.id) : undefined;
  const farmerProcurement = procurements.find(
    (p) => p.farmerId === currentFarmer.id || (activeBooking && p.bookingId === activeBooking.id)
  );
  const farmerPayment = payments.find(
    (p) => p.farmerId === currentFarmer.id || (activeBooking && p.bookingId === activeBooking.id)
  );

  const getWelcomeText = (lang: string) => {
    if (lang === 'hi') {
      return 'नमस्ते! मैं आपका स्मार्टप्रोक्योर सहायक हूँ। मैं आपकी बुकिंग, टोकन, कतार, तौल और भुगतान में सहायता कर सकता हूँ।';
    }
    if (lang === 'te') {
      return 'నమస్తే! నేను మీ స్మార్ట్ ప్రొక్యూర్ అసిస్టెంట్‌ని. మీ బుకింగ్, టోకెన్, క్యూ, సేకరణ మరియు చెల్లింపుల గురించి సహాయం చేయగలను.';
    }
    return "Namaste! I'm your SmartProcure Assistant. I can help you with your booking, token, queue, procurement and payment.";
  };

  const [messages, setMessages] = useState<AiChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: getWelcomeText(language),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Update welcome message if language changes and only 1 message exists
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'welcome-msg') {
      setMessages([
        {
          id: 'welcome-msg',
          sender: 'assistant',
          text: getWelcomeText(language),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [language]);

  // Initialize Web Speech API for voice assistance
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue(transcript);
          handleSendMessage(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone access was denied. Please allow microphone in browser.');
        } else {
          setSpeechError('Could not recognize voice. Please try speaking again or type.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError('Voice input is not supported in this browser. Please type your question.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSpeechError(null);
      // set language for speech recognition
      const langCode = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';
      recognitionRef.current.lang = langCode;
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start failed:', err);
      }
    }
  };

  const quickQuestions = [
    { en: 'Where is my token?', hi: 'मेरा टोकन कहाँ है?', te: 'నా టోకెన్ ఎక్కడ ఉంది?' },
    { en: 'What should I do now?', hi: 'मुझे अब क्या करना चाहिए?', te: 'నేను ఇప్పుడు ఏమి చేయాలి?' },
    { en: 'How long will I wait?', hi: 'मुझे कितना इंतज़ार करना होगा?', te: 'నేను ఎంత సమయం వేచి ఉండాలి?' },
    { en: 'Check my payment', hi: 'मेरा भुगतान जांचें', te: 'నా చెల్లింపు తనిఖీ చేయండి' },
    { en: 'Show my booking', hi: 'मेरी बुकिंग दिखाएं', te: 'నా బుకింగ్ చూపించండి' },
    { en: 'Which centre is best?', hi: 'कौन सा केंद्र सबसे अच्छा है?', te: 'నాకు ఏ కేంద్రం ఉత్తమం?' },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const contextSnapshot = buildContextSnapshot({
      role: 'farmer',
      language,
      currentFarmer,
      activeBooking,
      queueStats,
      procurement: farmerProcurement,
      payment: farmerPayment,
      centres,
      notifications,
      isOnline,
    });

    // If Demo Mode is explicitly toggled, or network offline, use deterministic engine immediately
    if (isDemoMode || !isOnline) {
      setTimeout(() => {
        const response = generateDeterministicResponse(query, {
          role: 'farmer',
          language,
          currentFarmer,
          activeBooking,
          queueStats,
          procurement: farmerProcurement,
          payment: farmerPayment,
          centres,
          notifications,
          isOnline,
        });

        const assistantMsg: AiChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: response.text,
          action: response.action,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isDemoFallback: true,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setIsLoading(false);
      }, 400);
      return;
    }

    // Try server-side Gemini endpoint
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          role: 'farmer',
          language,
          contextSnapshot,
          history: messages.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data && data.text) {
        const assistantMsg: AiChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.text,
          action: data.action,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isDemoFallback: false,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      // Graceful fallback to deterministic engine
      console.info('Using SmartProcure AI deterministic engine fallback:', err);
      const fallbackResponse = generateDeterministicResponse(query, {
        role: 'farmer',
        language,
        currentFarmer,
        activeBooking,
        queueStats,
        procurement: farmerProcurement,
        payment: farmerPayment,
        centres,
        notifications,
        isOnline,
      });

      const assistantMsg: AiChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: fallbackResponse.text,
        action: fallbackResponse.action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDemoFallback: true,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: { type: string; target: string; label: string }) => {
    if (action.target === 'notifications' && onOpenNotifications) {
      onOpenNotifications();
    } else if (action.target) {
      onNavigate(action.target);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-msg-reset',
        sender: 'assistant',
        text: getWelcomeText(language),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsOpen(true)}
            id="smartprocure-ai-fab-button"
            className="group relative flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-emerald-400/40 cursor-pointer"
            aria-label="Open SmartProcure AI Assistant"
          >
            {/* Pulsing indicator */}
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
            </span>

            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold">
              <Wheat className="w-4 h-4 text-white" />
            </div>

            <div className="text-left">
              <div className="text-xs font-black tracking-wide flex items-center gap-1">
                <span>Ask SmartProcure AI</span>
                <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
              </div>
              <div className="text-[10px] text-emerald-100/90 font-medium">
                {activeBooking ? `Token ${activeBooking.token} Ready` : 'Procurement Help & Status'}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Main AI Chat Panel */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 shadow-2xl flex flex-col bg-white border border-slate-200 overflow-hidden ${
            isExpanded
              ? 'inset-4 sm:inset-10 rounded-3xl'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[85vh] rounded-3xl'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-4 flex items-center justify-between border-b border-emerald-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-700/80 border border-emerald-500/50 flex items-center justify-center shadow-xs">
                <Wheat className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold tracking-tight flex items-center gap-1.5">
                    <span>SmartProcure AI</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  </h3>
                  <button
                    onClick={() => setIsDemoMode(!isDemoMode)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors cursor-pointer ${
                      isDemoMode
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    }`}
                    title="Click to toggle between Live Gemini AI and AI Demo Mode"
                  >
                    {isDemoMode ? '⚡ AI Demo Mode' : '🟢 Live AI'}
                  </button>
                </div>
                <p className="text-[11px] text-emerald-200/90 font-medium">
                  Your intelligent farming & procurement assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Language Switcher */}
              <div className="flex items-center bg-emerald-950/60 rounded-xl p-0.5 border border-emerald-600/40 text-[10px]">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-1.5 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                    language === 'en' ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:text-white'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('hi')}
                  className={`px-1.5 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                    language === 'hi' ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:text-white'
                  }`}
                >
                  हिन्दी
                </button>
                <button
                  onClick={() => setLanguage('te')}
                  className={`px-1.5 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                    language === 'te' ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:text-white'
                  }`}
                >
                  తెలుగు
                </button>
              </div>

              {/* Clear chat */}
              <button
                onClick={clearChat}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800/60 rounded-xl transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Expand/Contract */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800/60 rounded-xl transition-colors cursor-pointer hidden sm:block"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800/60 rounded-xl transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context Ribbon */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-slate-900">{currentFarmer.name}</span>
              <span className="font-mono text-slate-500">({currentFarmer.farmerId})</span>
              <span>•</span>
              {activeBooking ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                  <Radio className="w-3 h-3 text-emerald-600" />
                  <span>Token: {activeBooking.token}</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    (Pos #{queueStats?.position || 1})
                  </span>
                </span>
              ) : (
                <span className="text-slate-500">No active token</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-2xs whitespace-pre-line ${
                        isUser
                          ? 'bg-emerald-600 text-white rounded-tr-none font-medium'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none font-normal'
                      }`}
                    >
                      {msg.text}

                      {/* Action Trigger Button */}
                      {msg.action && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-start">
                          <button
                            onClick={() => handleActionClick(msg.action!)}
                            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <span>{msg.action.label}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div
                      className={`flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400 ${
                        isUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {msg.isDemoFallback && (
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 rounded font-mono">
                          Deterministic
                        </span>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                      {currentFarmer.name.charAt(0)}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none text-xs text-slate-500 flex items-center gap-2 shadow-2xs">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="text-[11px] font-medium">SmartProcure AI is analyzing live data...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto scrollbar-none flex items-center gap-1.5 flex-nowrap">
            {quickQuestions.map((item, idx) => {
              const label =
                language === 'hi' ? item.hi : language === 'te' ? item.te : item.en;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(label)}
                  disabled={isLoading}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-slate-700 hover:text-emerald-900 text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Speech Error Banner */}
          {speechError && (
            <div className="px-4 py-1.5 bg-rose-50 border-t border-rose-200 text-[11px] text-rose-700 flex items-center justify-between">
              <span>{speechError}</span>
              <button
                onClick={() => setSpeechError(null)}
                className="text-rose-900 font-bold ml-2 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  language === 'hi'
                    ? 'टोकन, कतार या भुगतान के बारे में पूछें...'
                    : language === 'te'
                    ? 'టోకెన్, క్యూ లేదా చెల్లింపు గురించి అడగండి...'
                    : 'Ask about token, queue, weighing, or payment...'
                }
                className="flex-1 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition-all text-slate-800 placeholder:text-slate-400"
                disabled={isLoading}
              />

              {/* Microphone Voice Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  isListening
                    ? 'bg-rose-600 text-white border-rose-700 animate-pulse ring-4 ring-rose-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title={isListening ? 'Stop listening' : 'Voice Input (Speak your question)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="text-[10px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
              <span>🌾 AI-generated assistance based on current SmartProcure data.</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
