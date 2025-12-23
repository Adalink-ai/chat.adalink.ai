import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/utils';
import { toast } from '@/components/toast';

export interface Connector {
  id: string;
  name: string;
  slug: string;
  provider: string;
  iconUrl: string;
  description: string | null;
  isActive: boolean;
  isConnected: boolean;
  connectionId?: string;
  connectedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface UserConnection {
  id: string;
  connectorId: string;
  connectorName: string;
  connectorSlug: string;
  connectorIconUrl: string;
  connectedAt: Date;
  updatedAt: Date;
  scopes: string[] | null;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
  expiresAt: Date | null;
}

/**
 * Custom hook for managing connectors
 */
export function useConnectors() {
  const {
    data: connectorsData,
    error: connectorsError,
    isLoading: connectorsLoading,
  } = useSWR<{ connectors: Connector[] }>('/api/connectors/list', fetcher);

  const {
    data: connectionsData,
    error: connectionsError,
    isLoading: connectionsLoading,
  } = useSWR<{ connections: UserConnection[] }>(
    '/api/connectors/user-connections',
    fetcher,
  );

  /**
   * Initiate connection to a service
   */
  const connectService = async (slug: string) => {
    try {
      // Request authorization URL
      const response = await fetch(`/api/connectors/connect/${slug}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect');
      }

      const { authUrl } = await response.json();

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'oauth',
        `width=${width},height=${height},left=${left},top=${top}`,
      );

      if (!popup) {
        toast({
          type: 'error',
          description:
            'Popup bloqueado. Por favor, permita popups para este site.',
        });
        return;
      }

      // Poll for popup closure or URL change
      const pollInterval = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(pollInterval);
            // Refresh data after auth
            mutate('/api/connectors/list');
            mutate('/api/connectors/user-connections');
          }
        } catch (e) {
          // Cross-origin error when popup navigates to OAuth provider
          // This is expected
        }
      }, 500);

      // Cleanup after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (!popup.closed) {
          popup.close();
        }
      }, 600000);
    } catch (error) {
      console.error('Failed to connect service:', error);
      toast({
        type: 'error',
        description:
          error instanceof Error ? error.message : 'Falha ao conectar serviço',
      });
    }
  };

  /**
   * Disconnect from a service
   */
  const disconnectService = async (connectionId: string) => {
    try {
      const response = await fetch(
        `/api/connectors/disconnect/${connectionId}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disconnect');
      }

      toast({
        type: 'success',
        description: 'Serviço desconectado com sucesso',
      });

      // Refresh data
      mutate('/api/connectors/list');
      mutate('/api/connectors/user-connections');
    } catch (error) {
      console.error('Failed to disconnect service:', error);
      toast({
        type: 'error',
        description:
          error instanceof Error
            ? error.message
            : 'Falha ao desconectar serviço',
      });
    }
  };

  return {
    connectors: connectorsData?.connectors || [],
    connections: connectionsData?.connections || [],
    isLoading: connectorsLoading || connectionsLoading,
    error: connectorsError || connectionsError,
    connectService,
    disconnectService,
  };
}
