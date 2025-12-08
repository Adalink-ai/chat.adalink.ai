import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

export interface Specialist {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  avatar?: string;
  category?: string;
  isActive?: boolean;
}

// Cache global para evitar recarregar os dados
let cachedSpecialists: Specialist[] | null = null;
let cacheTimestamp: number = 0;
let isFetching: boolean = false;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useSpecialists() {
  const { data: session } = useSession();
  const [specialists, setSpecialists] = useState<Specialist[]>(cachedSpecialists || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpecialists = async () => {
      if (!session?.user) {
        return;
      }

      // Se já temos dados em cache e ainda são válidos, usar o cache
      const now = Date.now();
      if (cachedSpecialists && (now - cacheTimestamp) < CACHE_DURATION) {
        setSpecialists(cachedSpecialists);
        return;
      }

      // Se já está buscando, não buscar novamente
      if (isFetching) {
        return;
      }

      isFetching = true;
      setLoading(true);
      setError(null);

      try {
        // Buscar diretamente da API do backend (mesma usada no front-adalink)
        // Usar NEXT_PUBLIC_API_BASE_URL_V1 (padrão do front-adalink) ou NEXT_PUBLIC_API_URL como fallback
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL_V1 || process.env.NEXT_PUBLIC_API_URL || 'https://api-dev.adalink.ai/api';
        
        // Obter access token e organizationId da sessão
        const accessToken = (session as any).accessToken;
        const organizationId = (session as any).user?.organizationId || (session as any).organizationId;
        
        console.log('[Specialists] Sessão completa:', session);
        console.log('[Specialists] AccessToken:', accessToken);
        console.log('[Specialists] OrganizationId:', organizationId);
        console.log('[Specialists] API Base URL:', apiBaseUrl);
        
        if (!accessToken) {
          console.error('[Specialists] Token não encontrado na sessão');
          throw new Error('Token de acesso não encontrado na sessão. Faça login novamente via SSO.');
        }

        // Construir headers (mesmo padrão do front-adalink)
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        };

        if (organizationId) {
          headers['x-organization-id'] = organizationId;
        }

        // Usar o endpoint correto: /v1/assistants (não /specialists)
        const response = await fetch(`${apiBaseUrl}/v1/assistants?limit=100&offset=0`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          console.error('[Specialists] Erro na API:', response.status, errorText);
          throw new Error(`Falha ao buscar agentes: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // A API retorna um array ou um objeto com data
        const assistants = Array.isArray(data) ? data : (data?.data || data?.assistants || []);
        
        // Mapear os dados da API para o formato esperado pelo componente
        const mappedSpecialists = assistants.map((assistant: any) => ({
          id: assistant.id,
          slug: assistant.slug || undefined,
          name: assistant.title || assistant.name || 'Sem nome',
          description: assistant.description || undefined,
          avatar: assistant.image || assistant.avatar || undefined,
          category: assistant.tags?.[0]?.name || assistant.category || undefined,
          isActive: assistant.isActive !== false, // Assume ativo se não especificado
        }));
        
        console.log('[Specialists] Assistantes mapeados:', mappedSpecialists.length);
        
        // Atualizar cache
        cachedSpecialists = mappedSpecialists;
        cacheTimestamp = Date.now();
        
        setSpecialists(mappedSpecialists);
      } catch (err) {
        console.error('[Specialists] Erro ao buscar:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
        isFetching = false;
      }
    };

    fetchSpecialists();
  }, [session]);

  return { specialists, loading, error };
}
