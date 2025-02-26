import React from 'react';
import { Flex, Heading } from '@chakra-ui/react';

const BillbackHeader: React.FC = () => {
  return (
    <Flex 
      bg="white" 
      borderBottom="1px" 
      borderColor="gray.200" 
      p={4}
      h="7vh"
      alignItems="center" 
      pb="1vh"
      justifyContent="space-between"
    >
      <Heading as="h1" size="lg">
        Time Management
      </Heading>
    </Flex>
  );
};

export default BillbackHeader; 