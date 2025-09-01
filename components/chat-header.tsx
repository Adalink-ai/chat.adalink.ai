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
            className="size-8 rounded-lg flex items-center justify-center bg-purple-100"
            style={{
              backgroundColor: 'rgba(184, 0, 201, 0.1)',
              color: '#B800C9',
            }}
          >
            <MessageIcon size={16} />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">
              {conversationTitle || 'Nova Conversa'}
            </h2>
            <p className="text-sm text-purple-custom-500">Online agora</p>
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
