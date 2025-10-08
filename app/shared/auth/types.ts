import { JWT } from 'next-auth/jwt'

interface ExtendedToken extends JWT {
  user: ExtendedUser
}

export interface ExtendedUser {
  id: string
  role: string
  organizationId: string
  access_token: string
  phone?: string
  invite?: string
}
