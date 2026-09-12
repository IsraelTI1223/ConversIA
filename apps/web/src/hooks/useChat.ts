'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  contentEn: string;
  contentEs: string;
  correctionEn?: string | null;
  isCorrect?: boolean;
  vocabulary?: VocabWord[];
  timestamp: number;
}

export interface VocabWord {
  wordEn: string;
  wordEs: string;
  phonetic?: string;
  exampleEn?: string;
  exampleEs?: string;
  partOfSpeech?: string;
}

export function useChat(sessionId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      setError('No authentication token found');
      return;
    }

    const socket = io(`${WS_URL}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      socket.emit('join_session', { sessionId });
    });

    socket.on('session_joined', () => {});

    socket.on('typing_start', () => setIsTyping(true));
    socket.on('typing_stop', () => setIsTyping(false));

    socket.on('new_message', (data: {
      contentEn: string;
      contentEs: string;
      correctionEn?: string;
      isCorrect: boolean;
      vocabulary?: VocabWord[];
    }) => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          contentEn: data.contentEn,
          contentEs: data.contentEs,
          correctionEn: data.correctionEn,
          isCorrect: data.isCorrect,
          vocabulary: data.vocabulary,
          timestamp: Date.now(),
        },
      ]);
    });

    socket.on('error', (data: { message: string }) => {
      setIsTyping(false);
      setError(data.message);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      setError('Connection failed. Check your network.');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId]);

  const sendMessage = useCallback(
    (content: string, language: 'en' | 'es') => {
      if (!socketRef.current || !sessionId || !content.trim()) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        contentEn: language === 'en' ? content : '',
        contentEs: language === 'es' ? content : '',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setError(null);

      socketRef.current.emit('send_message', {
        sessionId,
        content: content.trim(),
        language,
      });
    },
    [sessionId],
  );

  return { messages, isTyping, isConnected, error, sendMessage };
}
