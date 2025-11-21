'use client';

import type { Connector } from '@/hooks/use-connectors';
import { CheckCircleFillIcon } from './icons';

interface ConnectorCardProps {
  connector: Connector;
  onConnect: (slug: string) => void;
  onDisconnect: (connectionId: string) => void;
}

export function ConnectorCard({
  connector,
  onConnect,
  onDisconnect,
}: ConnectorCardProps) {
  const isEnabled = connector.isActive;
  const isConnected = connector.isConnected;

  const handleClick = () => {
    if (!isEnabled) return;

    if (isConnected && connector.connectionId) {
      onDisconnect(connector.connectionId);
    } else {
      onConnect(connector.slug);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isEnabled}
      className={`
        group relative flex flex-col items-center gap-3 p-4 rounded-lg border transition-all
        ${
          isEnabled
            ? 'hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer'
            : 'opacity-50 cursor-not-allowed'
        }
        ${
          isConnected
            ? 'border-[#8F5BFF] bg-[#8F5BFF]/5 dark:bg-[#8F5BFF]/10'
            : 'border-zinc-200 dark:border-zinc-800'
        }
      `}
    >
      {/* Icon */}
      <div className="relative">
        <img
          src={connector.iconUrl}
          alt={`${connector.name} icon`}
          className="size-12 object-contain"
        />

        {isConnected && (
          <div className="absolute -top-1 -right-1 size-5 bg-[#8F5BFF] rounded-full flex items-center justify-center">
            <CheckCircleFillIcon className="size-3 text-white" />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="text-center">
        <div className="text-sm font-medium text-zinc-900 dark:text-white">
          {connector.name}
        </div>

        {isConnected && (
          <div className="text-xs text-[#8F5BFF] mt-1">Conectado</div>
        )}

        {!isEnabled && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Em breve
          </div>
        )}
      </div>

      {/* Description tooltip on hover */}
      {connector.description && isEnabled && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {connector.description}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100" />
        </div>
      )}
    </button>
  );
}
