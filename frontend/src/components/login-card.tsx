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
  Heading,
  Text,
  useColorModeValue,
  Link,
  Alert,
  AlertIcon,
  Spinner,
  Center,
} from '@chakra-ui/react'
import { useState } from 'react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { useRouter } from 'next/router'
import { loginUser } from '@/lib/auth/user'

import theme from '../../theme'

interface LoginCardProps {

}

export default function LoginCard({  }: LoginCardProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const router = useRouter()

  const handleLogin = async () => {
    setIsLoading(true)
    setLoginError('') // Clear any previous error
    try {
      await loginUser(email, password)
      setIsTransitioning(true)
      router.push('/billback-upload')
    } catch (error) {
      console.error(error)
      setLoginError('Invalid email or password. Please try again.')
      setIsLoading(false)
    }
  }

  if (isTransitioning) {
    return (
      <Center height="100vh">
        <Spinner
          thickness='4px'
          speed='0.65s'
          emptyColor='gray.200'
          color='#097564'
          size='xl'
        />
      </Center>
    )
  }

  return (
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}>
      <Box
        rounded={'lg'}
        bg={useColorModeValue('white', 'gray.700')}
        boxShadow={'lg'}
        p={8}
        pt={12} // Reduced top padding
        width={'70%'}
        maxWidth={'700px'}
        minWidth={'300px'}
        height={'60vh'}
        maxHeight={'700px'}
        minHeight={'600px'}
        overflowY={'auto'}>
          <Stack spacing={2} width="100%" height="100%" justify="space-between"> // Reduced spacing
            <Stack spacing={2} width="100%"> // Reduced spacing
              <Stack align={'center'} spacing={2} mt={2}> // Reduced spacing and top margin
                <Flex align="center" justify="center" width="100%">
                  <Flex alignItems="center" height="100%" ml="-10vw">
                    <Box width="20vw" height="20vh" overflow="visible" mr="-6.5vw">
                      <Image 
                        src="/swordfish.png" 
                        alt="SwordFish Logo" 
                        width="100%" 
                        height="100%" 
                        objectFit="contain" 
                      />
                    </Box>
                    <Text
                      fontSize={'5xl'} 
                      fontFamily={theme.fonts.russoOne}
                      fontWeight="medium"
                    >
                      SwordFish
                    </Text>
                  </Flex>
                </Flex>
              </Stack>
              <Stack spacing={4} width="100%" maxWidth="450px" mx="auto"> {/* Add this wrapper */}
                {loginError && (
                  <Alert status="error">
                    <AlertIcon />
                    {loginError}
                  </Alert>
                )}
                <FormControl id="email">
                  <FormLabel fontWeight="bold" color="gray.700">Email address</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    size="lg"
                  />
                </FormControl>
                <FormControl id="password">
                  <FormLabel fontWeight="bold" color={"gray.700"}>Password</FormLabel>
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
                        onClick={() => setShowPassword((showPassword) => !showPassword)}>
                        {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
              </Stack> {/* Close the wrapper */}
              <Stack mt={30} spacing={6} align="center">
                <Button
                  isLoading={isLoading}
                  loadingText="Logging in..."
                  size="lg"
                  bg={'#097564'}
                  color={'white'}
                  _hover={{
                    bg: 'cyan.800',
                  }}
                  onClick={handleLogin}
                  width="40%"
                  maxWidth="200px" // Add this line to limit the button width
                  mx="auto" // Add this line to center the button
                >
                  Log in
                </Button>
              </Stack>
            </Stack>
          </Stack>
      </Box>
    </Flex>
  )
}