import { Box, Heading, Text } from '@chakra-ui/react';

const HomePage = () => {
  return (
    <Box p={4}>
      <Heading as="h1">Home Page Heading</Heading>
      <Heading as="h2">Subheading</Heading>
      <Text>This is a text component.</Text>
    </Box>
  );
};

export default HomePage;