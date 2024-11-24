import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/component'

interface UserMetadata {
  client_id: string
  role: string
  first_name: string
  last_name: string
}

export const useAuth = () => {
  const [user, setUser] = useState<UserMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser((session?.user?.user_metadata as UserMetadata) || null)
      setIsLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser((session?.user?.user_metadata as UserMetadata) || null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, isLoading }
}
