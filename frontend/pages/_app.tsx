import { ChakraProvider, Box } from "@chakra-ui/react";
import "../src/app/globals.css";
import { Providers } from "../src/app/providers";
import NavBar from "../src/components/nav-bar";

function MyApp({
  Component,
  pageProps,
}: {
  Component: React.ComponentType;
  pageProps: any;
}) {
  return (
    <ChakraProvider>
      <Box position="sticky" top="0" zIndex="sticky" width="full">
        <NavBar />
      </Box>
      <Providers>
        <Component {...pageProps} />
      </Providers>
    </ChakraProvider>
  );
}

export default MyApp;
