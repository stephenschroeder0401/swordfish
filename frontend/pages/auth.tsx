import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import LoginCard from '@/components/login-card'
import { createClient } from '@/lib/supabase/component'
import { Center, Image } from '@chakra-ui/react'

const AuthPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check for tokens in URL fragment
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const access_token = hashParams.get('access_token')
    const refresh_token = hashParams.get('refresh_token')

    const handleSession = async () => {
      if (access_token && refresh_token) {
        // Set the session with the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token
        })
        
        if (error) {
          console.error('Error setting session:', error)
          setIsLoading(false)
          return
        }

        // If we're coming from an invite, go to set-password
        if (window.location.href.includes('type=invite')) {
          router.push('/set-password')
        } else {
          router.push('/billback-upload')
        }
      } else {
        setIsLoading(false)
      }
    }

    handleSession()
  }, [])

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
