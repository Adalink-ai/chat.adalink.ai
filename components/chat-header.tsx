'use client';

import { ModelSelector } from '@/components/model-selector';
import { memo } from 'react';
import type { Session } from 'next-auth';

function PureChatHeader({
  selectedModelId,
  isReadonly,
  session,
}: {
  selectedModelId: string;
  isReadonly: boolean;
  session: Session;
}) {
  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      {!isReadonly && (
        <ModelSelector session={session} selectedModelId={selectedModelId} />
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});
