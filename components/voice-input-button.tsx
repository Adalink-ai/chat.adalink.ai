'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useVoiceRecognition } from '@/hooks/use-voice-recognition';
import { toast } from 'sonner';
import type { Dispatch, SetStateAction } from 'react';

interface VoiceInputButtonProps {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: string;
  adjustHeight: () => void;
}

export function VoiceInputButton({
  input,
  setInput,
  status,
  adjustHeight,
}: VoiceInputButtonProps) {
  const [interimTranscript, setInterimTranscript] = useState('');

  const {
    isListening,
    isSupported: isVoiceSupported,
    toggleListening,
  } = useVoiceRecognition({
    onTranscriptChange: (transcript, isFinal) => {
      if (isFinal) {
        setInput((prevInput) => {
          const newInput =
            prevInput.trim() +
            (prevInput.trim() ? ' ' : '') +
            transcript.trim();
          return newInput;
        });
        setInterimTranscript('');
        setTimeout(adjustHeight, 0);
      } else {
        setInterimTranscript(transcript);
      }
    },
    onError: (error) => {
      console.error('Voice recognition error:', error);
      toast.error(`Erro na gravação de voz: ${error}`);
      setInterimTranscript('');
    },
  });

  if (!isVoiceSupported) return null;

  return (
    <>
      {isListening && (
        <div className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-2 text-red-500 text-xs">
          <div className="size-2 bg-red-500 rounded-full animate-pulse" />
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleListening}
        disabled={status !== 'ready'}
        className="absolute right-3 top-1/2 -translate-y-1/2 size-8 text-zinc-500 dark:text-white/50 hover:text-[#8F5BFF] hover:bg-transparent p-0"
        title="Gravar áudio"
      >
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </Button>
    </>
  );
}

