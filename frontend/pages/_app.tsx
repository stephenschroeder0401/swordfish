import { ChakraProvider, Box, Flex, Center, Spinner } from "@chakra-ui/react";
import "../src/app/globals.css";
import { Providers } from "../src/app/providers";
import NavBar from "../src/components/nav-bar";
import TopBar from "../src/components/top-bar";
import theme from '../theme';
import { BillingPeriodProvider } from "@/contexts/BillingPeriodContext";
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/component';

function MyApp({ Component, pageProps }: { Component: React.ComponentType; pageProps: any; }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Initial session check:", session);
      if (session) {
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", event, session);
      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <Center height="100vh">
        <Spinner 
          thickness="4px" 
          speed="0.65s" 
          emptyColor="gray.200" 
          color="blue.500" 
          size="xl" 
        />
      </Center>
    );
  }

  return (
    <ChakraProvider theme={theme} cssVarsRoot="body">
      <BillingPeriodProvider>
        <Flex height="100vh" width="100vw" flexDirection="column" overflow="hidden">
          {isAuthenticated && (
            <Box width="100%" position="sticky" top="0" zIndex="sticky">
              <TopBar />
            </Box>
          )}
          <Flex flex="1" height="100%">
            {isAuthenticated && (
              <Box width="175px" height="100%" flexShrink={0}>
                <NavBar />
              </Box>
            )}
            <Box flex="1" overflowY="auto" p={isAuthenticated ? "4" : "0"}>
              <Providers>
                <Component {...pageProps} />
              </Providers>
            </Box>
          </Flex>
        </Flex>
      </BillingPeriodProvider>
    </ChakraProvider>
  );
}

export default MyApp;
