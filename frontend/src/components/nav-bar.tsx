import Link from 'next/link';
import { useRouter } from 'next/router';
import { Flex, Box, Text } from '@chakra-ui/react';

const NavBar = () => {
  const router = useRouter();
  const currentPath = router.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Flex
      bg="gray.50"
      borderRight="1px"
      borderColor="gray.200"
      flexDirection="column"
      alignItems="flex-start"
      
      position="sticky"
      top="60px"
      height="calc(100vh - 60px)"
    >
      <Box width="100%" bg={isActive('/billback-upload') ? 'gray.100' : 'transparent'} p="2" borderRadius="md">
        <Link href="/billback-upload" passHref>
          <Text m="2" cursor="pointer" color={isActive('/billback-upload') ? 'green.700' : 'black'}>
            Upload Billback
          </Text>
        </Link>
      </Box>
      <Box width="100%" bg={isActive('/invoices-dashboard') ? 'gray.100' : 'transparent'} p="2" borderRadius="md">
        <Link href="/invoices-dashboard" passHref>
          <Text m="2" cursor="pointer" color={isActive('/invoices-dashboard') ? 'green.700' : 'black'}>
            Invoices
          </Text>
        </Link>
      </Box>
      <Box width="100%" bg={isActive('/admin-panel') ? 'gray.100' : 'transparent'} p="2" borderRadius="md">
        <Link href="/admin-panel" passHref>
          <Text m="2" cursor="pointer" color={isActive('/admin-panel') ? 'green.700' : 'black'}>
            Admin
          </Text>
        </Link>
      </Box>
    </Flex>
  );
};

export default NavBar;
