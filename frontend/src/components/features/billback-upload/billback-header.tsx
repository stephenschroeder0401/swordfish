import React from 'react';
import { Flex, Heading } from '@chakra-ui/react';

const BillbackHeader: React.FC = () => {
  return (
    <Flex
      height="7vh"
      bg="white"
      borderBottom="1px"
      borderColor="gray.200"
      align="center"
      px={4}
    >
      <Heading size="md">Time Management</Heading>
    </Flex>
  );
};

export default BillbackHeader; 