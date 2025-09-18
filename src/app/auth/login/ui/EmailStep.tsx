'use client'

import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EmailStepProps {
  email: string
  onChange: (value: string) => void
  onContinue?: () => void
  disabled?: boolean
}

export function EmailStep({
  email,
  onChange,
  onContinue,
  disabled,
}: EmailStepProps) {
  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex flex-col w-full gap-2">
        <Label className="text-gray-700 text-start">
          Email
        </Label>
        <Input
          required
          autoComplete="off"
          className="placeholder:text-gray-400"
          placeholder="Digite seu email"
          value={email}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <Button
        variant="default"
        size="lg"
        type="button"
        onClick={() => onContinue?.()}
        className="rounded-full bg-primary-600 cursor-pointer hover:bg-primary-700"
        disabled={disabled || !email}
      >
        {disabled ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando...
          </span>
        ) : (
          'Continuar'
        )}
      </Button>
    </div>
  )
}