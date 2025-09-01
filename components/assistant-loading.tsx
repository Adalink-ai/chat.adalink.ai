'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

/**
 * Componente de loading com animações sofisticadas para o assistente
 * Exibe um logo centralizado com animação, círculo de loading com efeito de recolhimento
 * e texto com efeito de digitação
 */
export const AssistantLoadingCard = () => {
  const [displayText, setDisplayText] = useState('');
  const fullText = 'Só um segundo...';

  useEffect(() => {
    let index = 0;
    let timeout: NodeJS.Timeout;

    const animateText = () => {
      // Digita o texto gradualmente
      if (index <= fullText.length) {
        setDisplayText(fullText.substring(0, index));
        index++;
        timeout = setTimeout(animateText, 70); // Velocidade de digitação
      } else {
        // Reinicia após um delay
        timeout = setTimeout(() => {
          index = 0;
          setDisplayText('Pensando...');
          timeout = setTimeout(animateText, 500); // Pequena pausa antes de recomeçar
        }, 800);
      }
    };

    // Inicia a animação imediatamente
    animateText();

    // Limpa o timeout ao desmontar
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex flex-col p-4 animate-fadeIn">
      <div className="flex items-center gap-4">
        {/* Spinner + Logo */}
        <div className="relative w-14 h-14">
          {/* Círculo de fundo */}
          <div className="absolute inset-0 rounded-full flex items-center justify-center">
            {/* Logo centralizado com animação */}
            <Image
              src="/images/logo-adalink.svg"
              alt="Adalink Logo"
              width={24}
              height={24}
              priority
              className="z-10 animate-logoSpin"
            />
          </div>

          {/* LoaderCircle animado */}
          <div className="absolute inset-0 w-full h-full">
            <svg
              className="w-full h-full animate-spin"
              viewBox="0 0 50 50"
              style={{ animationDuration: '0.4s' }}
            >
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="transparent"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animate-colorChange animate-dashAnimation"
                stroke="currentColor"
              />
            </svg>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center">
            <span className="text-xs text-gray-500">{displayText}</span>
            <span className="ml-1 w-1 h-4 bg-purple-600 animate-blink" />
          </div>
        </div>
      </div>
    </div>
  );
};
