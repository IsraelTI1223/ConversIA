import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  contentEn: string;
  contentEs: string;
  correctionEn?: string;
  isCorrect?: boolean;
  vocabulary?: Array<{
    wordEn: string;
    wordEs: string;
    phonetic?: string;
    exampleEn?: string;
    exampleEs?: string;
  }>;
}

interface ChatState {
  sessionId: string | null;
  messages: ChatMessage[];
  isTyping: boolean;
  socket: Socket | null;
  connect: (sessionId: string) => void;
  sendMessage: (content: string, language: 'en' | 'es', userId: string) => void;
  disconnect: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessionId: null,
  messages: [],
  isTyping: false,
  socket: null,

  connect: (sessionId) => {
    const socket = io(`${WS_URL}/chat`, { transports: ['websocket'] });

    socket.on('connect', () => {
      socket.emit('join_session', { sessionId });
    });

    socket.on('typing_start', () => set({ isTyping: true }));
    socket.on('typing_stop', () => set({ isTyping: false }));

    socket.on('new_message', (msg: ChatMessage) => {
      set((s) => ({ messages: [...s.messages, { ...msg, role: 'assistant' }] }));
    });

    set({ socket, sessionId, messages: [] });
  },

  sendMessage: (content, language, userId) => {
    const { socket, sessionId } = get();
    if (!socket || !sessionId) return;

    const userMsg: ChatMessage = {
      role: 'user',
      contentEn: language === 'en' ? content : '',
      contentEs: language === 'es' ? content : '',
    };
    set((s) => ({ messages: [...s.messages, userMsg] }));

    socket.emit('send_message', { sessionId, userId, content, language });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, sessionId: null, messages: [], isTyping: false });
  },
}));
