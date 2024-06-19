// theme.ts
import { extendTheme } from '@chakra-ui/react';
import '@fontsource/open-sans';
import '@fontsource/raleway';

const theme = extendTheme({
  fonts: {
    heading: `'Raleway', sans-serif`,
    body: `'Open Sans', sans-serif`,
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
        fontWeight: "600", 
        color: "gray.700"
      },
    },
  },
});

export default theme;
