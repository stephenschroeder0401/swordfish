// components/NavBar.tsx

import Link from "next/link";
import { Flex, Box, Text } from "@chakra-ui/react";

const NavBar = () => {
  return (
    <Flex bg="blue.500" color="white" justifyContent="flex-start" p="4">

      <Box mr="4">
        <Link href="/billback-upload" passHref>
          <Text cursor="pointer">Upload Billback</Text>
        </Link>
      </Box>
      <Box mr="4">
        <Link href="/invoices-dashboard" passHref>
          <Text cursor="pointer">Invoices</Text>
        </Link>
      </Box>
      <Box mr="4">
        <Link href="/admin-panel" passHref>
          <Text cursor="pointer">Admin</Text>
        </Link>
      </Box>
    </Flex>
  );
};

export default NavBar;
