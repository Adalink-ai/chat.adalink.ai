'use client';

import { Button } from './ui/button';
import { ArrowUpIcon, LoaderIcon } from './icons';

interface SendButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function SendButton({
  onClick,
  disabled = false,
  isLoading = false,
}: SendButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed p-0 transition-colors duration-200"
      style={{
        backgroundColor: isDisabled ? undefined : '#B800C9',
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = '#9300A1';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = '#B800C9';
        }
      }}
      title={isLoading ? 'Enviando...' : 'Enviar mensagem'}
    >
      {isLoading ? (
        <div className="animate-spin">
          <LoaderIcon size={18} />
        </div>
      ) : (
        <ArrowUpIcon size={18} />
      )}
    </Button>
  );
}
