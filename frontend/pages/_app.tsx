import { ChakraProvider, Box, Flex, Center, Image } from "@chakra-ui/react";
import "../src/app/globals.css";
import { Providers } from "../src/app/providers";
import NavBar from "../src/components/nav-bar";
import TopBar from "../src/components/top-bar";
import theme from '../theme';
import { BillingPeriodProvider } from "@/contexts/BillingPeriodContext";
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/component';
import { useRouter } from 'next/router';

const noNavPaths = ['/set-password', '/auth']

function MyApp({ Component, pageProps }: { Component: React.ComponentType; pageProps: any; }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const shouldShowNav = isAuthenticated && !noNavPaths.includes(router.pathname);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Initial session check:", session);

      if (!mounted) return;

      if (session) {
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        if (!noNavPaths.includes(router.pathname)) {
          router.push('/auth');
        }
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session);
      
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setIsLoading(false);
        if (!noNavPaths.includes(router.pathname)) {
          router.push('/auth');
        }
      } else {
        setIsLoading(false);
      }
    });

    checkAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router.pathname]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log("Forcing loading state to false after timeout");
        setIsLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

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
    );
  }

  return (
    <ChakraProvider theme={theme} cssVarsRoot="body">
      <BillingPeriodProvider>
        <Flex height="100vh" width="100vw" flexDirection="column" overflow="hidden">
          {shouldShowNav && (
            <Box width="100%" position="sticky" top="0" zIndex="sticky">
              <TopBar />
            </Box>
          )}
          <Flex flex="1" height="100%">
            {shouldShowNav && (
              <Box height="100%" flexShrink={0}>
                <NavBar />
              </Box>
            )}
            <Box flex="1" overflowY="auto" p={shouldShowNav ? "4" : "0"}>
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
