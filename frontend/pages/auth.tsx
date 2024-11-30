import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import LoginCard from '@/components/login-card'
import { authClient, loginWithToken } from '@/lib/auth/user'
import { Center, Image } from '@chakra-ui/react'

const AuthPage: React.FC = () => {
  return (
    <main>
      <LoginCard />
    </main>
  )
}

export default AuthPage
