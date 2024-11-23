// theme.ts
import { extendTheme } from '@chakra-ui/react';
import '@fontsource/open-sans';
import '@fontsource/raleway';
import '@fontsource/russo-one';

const theme = extendTheme({
  fonts: {
    heading: `'Raleway', sans-serif`,
    body: `'Open Sans', sans-serif`,
    russoOne: `'Russo One', sans-serif`,
  },
  components: {
    Text: {
      baseStyle: {
        fontFamily: 'Raleway',
        fontSize: "14px",
        fontWeight: "600", 
        color: "gray.700"
      },
    },
    Heading: {
      baseStyle: {
        fontFamily: 'Raleway',
        fontSize: "14px",
        fontWeight: "800", 
        
      },
    },
  },
});

export default theme;
