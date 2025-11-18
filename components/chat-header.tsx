'use client';

import { ModelSelector } from '@/components/model-selector';
import { MessageIcon } from './icons';
import { memo } from 'react';

function PureChatHeader({
  selectedModelId,
  isReadonly,
  conversationTitle,
}: {
  selectedModelId: string;
  isReadonly: boolean;
  conversationTitle?: string;
}) {
  return (
    <div className="border-b border-border px-6 py-4 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="size-8 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(143, 91, 255, 0.15)',
              color: '#8F5BFF',
            }}
          >
            <MessageIcon size={16} />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">
              {conversationTitle || 'Nova Conversa'}
            </h2>
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-sm text-[#8F5BFF]">Online</p>
            </div>
          </div>
        </div>

        {!isReadonly && <ModelSelector selectedModelId={selectedModelId} />}
      </div>
    </div>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});
