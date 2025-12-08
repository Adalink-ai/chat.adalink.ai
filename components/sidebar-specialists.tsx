'use client';

import { useSpecialists } from '@/hooks/use-specialists';
import { Bot, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAssetUrl } from '@/lib/utils/asset-url';

interface SidebarSpecialistsProps {
  onSpecialistClick?: (specialist: any) => void;
}

export function SidebarSpecialists({ onSpecialistClick }: SidebarSpecialistsProps) {
  const { specialists, loading, error } = useSpecialists();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-[#8F5BFF]" />
      </div>
    );
  }

  if (error) {
    const isTokenError = error.includes('Token de acesso não encontrado');
    
    return (
      <div className="text-center py-8 px-4">
        <div className="mb-4">
          <Bot className="size-12 mx-auto mb-3 text-red-400 dark:text-red-500" />
        </div>
        <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
          {isTokenError ? 'Autenticação necessária' : 'Erro ao carregar agentes'}
        </p>
        <p className="text-xs text-zinc-500 dark:text-white/60 mb-4">
          {error}
        </p>
        {isTokenError && (
          <div className="text-xs text-zinc-400 dark:text-white/40 space-y-2">
            <p className="font-medium">Para resolver:</p>
            <ol className="list-decimal list-inside text-left space-y-1">
              <li>Faça logout</li>
              <li>Faça login novamente via SSO</li>
              <li>Certifique-se que o front-adalink está enviando o accessToken</li>
            </ol>
          </div>
        )}
      </div>
    );
  }

  if (specialists.length === 0) {
    return (
      <div className="text-center py-8">
        <Bot className="size-12 mx-auto mb-3 text-zinc-400 dark:text-white/40" />
        <p className="text-sm text-zinc-500 dark:text-white/60">
          Nenhum agente disponível
        </p>
      </div>
    );
  }

  const handleSpecialistClick = (specialist: any) => {
    // Abrir em nova aba o chat do assistente no front-adalink
    // Front-adalink roda na porta 3000
    const frontAdalinkUrl = process.env.NEXT_PUBLIC_FRONT_ADALINK_URL || 'http://localhost:3000';
    
    // Usar o slug para construir a URL do chat: /pt/chatbot-v2/{slug}
    if (!specialist.slug) {
      console.warn('[Specialists] Assistente sem slug, não é possível abrir o chat:', specialist.id);
      return;
    }
    
    const chatUrl = `${frontAdalinkUrl}/pt/chatbot-v2/${specialist.slug}`;
    console.log('[Specialists] Abrindo chat:', chatUrl);
    window.open(chatUrl, '_blank');
    
    if (onSpecialistClick) {
      onSpecialistClick(specialist);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-zinc-500 dark:text-white/60 mb-4">
        Agentes disponíveis ({specialists.length})
      </p>
      
      {specialists.map((specialist) => (
        <button
          key={specialist.id}
          onClick={() => handleSpecialistClick(specialist)}
          className="w-full text-left px-3 py-3 rounded-lg bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all duration-200 group border border-transparent hover:border-[#8F5BFF]/30"
        >
          <div className="flex items-start gap-3">
            {/* Avatar ou ícone */}
            <div className="size-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#8F5BFF] to-[#A970FF]">
              {specialist.avatar ? (
                <img 
                  src={getAssetUrl(specialist.avatar) || specialist.avatar} 
                  alt={specialist.name}
                  className="size-10 rounded-full object-cover"
                  onError={(e) => {
                    // Se a imagem falhar ao carregar, mostrar avatar padrão com iniciais
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const initials = specialist.name
                        ?.split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || '?';
                      parent.innerHTML = `<span class="text-sm font-semibold text-white">${initials}</span>`;
                    }
                  }}
                />
              ) : (
                // Avatar padrão com iniciais do nome em gradiente
                <span className="text-sm font-semibold text-white">
                  {specialist.name
                    ?.split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || '?'}
                </span>
              )}
            </div>

            {/* Informações */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                  {specialist.name}
                </h3>
                <ExternalLink className="size-3 text-zinc-400 dark:text-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
              
              {specialist.description && (
                <p className="text-xs text-zinc-500 dark:text-white/60 line-clamp-2">
                  {specialist.description}
                </p>
              )}
              
              {specialist.category && (
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-[#8F5BFF]/10 text-[#8F5BFF]">
                  {specialist.category}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
