// components/TopBar.tsx

import { Box, Flex, Image, Text } from "@chakra-ui/react";

const TopBar = () => {
  return (
    <Box bg="gray.900" p="4" width="100%" boxShadow="md" height="60px">
      <Flex alignItems="center" height="100%">
        <Box width="80px" height="80px" overflow="hidden" mr="0">
          <Image src="/swordfish.png" alt="SwordFish Logo" width="100%" height="90%%" objectFit="contain" />
        </Box>
        <Text color="cyan.50" fontSize="lg">SwordFish</Text>
      </Flex>
    </Box>
  );
};

export default TopBar;
