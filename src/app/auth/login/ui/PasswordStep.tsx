'use client'

import { useState } from 'react'

import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PasswordStepProps {
  password: string
  onChange: (value: string) => void
  onLogin: () => Promise<void>
  isLoading: boolean
  onBack: () => void
}

export function PasswordStep({
  password,
  onChange,
  isLoading,
  onBack,
}: PasswordStepProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex flex-col w-full gap-2">
        <Label className="text-gray-700 text-start">
          Senha
        </Label>
        <div className="relative">
          <Input
            required
            autoComplete="off"
            className="placeholder:text-gray-400 pr-10"
            placeholder="Digite sua senha"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onChange(e.target.value)}
          />

          <Button
            variant="ghost"
            type="button"
            className="absolute -top-0.5 right-0"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-500" />
            ) : (
              <Eye className="h-5 w-5 text-gray-500" />
            )}
          </Button>
        </div>

        <Button
          asChild
          variant="link"
          className="text-gray-500 text-sm self-end hover:underline"
        >
          <Link href="/auth/forgot-password">Esqueceu a senha?</Link>
        </Button>
      </div>
      <Button
        variant="default"
        type="submit"
        size="lg"
        className="rounded-full bg-primary-600 cursor-pointer hover:bg-primary-700"
        disabled={isLoading || !password}
      >
        {isLoading ? (
          <Loader2 className="animate-spin w-5 h-5 mr-2" />
        ) : (
          'Continuar'
        )}
      </Button>
      <Button
        variant={'link'}
        type="button"
        className="text-gray-500 font-normal text-sm w-fit self-start -mb-2 -mt-2 cursor-pointer"
        onClick={onBack}
      >
        <ArrowLeft /> Voltar para email
      </Button>
    </div>
  )
}