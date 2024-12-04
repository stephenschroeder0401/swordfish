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
    const handleSession = async () => {
      try {
        // Find the Supabase auth token key
        const supabaseKey = Object.keys(localStorage).find(key => 
          key.startsWith('sb-') && key.endsWith('-auth-token')
        )
        
        console.log('Found Supabase key:', supabaseKey)

        if (!supabaseKey) {
          console.log('No Supabase session key found')
          setIsLoading(false)
          return
        }

        const storedSession = localStorage.getItem(supabaseKey)
        if (!storedSession) {
          console.log('No stored session found')
          setIsLoading(false)
          return
        }

        const session = JSON.parse(storedSession)
        console.log('Found stored session:', session)

        const { data, error } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        })
        
        console.log('setSession result:', { data, error })
        
        if (error) {
          console.error('Error setting session:', error)
          setIsLoading(false)
          return
        }

        // Check for setPassword parameter in URL
        console.log("routerQuery: ", router.query);

        if (router.query.setPassword === 'true') {
          router.push('/set-password')
        } else {
          router.push('/billback-upload')
        }
      } catch (error) {
        console.error('Error handling session:', error)
        setIsLoading(false)
      }
    }

    handleSession()
  }, [router.isReady])

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
