import type { Chat } from '@/lib/db/schema';
import {
  MessageCircle,
  Trash2,
  MoreHorizontal,
  Share,
  Globe,
  Lock,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { memo } from 'react';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibilityType: chat.visibility,
  });

  const formatTimestamp = (date: Date) => {
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: ptBR,
    }).replace('cerca de ', '');
  };

  return (
    <div className="mb-1">
      <Link
        href={`/chat/${chat.id}`}
        onClick={() => setOpenMobile(false)}
        className="block"
        title={chat.title}
      >
        {/* Layout expandido */}
        <div
          className={`p-3 rounded-lg cursor-pointer transition-colors group relative group-data-[collapsible=icon]:hidden ${
            isActive
              ? 'bg-purple-custom-50 border-l-4 border-purple-custom-600'
              : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="size-8 bg-purple-custom-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <MessageCircle className="size-4 text-purple-custom-600" />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-sm leading-tight line-clamp-1 text-gray-900">
                  {chat.title}
                </h3>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(new Date(chat.createdAt))}
                  </span>
                  <DropdownMenu modal={true}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 size-6 text-gray-400 hover:text-gray-600"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MoreHorizontal className="size-3" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent side="bottom" align="end">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="cursor-pointer">
                          <Share className="size-4" />
                          <span>Share</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem
                              className="cursor-pointer flex-row justify-between"
                              onClick={() => {
                                setVisibilityType('private');
                              }}
                            >
                              <div className="flex flex-row gap-2 items-center">
                                <Lock className="size-3" />
                                <span>Private</span>
                              </div>
                              {visibilityType === 'private' ? (
                                <CheckCircle />
                              ) : null}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer flex-row justify-between"
                              onClick={() => {
                                setVisibilityType('public');
                              }}
                            >
                              <div className="flex flex-row gap-2 items-center">
                                <Globe className="size-3" />
                                <span>Public</span>
                              </div>
                              {visibilityType === 'public' ? (
                                <CheckCircle />
                              ) : null}
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
                        onSelect={() => onDelete(chat.id)}
                      >
                        <Trash2 className="size-4" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <p className="text-xs mt-1 leading-relaxed line-clamp-2 break-words text-gray-600">
                Conversa iniciada
              </p>
            </div>
          </div>
        </div>

        {/* Layout colapsado - balão com ícone centralizado */}
        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mb-1">
          <div
            className={`size-10 rounded-lg flex items-center justify-center transition-colors ${
              isActive
                ? 'bg-purple-custom-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MessageCircle className="size-5" />
          </div>
        </div>
      </Link>
    </div>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  return true;
});
