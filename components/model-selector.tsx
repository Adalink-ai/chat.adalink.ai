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

import useSWR from 'swr';
import type { ChatModel } from '@/lib/ai/models';

export function ModelSelector({
  selectedModelId,
  className,
}: {
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

  const { data: filterConfig } = useSWR<{
    allowedProviders: string[];
    allowedModels: string[];
    allowAllProviders: boolean;
    allowAllModels: boolean;
  }>(
    '/api/providers',
    (url) => fetch(url).then((response) => response.json()),
    {
      fallbackData: {
        allowedProviders: [],
        allowedModels: [],
        allowAllProviders: true,
        allowAllModels: true,
      },
    },
  );

  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  // Filter models based on allowed providers and models
  const filteredModels = useMemo(() => {
    if (!models || !filterConfig) return [];

    let filtered = models;

    // First filter by specific models if configured
    if (!filterConfig.allowAllModels) {
      const allowedModels = filterConfig.allowedModels;
      filtered = filtered.filter((model) => {
        return allowedModels.includes(model.id.toLowerCase());
      });
    }

    // Then filter by providers if configured
    if (!filterConfig.allowAllProviders) {
      const allowedProviders = filterConfig.allowedProviders;
      filtered = filtered.filter((model) => {
        // Extract provider from model ID (format: "provider/model-name" or "provider-model-name")
        const modelIdLower = model.id.toLowerCase();
        const provider = modelIdLower.includes('/')
          ? modelIdLower.split('/')[0]
          : modelIdLower.split('-')[0];

        return allowedProviders.includes(provider);
      });
    }

    return filtered;
  }, [models, filterConfig]);

  const selectedChatModel = useMemo(() => {
    // First try to find the optimistic model ID in filtered models
    let selected = filteredModels?.find(
      (chatModel) => chatModel.id === optimisticModelId,
    );

    // If not found or no model selected, use the first model from filtered list
    if (!selected && filteredModels && filteredModels.length > 0) {
      selected = filteredModels[0];
    }

    return selected;
  }, [optimisticModelId, filteredModels]);

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
        align="end"
        sideOffset={8}
        alignOffset={-16}
        className="w-96 h-52 overflow-y-scroll"
      >
        {filteredModels?.map((chatModel) => {
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
                className="gap-4 group/item flex flex-row justify-between items-center w-full hover:bg-purple-custom-50"
              >
                <div className="flex flex-col gap-1 items-start">
                  <div>{chatModel.id}</div>
                  {/* <div className="text-xs text-muted-foreground text-left">
                    {chatModel.description}
                  </div> */}
                </div>

                <div className="text-purple-custom-500 opacity-0 group-data-[active=true]/item:opacity-100">
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
