import { useState } from 'react';
import {
  Box,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  Button,
  VStack,
  HStack,
  Select,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';

interface PropertyGroupsPanelProps {
  properties: any[]; // We'll need the properties list for the select
}

export const PropertyGroupsPanel = ({ properties }: PropertyGroupsPanelProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupName, setGroupName] = useState('');
  const [allocations, setAllocations] = useState<Array<{
    id: string;
    propertyId: string;
    percentage: string;
  }>>([]);

  const handleAddAllocation = () => {
    setAllocations([
      ...allocations,
      { id: crypto.randomUUID(), propertyId: '', percentage: '' }
    ]);
  };

  return (
    <Box>
      <IconButton
        aria-label="Add property group"
        icon={<AddIcon />}
        size="xs"
        colorScheme="green"
        onClick={onOpen}
      />

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Property Group</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Input
                placeholder="Property Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              
              {allocations.map((allocation, index) => (
                <HStack key={allocation.id} spacing={4}>
                  <Select
                    placeholder="Select Property"
                    value={allocation.propertyId}
                    onChange={(e) => {
                      const newAllocations = [...allocations];
                      newAllocations[index].propertyId = e.target.value;
                      setAllocations(newAllocations);
                    }}
                  >
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.id}>
                        {prop.name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    placeholder="Percentage"
                    type="number"
                    value={allocation.percentage}
                    onChange={(e) => {
                      const newAllocations = [...allocations];
                      newAllocations[index].percentage = e.target.value;
                      setAllocations(newAllocations);
                    }}
                  />
                </HStack>
              ))}

              <Button onClick={handleAddAllocation} size="sm">
                Add Row
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};
