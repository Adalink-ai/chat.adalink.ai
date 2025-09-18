'use client'

import { useEffect, useState } from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, signOut, getSession } from 'next-auth/react'
import { toast } from 'sonner'

import { EmailStep } from '../ui/EmailStep'
import { LoginFooter } from '../ui/LoginFooter'
import { PasswordStep } from '../ui/PasswordStep'
import { SocialLoginBlock } from '../ui/SocialLoginBlock'

async function getSessionSafely() {
  try {
    return await getSession()
  } catch {
    toast.error('Erro ao recuperar a sessão')
    return null
  }
}

export function DefaultLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [step, setStep] = useState<'email' | 'password'>('email')
  const error = useSearchParams().get('error')
  const router = useRouter()

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
      const user = session?.user

      toast.success('Login realizado com sucesso')
      router.push('/')
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
      toast('Usuário não autorizado')
    }

    if (error === 'CredentialsSignin') {
      toast('Erro no login')
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
      <aside className="hidden xl:flex w-full items-end justify-between p-10 text-xs text-white relative overflow-hidden">
        <Image
          src="/assets/bg-login.jpg"
          alt="Login background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10">
          <LoginFooter />
        </div>
      </aside>

      <aside className="flex w-full justify-center bg-gray-50 text-gray-900">
        <div className="flex flex-col items-center justify-center w-full p-10 gap-10 max-w-lg text-center">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-semibold text-gray-900">Faça login</h1>
            <p className="text-gray-600">Acesse sua conta</p>
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