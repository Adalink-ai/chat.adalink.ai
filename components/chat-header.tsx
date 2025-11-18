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
    <div className="border-b border-border px-4 md:px-6 py-3 md:py-4 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="size-10 md:size-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(143, 91, 255, 0.15)',
                color: '#8F5BFF',
              }}
            >
              <MessageIcon size={18} />
            </div>
            {/* Indicador online - apenas bolinha verde */}
            <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
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
