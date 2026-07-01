import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getChatThreads, getMessagesForChat, sendMessageToStorage } from '../../data/chatData';
import { ChatThread, ChatMessage } from '../../types';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat sidebar threads
  useEffect(() => {
    const activeThreads = getChatThreads();
    setThreads(activeThreads);
    if (activeThreads.length > 0) {
      setActiveThread(activeThreads[0]); // Default first chat open karein
    }
  }, []);

  // Load messages whenever active thread changes
  useEffect(() => {
    if (activeThread) {
      const chatMessages = getMessagesForChat(activeThread.id);
      setMessages(chatMessages);
    }
  }, [activeThread]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeThread || !newMessageText.trim()) return;

    // Save message to storage layer
    const sentMsg = sendMessageToStorage(activeThread.id, Number(user.id), newMessageText.trim());
    
    // Update local list state instantly
    setMessages(prev => [...prev, sentMsg]);
    setNewMessageText('');

    // Refresh threads sidebar to show updated last message
    setThreads(getChatThreads());
  };

  if (!user) return <div className="p-6 text-gray-500">Please log in to view messages.</div>;

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
      
      {/* 1. LEFT SIDEBAR: THREADS LIST */}
      <div className="w-full md:w-80 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Messages</h2>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-transparent rounded-lg text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setActiveThread(thread)}
              className={`w-full text-left p-4 flex items-start gap-3 transition-colors ${
                activeThread?.id === thread.id ? 'bg-blue-50/70' : 'hover:bg-gray-50/50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{thread.participantName}</h4>
                  <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{thread.updatedAt}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{thread.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. RIGHT PANE: ACTIVE CHET WINDOW */}
      <div className="hidden md:flex flex-1 flex-col bg-gray-50/30">
        {activeThread ? (
          <>
            {/* Active Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                {activeThread.participantName.charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{activeThread.participantName}</h3>
                <p className="text-[11px] text-green-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span> Online
                </p>
              </div>
            </div>

            {/* Messages Display Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.senderId === Number(user.id);
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                    }`}>
                      <p className="leading-relaxed break-words">{msg.text}</p>
                      <span className={`block text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Text Input Action Form */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Type a secure message..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-gray-50/30"
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <p className="text-sm">Select a conversation to start chatting</p>
          </div>
        )}
      </div>

    </div>
  );
};