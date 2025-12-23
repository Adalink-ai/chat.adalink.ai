'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from './ui/alert-dialog';
import { ConnectorCard } from './connector-card';
import { useConnectors } from '@/hooks/use-connectors';
import { LoaderIcon, CrossIcon } from './icons';
import { Button } from './ui/button';

interface ConnectorsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectorsModal({ open, onOpenChange }: ConnectorsModalProps) {
  const { connectors, isLoading, connectService, disconnectService } =
    useConnectors();

  const handleConnect = async (slug: string) => {
    await connectService(slug);
  };

  const handleDisconnect = async (connectionId: string) => {
    await disconnectService(connectionId);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-zinc-100 data-[state=open]:text-zinc-500 dark:ring-offset-zinc-950 dark:focus:ring-zinc-300 dark:data-[state=open]:bg-zinc-800 dark:data-[state=open]:text-zinc-400"
        >
          <CrossIcon className="size-4" />
          <span className="sr-only">Fechar</span>
        </button>

        <AlertDialogHeader>
          <AlertDialogTitle>Conectores</AlertDialogTitle>
          <AlertDialogDescription>
            O ChatGPT pode acessar informações das ferramentas conectadas para
            oferecer respostas mais úteis. Suas permissões sempre serão
            respeitadas.{' '}
            <a
              href="#"
              className="text-[#8F5BFF] hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Link to documentation
              }}
            >
              Saiba mais
            </a>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoaderIcon className="size-8 animate-spin text-zinc-400" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {connectors.map((connector) => (
              <ConnectorCard
                key={connector.id}
                connector={connector}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            ))}
          </div>
        )}

        {connectors.length === 0 && !isLoading && (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
            Nenhum conector disponível no momento.
          </div>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
