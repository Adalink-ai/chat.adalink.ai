'use client'

import { useEffect, useState, Suspense } from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import { signIn, signOut, getSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

import type { ExtendedUser } from '@/app/(auth)/auth.config'
import { SocialLoginBlock } from '../ui/SocialLoginBlock'
import { LoginFooter } from '../ui/LoginFooter'
import { PasswordStep } from '../ui/PasswordStep'
import { EmailStep } from '../ui/EmailStep'

async function getSessionSafely() {
  try {
    return await getSession()
  } catch {
    toast.error('Erro ao recuperar a sessão')

    return null
  }
}

function DefaultLoginInner() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [step, setStep] = useState<'email' | 'password'>('email')
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams?.get('error')

  const handlePasswordLogin = async () => {
    if (isLoggingIn) return
    setIsLoggingIn(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.ok) {
      const session = await getSessionSafely()
      const user = session?.user as ExtendedUser

      const hasOrg = !!user?.organizationId && user.organizationId.trim() !== ''
      const hasInvites = Array.isArray(user?.invites) && user.invites.length > 0

      if (!hasOrg && hasInvites) {
        window.location.href = '/auth/invite'

        return
      }

      if (!hasOrg && !hasInvites) {
        window.location.href = '/auth/signup/organization'

        return
      }

      // Redirecionamento para página principal
      const redirectPath = '/'

      toast.success('Login realizado com sucesso')
      router.push(redirectPath)
    } else {
      toast.error('Usuário ou senha incorretos')
    }

    setIsLoggingIn(false)
  }

  const handleContinue = async () => {
    if (step === 'email') {
      if (!email) return
      setStep('password')
    } else {
      await handlePasswordLogin()
    }
  }

  useEffect(() => {
    if (error === 'UserNotAuthorized') {
      toast('Usuário não registrado')
    }

    if (error === 'CredentialsSignin') {
      toast('Usuário ou senha incorretos')
    }
  }, [error])

  useEffect(() => {
    const isOAuthCallback = window.location.href.includes('/callback/')

    if (!isOAuthCallback) {
      void signOut({ redirect: false })
    }
  }, [])

  return (
    <div className="w-screen h-screen grid grid-cols-1 xl:grid-cols-2 overflow-auto">
      <aside className='hidden xl:flex w-full bg-gradient-to-br from-primary-800 to-primary-600 items-end justify-between p-10 text-xs text-white'>
        <LoginFooter />
      </aside>

      <aside className="flex w-full justify-center bg-primary-900 text-white">
        <div className="flex flex-col items-center justify-center w-full p-10 gap-10 max-w-lg text-center text-primary-foreground">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-semibold">Bem-vindo de volta</h1>
            <p className="text-primary-foreground/60">Faça login na sua conta</p>
          </div>

          <form
            className="flex flex-col w-full gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              void handleContinue()
            }}
          >
            <AnimatePresence mode="wait">
              {step === 'email' && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, scale: 0.95, x: -30 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ filter: 'blur(4px)', opacity: 0, scale: 1, x: 30 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  <EmailStep
                    email={email}
                    onChange={setEmail}
                    onContinue={handleContinue}
                    disabled={isLoggingIn}
                  />
                </motion.div>
              )}

              {step === 'password' && (
                <motion.div
                  key="password"
                  initial={{ opacity: 0, scale: 0.95, x: 30 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ filter: 'blur(4px)', opacity: 0, scale: 1, x: -30 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  <PasswordStep
                    password={password}
                    onChange={setPassword}
                    onLogin={handlePasswordLogin}
                    isLoading={isLoggingIn}
                    onBack={() => setStep('email')}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {step === 'email' && <SocialLoginBlock />}
          </form>

          <LoginFooter isMobile />
        </div>
      </aside>
    </div>
  )
}

export function DefaultLogin() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DefaultLoginInner />
    </Suspense>
  )
}