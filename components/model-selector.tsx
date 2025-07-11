'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';

import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';
import type { Session } from 'next-auth';
import useSWR from 'swr';
import type { ChatModel } from '@/lib/ai/models';

export function ModelSelector({
  session,
  selectedModelId,
  className,
}: {
  session: Session;
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);

  const { data: models } = useSWR<ChatModel[]>(
    'https://ai-gateway.vercel.sh/v1/models',
    (url) =>
      fetch(url).then(async (response) => {
        const { data } = await response.json();
        return data;
      }),
    {
      fallbackData: [],
    },
  );

  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  const userType = session.user.type;

  const selectedChatModel = useMemo(
    () => models?.find((chatModel) => chatModel.id === optimisticModelId),
    [optimisticModelId, models],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          data-testid="model-selector"
          variant="outline"
          className="md:px-2 md:h-[34px]"
        >
          {selectedChatModel?.name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-96 h-52 overflow-y-scroll"
      >
        {models?.map((chatModel) => {
          const { id } = chatModel;

          return (
            <DropdownMenuItem
              data-testid={`model-selector-item-${id}`}
              key={id}
              onSelect={() => {
                setOpen(false);

                startTransition(() => {
                  setOptimisticModelId(id);
                  saveChatModelAsCookie(id);
                });
              }}
              data-active={id === optimisticModelId}
              asChild
            >
              <button
                type="button"
                className="gap-4 group/item flex flex-row justify-between items-center w-full"
              >
                <div className="flex flex-col gap-1 items-start">
                  <div>{chatModel.id}</div>
                  {/* <div className="text-xs text-muted-foreground text-left">
                    {chatModel.description}
                  </div> */}
                </div>

                <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                  <CheckCircleFillIcon />
                </div>
              </button>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
