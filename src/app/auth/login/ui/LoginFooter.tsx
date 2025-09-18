'use client'

interface LoginFooterProps {
  isMobile?: boolean
}

export function LoginFooter({ isMobile }: LoginFooterProps) {
  if (isMobile) {
    return (
      <div className="flex xl:hidden w-full justify-center items-center text-xs text-gray-500 mt-8">
        <p>© 2024 Adalink. Todos os direitos reservados.</p>
      </div>
    )
  }

  return (
    <div className="flex w-full justify-between items-center">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Adalink</h2>
        <p className="text-white/80">Plataforma de IA conversacional</p>
      </div>
      <div className="text-right">
        <p>© 2024 Adalink. Todos os direitos reservados.</p>
      </div>
    </div>
  )
}