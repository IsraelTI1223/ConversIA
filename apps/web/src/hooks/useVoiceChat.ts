'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { TtsQueue, extractSentences } from '@/lib/tts-queue';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000';

export type VoiceTurn = 'idle' | 'listening' | 'processing' | 'speaking';

export interface VoiceTranscriptEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  correctionEn?: string | null;
  isCorrect?: boolean;
  vocabulary?: Array<{
    wordEn: string;
    wordEs: string;
    phonetic?: string;
    exampleEn?: string;
    exampleEs?: string;
  }>;
}

export interface VoiceSummary {
  totalTurns: number;
  corrections: Array<{ original: string; correction: string | null }>;
  vocabulary: Array<{
    wordEn: string;
    wordEs: string;
    phonetic?: string;
    exampleEn?: string;
    exampleEs?: string;
  }>;
}

export function useVoiceChat(sessionId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const ttsRef = useRef<TtsQueue | null>(null);
  const streamBufferRef = useRef('');

  const [turn, setTurn] = useState<VoiceTurn>('idle');
  const turnRef = useRef<VoiceTurn>('idle');
  const [transcript, setTranscript] = useState<VoiceTranscriptEntry[]>([]);
  const [currentAiText, setCurrentAiText] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [summary, setSummary] = useState<VoiceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      setError('No authentication token found');
      return;
    }

    const tts = new TtsQueue((speaking) => {
      if (!speaking) {
        turnRef.current = 'listening';
        setTurn('listening');
      }
    });
    ttsRef.current = tts;

    const socket = io(`${WS_URL}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      socket.emit('join_session', { sessionId });
      socket.emit('voice_start_session', { sessionId });
    });

    socket.on('voice_turn_ready', (data: { expiresAt: number }) => {
      setExpiresAt(data.expiresAt);
      if (turnRef.current !== 'speaking') {
        turnRef.current = 'listening';
        setTurn('listening');
      }
    });

    socket.on('voice_chunk', (data: { text: string; index: number }) => {
      turnRef.current = 'speaking';
      setTurn('speaking');
      setCurrentAiText((prev) => prev + data.text);

      streamBufferRef.current += data.text;
      const { sentences, remaining } = extractSentences(streamBufferRef.current);
      streamBufferRef.current = remaining;
      sentences.forEach((s) => tts.enqueue(s));
    });

    socket.on('voice_chunk_end', (data: {
      fullText: string;
      metadata: {
        isCorrect: boolean;
        correctionEn: string | null;
        vocabulary: Array<{
          wordEn: string;
          wordEs: string;
          phonetic?: string;
          exampleEn?: string;
          exampleEs?: string;
        }>;
      };
    }) => {
      if (streamBufferRef.current.trim()) {
        tts.enqueue(streamBufferRef.current);
        streamBufferRef.current = '';
      }

      setTranscript((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: data.fullText,
          correctionEn: data.metadata.correctionEn,
          isCorrect: data.metadata.isCorrect,
          vocabulary: data.metadata.vocabulary,
        },
      ]);
      setCurrentAiText('');
    });

    socket.on('voice_session_expired', (data: { summary: VoiceSummary }) => {
      tts.cancel();
      setSummary(data.summary);
      turnRef.current = 'idle';
      setTurn('idle');
    });

    socket.on('voice_error', (data: { message: string; code: string }) => {
      setError(data.message);
      if (data.code === 'EXPIRED') {
        turnRef.current = 'idle';
        setTurn('idle');
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      tts.cancel();
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      setError('Connection failed. Check your network.');
    });

    return () => {
      tts.cancel();
      socket.disconnect();
      socketRef.current = null;
      ttsRef.current = null;
    };
  }, [sessionId]);

  const sendTranscript = useCallback(
    (text: string) => {
      if (!socketRef.current || !sessionId || !text.trim()) return;

      setTranscript((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          text: text.trim(),
        },
      ]);
      turnRef.current = 'processing';
      setTurn('processing');
      setCurrentAiText('');
      streamBufferRef.current = '';
      setError(null);

      socketRef.current.emit('voice_message', {
        sessionId,
        transcript: text.trim(),
      });
    },
    [sessionId],
  );

  const endSession = useCallback(() => {
    if (!socketRef.current || !sessionId) return;
    ttsRef.current?.cancel();
    socketRef.current.emit('voice_end_session', { sessionId });
  }, [sessionId]);

  return {
    turn,
    transcript,
    currentAiText,
    expiresAt,
    summary,
    error,
    isConnected,
    sendTranscript,
    endSession,
  };
}
