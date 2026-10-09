'use client';

import { useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string }; isFinal: boolean }; length: number };
  resultIndex: number;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function VoiceMic({
  active,
  onFinalTranscript,
  onInterimTranscript,
  lang = 'en-US',
}: {
  active: boolean;
  onFinalTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  lang?: string;
}) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  const startRecognition = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + result[0].transcript.trim();
        } else {
          interim += result[0].transcript;
        }
      }
      onInterimTranscript?.(interim);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (finalTranscript.trim()) {
        onFinalTranscript(finalTranscript.trim());
      }
      if (activeRef.current) {
        startRecognition();
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' && activeRef.current) {
        return;
      }
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang, onFinalTranscript, onInterimTranscript]);

  useEffect(() => {
    if (active) {
      startRecognition();
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, [active, startRecognition]);

  return null;
}
