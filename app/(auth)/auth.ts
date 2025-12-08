import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { createGuestUser, getUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

export type UserType = 'guest' | 'regular';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string;
    user: {
      id: string;
      type: UserType;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string;
    type?: UserType;
    accessToken?: string;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials.email as string;
        const password = credentials.password as string;
        const users = await getUser(email);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) return null;

        return { ...user, type: 'regular' };
      },
    }),
    Credentials({
      id: 'sso',
      name: 'SSO',
      credentials: {
        email: { label: "Email", type: "email" },
        userId: { label: "User ID", type: "text" },
        accessToken: { label: "Access Token", type: "text" }
      },
      async authorize(credentials) {
        // Provider SSO - apenas valida que o usuário existe
        const email = credentials.email as string;
        const userId = credentials.userId as string;
        const accessToken = credentials.accessToken as string;
        
        if (!email || !userId) {
          return null;
        }

        const users = await getUser(email);
        
        if (users.length === 0) {
          return null;
        }

        const [user] = users;
        return { ...user, type: 'regular', accessToken };
      },
    }),
    Credentials({
      id: 'guest',
      credentials: {},
      async authorize() {
        const [guestUser] = await createGuestUser();
        return { ...guestUser, type: 'guest' };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
        if (user.accessToken) {
          token.accessToken = user.accessToken;
          console.log('[Auth] AccessToken armazenado no JWT ✓');
          console.log('[Auth] AccessToken (primeiros 20 chars):', `${user.accessToken.substring(0, 20)}...`);
        } else {
          console.warn('[Auth] ⚠️ User não tem accessToken');
          console.log('[Auth] User object:', { id: user.id, email: (user as any).email, type: user.type });
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id && token.type) {
        session.user.id = token.id;
        session.user.type = token.type;
      }
      if (token.accessToken) {
        session.accessToken = token.accessToken;
        console.log('[Auth] AccessToken incluído na sessão ✓');
        console.log('[Auth] AccessToken na sessão (primeiros 20 chars):', `${token.accessToken.substring(0, 20)}...`);
      } else {
        console.warn('[Auth] ⚠️ Token JWT não tem accessToken');
        console.log('[Auth] Token object keys:', Object.keys(token));
      }

      return session;
    },
  },
});
