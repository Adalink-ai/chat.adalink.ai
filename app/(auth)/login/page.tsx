import { Suspense } from 'react'
import { DefaultLogin } from '@/src/app/auth/login/_components/DefaultLogin'

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <DefaultLogin />
    </Suspense>
  )
}
