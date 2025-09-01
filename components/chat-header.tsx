'use client';

import { ModelSelector } from '@/components/model-selector';
import { MessageIcon } from './icons';
import { memo } from 'react';
import type { Session } from 'next-auth';

function PureChatHeader({
  selectedModelId,
  isReadonly,
  session,
  conversationTitle,
}: {
  selectedModelId: string;
  isReadonly: boolean;
  session: Session;
  conversationTitle?: string;
}) {
  return (
    <div className="border-b border-gray-200 px-6 py-4 bg-white">
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
            <h2 className="font-semibold text-gray-900">
              {conversationTitle || 'Nova Conversa'}
            </h2>
            <p className="text-sm" style={{ color: '#B800C9' }}>
              Online agora
            </p>
          </div>
        </div>

        {!isReadonly && (
          <ModelSelector session={session} selectedModelId={selectedModelId} />
        )}
      </div>
    </div>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});
