// components/TopBar.tsx

import { Box, Flex, Image, Text, Menu, MenuButton, MenuList, MenuItem, IconButton } from "@chakra-ui/react";
import { FiUser } from "react-icons/fi";
import { createClient } from '@/utils/supabase/component';
import { useRouter } from 'next/router';

const TopBar = () => {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  return (
    <Box bg="gray.900" p="4" width="100%" boxShadow="md" height="60px">
      <Flex alignItems="center" height="100%" justifyContent="space-between">
        <Flex alignItems="center" height="100%">
          <Box width="80px" height="80px" overflow="hidden" mr="0">
            <Image src="/swordfish.png" alt="SwordFish Logo" width="100%" height="90%" objectFit="contain" />
          </Box>
          <Text color="cyan.50" fontSize="lg">SwordFish</Text>
        </Flex>

        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FiUser />}
            variant="ghost"
            color="cyan.50"
            _hover={{ bg: 'gray.700' }}
            aria-label="User menu"
          />
          <MenuList bg="gray.800" borderColor="gray.700">
            <MenuItem 
              onClick={handleLogout}
              bg="gray.800"
              color="cyan.50"
              _hover={{ bg: 'gray.700' }}
            >
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Box>
  );
};

export default TopBar;
