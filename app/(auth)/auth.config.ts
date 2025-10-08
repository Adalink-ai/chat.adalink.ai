import NextAuth, { User } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { toast } from 'sonner'

// Tipagem estendida do usuário
export interface ExtendedUser extends User {
  invites?: string[]
  id: string
  role: string
  organizationId: string
  access_token: string
  phone?: string
}

// Tipagem estendida do token
interface ExtendedToken extends JWT {
  user: ExtendedUser
  access_token: string
  organizationId: string
  role: string
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  callbacks: {
      async jwt({ token, user, trigger, session }) {
        const typedToken = token as ExtendedToken
  
        // Primeiro login
        if (user) {
          const extendedUser = user as ExtendedUser
  
          typedToken.user = extendedUser
          typedToken.organizationId = extendedUser.organizationId
          typedToken.role = extendedUser.role
          typedToken.access_token = extendedUser.access_token
          // Define quando o token expira (12 horas a partir de agora)
          typedToken.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 12
        }
  
        // Atualiza o tempo de expiração em cada acesso para manter a sessão ativa
        if (trigger === 'update' || (!user && !trigger)) {
          typedToken.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 12
        }
  
        // Quando `session.update()` for chamado
        if (trigger === 'update' && session) {
          const updated = session as Partial<ExtendedUser> & {
            access_token?: string
            organizationId?: string
            role?: string
          }
  
          // Atualiza os valores diretamente no token
          if (updated.organizationId) {
            typedToken.organizationId = updated.organizationId
          }
  
          if (updated.access_token) {
            typedToken.access_token = updated.access_token
          }
  
          if (updated.role) {
            typedToken.role = updated.role
          }
  
          // Atualiza também o user do token
          typedToken.user = {
            ...typedToken.user,
            ...(updated.name && { name: updated.name }),
            ...(updated.image && { image: updated.image }),
            ...(updated.phone && { phone: updated.phone }),
            ...(updated.organizationId && {
              organizationId: updated.organizationId,
            }),
            ...(updated.access_token && { access_token: updated.access_token }),
            ...(updated.role && { role: updated.role }),
          }
        }
  
        return typedToken
      },
  
      async session({ session, token }) {
        const typedToken = token as ExtendedToken
  
        session.user = {
          ...typedToken.user,
          access_token: typedToken.access_token,
          organizationId: String(typedToken.organizationId || ''),
          role: typedToken.role,
        }
  
        // (Opcional: caso você use fora de session.user)
        ;(session as any).organizationId = typedToken.organizationId
        // eslint-disable-next-line padding-line-between-statements
        ;(session as any).access_token = typedToken.access_token
  
        return session
      },
  
      async signIn({ user, account }) {
        if (account?.provider === 'google') {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/v1/auth/login`,
              {
                body: JSON.stringify({
                  email: user.email,
                  imagem: user.image,
                  name: user.name,
                }),
                headers: {
                  'Content-Type': 'application/json',
                  'x-ada-token': process.env.NEXT_PUBLIC_ADA_TOKEN!,
                },
                method: 'POST',
              }
            )
  
            const data = await res.json()
  
            if (!res.ok || !data?.access_token) {
              throw new Error('Erro no login com Google')
            }
  
            Object.assign(user as ExtendedUser, data)
  
            return true
          } catch {
            return false
          }
        }
  
        return true
      },
    },
  
    jwt: {
      maxAge: 60 * 60 * 12, // JWT expira em 12 horas para coincidir com a sessão
    },
  
    pages: {
      signIn: '/auth/login',
      signOut: '/',
    },
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL_V1}/v1/auth/login/credentials`,
            {
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
              headers: {
                'Content-Type': 'application/json',
                'x-ada-token': process.env.NEXT_PUBLIC_ADA_TOKEN!,
              },
              method: 'POST',
            }
          )

          const data = await res.json()

          if (!res.ok || !data?.access_token) {
            toast.error('Credenciais inválidas. Verifique seu e-mail e senha.')
            return null
          }

          return {
            ...data,
            access_token: data.access_token,
            email: data.email,
            id: data.id,
            image: data.image,
            invites: data.invites,
            name: data.name,
            organizationId: data.organizationId,
            phone: data.phone,
            role: data.role,
            emailVerified: null,
          }
        } catch {
          toast.error('Erro ao realizar login. Tente novamente mais tarde.')
          return null
        }
      },
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      name: 'credentials',
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 12, // 12 horas
    updateAge: 60 * 60 * 2, // Atualiza a sessão a cada 2 horas de atividade
  },

  secret: process.env.NEXTAUTH_SECRET,
})