'use client'

import {
  Flex,
  Box,
  Image,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Button,
  Text,
  useColorModeValue,
  Alert,
  AlertIcon,
  Center,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { useRouter } from 'next/router'
import { updateUserPassword, authClient, loginUser} from '@/lib/auth/user'
import theme from '../../theme'


export default function SetPasswordCard() {
  const bgColor = useColorModeValue('gray.50', 'gray.800')
  const boxBgColor = useColorModeValue('white', 'gray.700')

  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [firstName, setFirstName] = useState('')

  const router = useRouter()
  

  useEffect(() => {
    const getUserName = async () => {
      try {
        const { data: { user } } = await authClient.auth.getUser()
        const userFirstName = user?.user_metadata?.first_name || ''
        setFirstName(userFirstName)
      } catch (error) {
        console.error('Error fetching user name:', error)
      }
    }
    getUserName()
  }, [])

  const handleSetPassword = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      await updateUserPassword(password);
      
      // Get the current user's email
      const { data: { user } } = await authClient.auth.getUser()
      if (!user?.email) {
        throw new Error('No user email found')
      }

      // Login with new credentials
      await loginUser(user.email, password)
      
      setIsTransitioning(true)
      router.push('/billback-upload')
    } catch (error) {
      console.error(error)
      setError('Failed to set password. Please try again.')
      setIsLoading(false)
    }
  }

  if (isTransitioning) {
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
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={bgColor}>
      <Box
        rounded={'lg'}
        bg={boxBgColor}
        boxShadow={'lg'}
        p={8}
        pt={4}
        width={'70%'}
        maxWidth={'700px'}
        minWidth={'300px'}
        height={'60vh'}
        maxHeight={'700px'}
        minHeight={'600px'}
        overflowY={'auto'}>
        <Stack spacing={2} width="100%" height="100%" justify="space-between">
          <Stack spacing={2} width="100%">
            <Flex align="center" width="100%" mb={0}>
              <Box width="110px" height="110px" overflow="visible" mr={-4} mt={-2} ml={-4}>
                <Image 
                  src="/swordfish.png" 
                  alt="SwordFish Logo" 
                  width="100%" 
                  height="100%" 
                  objectFit="contain" 
                />
              </Box>
              <Text
                fontSize={'2xl'} 
                fontFamily={theme.fonts.russoOne}
                fontWeight="medium"
              >
                SwordFish
              </Text>
            </Flex>
            <Stack align={'center'} spacing={2} mb={8}>
              <Text
                fontSize={'4xl'} 
                fontWeight="bold"
                color="black"
              >
                Hi, {firstName}!
              </Text>
              <Text fontSize="md" color="gray.600">
                Welcome to SwordFish! Let&apos;s set your password to get started.
              </Text>
            </Stack>
            <Stack spacing={2} width="100%" maxWidth="450px" mx="auto">
              {error && (
                <Alert status="error">
                  <AlertIcon />
                  {error}
                </Alert>
              )}
              <FormControl id="password">
                <FormLabel fontWeight="bold" color="gray.700">Set Password</FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={() => setShowPassword((show) => !show)}>
                      {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <FormControl id="confirmPassword">
                <FormLabel fontWeight="bold" color="gray.700">Confirm Password</FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </InputGroup>
              </FormControl>
            </Stack>
            <Stack mt={30} spacing={6} align="center">
              <Button
                isLoading={isLoading}
                loadingText="Setting password..."
                size="lg"
                bg={'#097564'}
                color={'white'}
                _hover={{
                  bg: 'cyan.800',
                }}
                onClick={handleSetPassword}
                width="40%"
                maxWidth="200px"
                mx="auto"
              >
                Set Password
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Flex>
  )
}
