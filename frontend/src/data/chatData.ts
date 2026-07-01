import { ChatMessage, ChatThread } from '../types';

// Default mock data for testing chat histories
const DEFAULT_THREADS: ChatThread[] = [
  {
    id: 'chat-1',
    participantId: 2,
    participantName: 'Michael Rodriguez (Investor)',
    participantRole: 'investor',
    lastMessage: 'I reviewed your pitch deck. Let’s connect!',
    updatedAt: '10:30 AM'
  },
  {
    id: 'chat-2',
    participantId: 3,
    participantName: 'Jennifer Lee (Investor)',
    participantRole: 'investor',
    lastMessage: 'What is your projected revenue for Q4?',
    updatedAt: 'Yesterday'
  }
];

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    chatId: 'chat-1',
    senderId: 2, // From Investor
    text: 'Hello! I reviewed your pitch deck and found the concept quite interesting.',
    timestamp: '10:28 AM'
  },
  {
    id: 'msg-2',
    chatId: 'chat-1',
    senderId: 1, // From you (Entrepreneur)
    text: 'Thank you Michael! Glad you liked it. I am available for a quick sync anytime.',
    timestamp: '10:29 AM'
  },
  {
    id: 'msg-3',
    chatId: 'chat-1',
    senderId: 2,
    text: 'I reviewed your pitch deck. Let’s connect!',
    timestamp: '10:30 AM'
  }
];

// Helper to initialize LocalStorage for chat
const initializeChatStorage = () => {
  if (!localStorage.getItem('mock_threads')) {
    localStorage.setItem('mock_threads', JSON.stringify(DEFAULT_THREADS));
  }
  if (!localStorage.getItem('mock_messages')) {
    localStorage.setItem('mock_messages', JSON.stringify(DEFAULT_MESSAGES));
  }
};

// 1. Get all active chat threads for left sidebar
export const getChatThreads = (): ChatThread[] => {
  initializeChatStorage();
  return JSON.parse(localStorage.getItem('mock_threads') || '[]');
};

// 2. Get messages for a specific active chat screen
export const getMessagesForChat = (chatId: string): ChatMessage[] => {
  initializeChatStorage();
  const allMessages: ChatMessage[] = JSON.parse(localStorage.getItem('mock_messages') || '[]');
  return allMessages.filter(msg => msg.chatId === chatId);
};

// 3. Send and insert a new message into local storage array
export const sendMessageToStorage = (chatId: string, senderId: number, text: string): ChatMessage => {
  initializeChatStorage();
  
  const allMessages = JSON.parse(localStorage.getItem('mock_messages') || '[]');
  const allThreads = JSON.parse(localStorage.getItem('mock_threads') || '[]');

  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    chatId,
    senderId,
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  // Push new message
  allMessages.push(newMessage);
  localStorage.setItem('mock_messages', JSON.stringify(allMessages));

  // Update last message in thread list view
  const threadIndex = allThreads.findIndex((t: ChatThread) => t.id === chatId);
  if (threadIndex !== -1) {
    allThreads[threadIndex].lastMessage = text;
    allThreads[threadIndex].updatedAt = newMessage.timestamp;
    localStorage.setItem('mock_threads', JSON.stringify(allThreads));
  }

  return newMessage;
};