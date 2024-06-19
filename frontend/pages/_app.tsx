import { ChakraProvider, Box, Flex } from "@chakra-ui/react";
import "../src/app/globals.css";
import { Providers } from "../src/app/providers";
import NavBar from "../src/components/nav-bar";
import TopBar from "../src/components/top-bar";
import theme from '../theme';

function MyApp({ Component, pageProps }: { Component: React.ComponentType; pageProps: any; }) {
  return (
    <ChakraProvider theme={theme} cssVarsRoot="body">
      <Flex height="100vh" width="100vw" flexDirection="column" overflow="hidden">
        <Box width="100%" position="sticky" top="0" zIndex="sticky">
          <TopBar />
        </Box>
        <Flex flex="1" height="100%">
          <Box width="150px" height="100%" flexShrink={0}>
            <NavBar />
          </Box>
          <Box flex="1" overflowY="auto" p="4">
            <Providers>
              <Component {...pageProps} />
            </Providers>
          </Box>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
}

export default MyApp;
