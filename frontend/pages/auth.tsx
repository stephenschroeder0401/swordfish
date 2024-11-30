import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import LoginCard from '@/components/login-card'
import { authClient, loginWithToken } from '@/lib/auth/user'
import { Center, Image } from '@chakra-ui/react'

const AuthPage: React.FC = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const hash = router.asPath.split('#')[1]
    console.log('Full hash:', hash)
    
    if (hash) {
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const shouldSetPassword = params.get('setPassword')
      
      console.log('Access Token:', accessToken)
      console.log('Refresh Token:', refreshToken)
      console.log('Should Set Password:', shouldSetPassword)

      if (accessToken && refreshToken) {
        loginWithToken(accessToken, refreshToken)
          .then(() => {
            if (shouldSetPassword) {
              router.push('/set-password')
            } else {
              router.push('/billback-upload')
            }
          })
          .catch((error) => {
            console.error('Token login error:', error)
          })
          .finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [router])

  if (isLoading) {
    return (
      <Center height="100vh">
        <Image
          src="/loading.gif"
          alt="Loading..."
          width="300px"
          height="300px"
        />
      </Center>
    )
  }

  return (
    <main>
      <LoginCard />
    </main>
  )
}

export default AuthPage
