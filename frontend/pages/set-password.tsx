import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { authClient } from '@/lib/auth/user'
import SetPasswordCard from '@/components/set-password-card'
import { Center, Image, Text } from '@chakra-ui/react'

const SetPasswordPage: React.FC = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const hash = router.asPath.split('#')[1]
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')

    if (accessToken) {
      authClient.auth
        .setSession({
          access_token: accessToken,
          refresh_token: ''
        })
        .then(({ error }) => {
          if (error) {
            setError('Failed to authenticate. Please try the link again.')
          } else {
            setToken(accessToken)
          }
        })
        .catch((error) => {
          console.error(error)
          setError('An unexpected error occurred.')
        })
        .finally(() => setLoading(false))
    } else {
      setError('No token found. Please check the invitation link.')
      setLoading(false)
    }
  }, [router])

  if (loading) {
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

  if (error) {
    return (
      <Center height="100vh">
        <Text color="red.500">{error}</Text>
      </Center>
    )
  }

  return (
    <main>
      <SetPasswordCard accessToken={token!} />
    </main>
  )
}

export default SetPasswordPage
