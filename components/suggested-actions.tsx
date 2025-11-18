'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import { Sparkles, Plane, Lightbulb, TrendingUp } from 'lucide-react';

interface SuggestedActionsProps {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
}

function PureSuggestedActions({
  chatId,
  sendMessage,
}: SuggestedActionsProps) {
  const suggestedActions = [
    {
      icon: Sparkles,
      label: 'Comparar',
      action: 'Compare diferentes opções para mim',
    },
    {
      icon: Lightbulb,
      label: 'Perplexidade 101',
      action: 'O que é perplexidade em IA?',
    },
    {
      icon: TrendingUp,
      label: 'Verificação de Fatos',
      action: 'Verifique os fatos sobre este tópico',
    },
    {
      icon: Plane,
      label: 'Resumir',
      action: 'Resuma este conteúdo de forma clara',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      data-testid="suggested-actions"
      className="hidden md:flex flex-wrap items-center justify-center gap-2 w-full max-w-3xl mx-auto"
    >
      {suggestedActions.map((suggestedAction, index) => {
        const Icon = suggestedAction.icon;
        return (
          <Button
            key={`suggested-action-${index}`}
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              sendMessage({
                role: 'user',
                parts: [{ type: 'text', text: suggestedAction.action }],
              });
            }}
            className="
              group
              inline-flex items-center gap-2
              px-4 py-2
              rounded-full
              border
              backdrop-blur-sm
              text-sm font-light tracking-wide
              transition-all duration-200
              border-zinc-200 dark:border-white/10
              bg-white dark:bg-[#0A0A0A]
              text-zinc-600 dark:text-white/70
              hover:border-[#8F5BFF]/50 dark:hover:border-[#8F5BFF]/50
              hover:bg-[#8F5BFF]/5 dark:hover:bg-[#8F5BFF]/10
              hover:text-[#8F5BFF] dark:hover:text-white
              hover:shadow-lg hover:shadow-[#8F5BFF]/20
            "
          >
            <Icon className="size-4 text-zinc-400 dark:text-white/50 group-hover:text-[#8F5BFF] transition-colors" />
            <span>{suggestedAction.label}</span>
          </Button>
        );
      })}
    </motion.div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;

    return true;
  },
);
