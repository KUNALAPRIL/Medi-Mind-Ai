import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, Plus, Trash2, Send, Bot, User, Loader2, Mic, MicOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ChatSession {
  _id: string;
  title: string;
  updatedAt: string;
}

interface ChatMessage {
  _id?: string;
  sender: 'user' | 'model';
  content: string;
}

export const Chat: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    
    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      console.error("Speech Recognition Error:", event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone permission denied. Please click the lock/settings icon in your browser address bar and allow microphone access.");
      } else if (event.error === 'no-speech') {
        alert("No voice detected. Please speak clearly into your microphone.");
      } else {
        alert(`Microphone error: ${event.error}. Please check your hardware or use a supported browser like Google Chrome.`);
      }
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev) => prev ? prev + ' ' + transcript : transcript);
    };

    recognition.start();
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      const response = await api.get('/api/v1/chat/sessions');
      setSessions(response.data.data);
      if (response.data.data.length > 0 && !currentSessionId) {
        loadSession(response.data.data[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
    }
  };

  const loadSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsLoadingMessages(true);
    try {
      const response = await api.get(`/api/v1/chat/sessions/${sessionId}/messages`);
      setMessages(response.data.data);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const createSession = async () => {
    try {
      const title = `New Consultation ${new Date().toLocaleDateString()}`;
      const response = await api.post('/api/v1/chat/sessions', { title });
      const newSession = response.data.data;
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession._id);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/v1/chat/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentSessionId || isStreaming) return;

    const userMessageText = inputText;
    setInputText('');

    // Append user message local view
    const userMsg: ChatMessage = { sender: 'user', content: userMessageText };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    // Append mock template placeholder for incoming stream
    const assistantMsg: ChatMessage = { sender: 'model', content: '' };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/chat/sessions/${currentSessionId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessageText }),
      });

      if (!response.ok) {
        let errMsg = 'Server error occurred during streaming';
        try {
          const errJson = await response.json();
          errMsg = errJson.message || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      if (!response.body) throw new Error('ReadableStream not active');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let finished = false;

      while (!finished) {
        const { value, done } = await reader.read();
        finished = done;
        if (value) {
          const chunkStr = decoder.decode(value);
          const lines = chunkStr.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const content = line.substring(6).trim();
              if (content === '[DONE]') {
                finished = true;
                break;
              }
              try {
                const parsed = JSON.parse(content);
                if (parsed.chunk) {
                  setMessages((prev) => {
                    const newMsgs = [...prev];
                    const lastIndex = newMsgs.length - 1;
                    newMsgs[lastIndex] = {
                      ...newMsgs[lastIndex],
                      content: newMsgs[lastIndex].content + parsed.chunk,
                    };
                    return newMsgs;
                  });
                }
              } catch (e) {
                // Parsing fallback if parsing line issues happen
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to stream response:', error);
      setMessages((prev) => {
        const newMsgs = [...prev];
        const lastIndex = newMsgs.length - 1;
        newMsgs[lastIndex] = {
          ...newMsgs[lastIndex],
          content: 'An error occurred during communication. Please try again.',
        };
        return newMsgs;
      });
    } finally {
      setIsStreaming(false);
      fetchSessions(); // Refresh updated timestamp
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      
      {/* Sidebar Threads List */}
      <aside className={`w-80 h-full border-r border-white/20 dark:border-white/5 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md flex flex-col shrink-0 transition-all ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full absolute md:relative z-20'}`}>
        <div className="p-4 border-b border-white/20 dark:border-white/5">
          <button
            onClick={createSession}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-blue-500/10"
          >
            <Plus size={16} />
            New Consultation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sessions.map((session) => (
            <div
              key={session._id}
              onClick={() => loadSession(session._id)}
              className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 border transition-all ${
                currentSessionId === session._id
                  ? 'bg-white/70 dark:bg-slate-800/60 border-blue-200 dark:border-blue-900/40 shadow-sm'
                  : 'border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className="text-slate-400 shrink-0" />
                <span className="text-sm font-semibold truncate text-slate-800 dark:text-white">
                  {session.title}
                </span>
              </div>
              <button
                onClick={(e) => deleteSession(session._id, e)}
                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat Window Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white/10 dark:bg-slate-900/10">
        
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!currentSessionId ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <Bot className="text-blue-500 animate-bounce mb-4" size={48} />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Start a Medical Consultation</h2>
              <p className="text-xs text-slate-400 mt-2">MediMind AI is ready. Start by clicking 'New Consultation' or select a session in the sidebar.</p>
            </div>
          ) : isLoadingMessages ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-4 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`p-2.5 rounded-2xl h-10 w-10 flex items-center justify-center shrink-0 border ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 border-blue-700 text-white'
                      : 'bg-white dark:bg-slate-800 border-white/20 dark:border-white/5 text-slate-700 dark:text-slate-200'
                  }`}>
                    {msg.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
                  </div>

                  <div className={`p-4 rounded-3xl text-sm leading-relaxed border ${
                    msg.sender === 'user'
                      ? 'bg-blue-100/40 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/20 text-slate-800 dark:text-white'
                      : 'bg-white/60 dark:bg-slate-800/40 border-white/20 dark:border-white/5 text-slate-700 dark:text-slate-200'
                  }`}>
                    {msg.content === '' && isStreaming && index === messages.length - 1 ? (
                      <div className="flex gap-1.5 py-1 items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-300 animate-bounce"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-300 animate-bounce [animation-delay:0.2s]"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-300 animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    ) : (
                      <ReactMarkdown className="markdown-content prose dark:prose-invert max-w-none">
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input box */}
        {currentSessionId && (
          <form onSubmit={handleSendMessage} className="p-4 border-t border-white/20 dark:border-white/5 bg-white/20 dark:bg-slate-900/20">
            <div className="relative max-w-4xl mx-auto flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isStreaming}
                placeholder="Describe your symptoms or ask a medical question..."
                className="w-full pl-6 pr-24 py-3.5 rounded-full glass-input text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
              />
              <button
                type="button"
                onClick={startListening}
                disabled={isStreaming}
                className={`absolute right-12 p-2 rounded-full transition-all active:scale-95 ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Speak to type / बोलें"
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button
                type="submit"
                disabled={isStreaming || !inputText.trim()}
                className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-full transition-all active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">AI advice does not replace official clinical consultations.</p>
          </form>
        )}
      </div>
    </div>
  );
};
export default Chat;
