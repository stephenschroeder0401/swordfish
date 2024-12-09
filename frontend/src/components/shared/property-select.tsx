import { useState } from 'react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Select,
  Box,
  Text,
  Input,
  VStack,
  Checkbox,
  Portal,
  useDisclosure,
  Button,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
} from '@chakra-ui/react';

interface Property {
  id: string;
  name: string;
  code: string;
}

interface PropertySelectProps {
  selectedProperties?: string[];
  onChange: (propertyIds: string[]) => void;
  placeholder?: string;
  isMulti?: boolean;
  excludeIds?: string[];
  size?: 'sm' | 'md' | 'lg';
  width?: string;
  minWidth?: string;
  properties: Property[];
}

export const PropertySelect = ({
  selectedProperties = [],
  onChange,
  placeholder = 'Select property',
  isMulti = false,
  excludeIds = [],
  size = 'md',
  width,
  minWidth,
  properties,
}: PropertySelectProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedProperties);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const filteredProperties = properties
    .filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handlePropertyClick = (propertyId: string) => {
    const newSelectedIds = isMulti
      ? selectedIds.includes(propertyId)
        ? selectedIds.filter(id => id !== propertyId)
        : [...selectedIds, propertyId]
      : [propertyId];
    
    setSelectedIds(newSelectedIds);
    onChange(newSelectedIds);
    
    if (!isMulti) {
      onClose();
    }
  };

  const getDisplayValue = () => {
    if (selectedIds.length === 0) return placeholder;
    if (!isMulti) {
      const property = properties.find(p => p.id === selectedIds[0]);
      return property ? `${property.name} (${property.code})` : placeholder;
    }
    return `${selectedIds.length} properties selected`;
  };

  return (
    <Box position="relative" width={width} minWidth={minWidth}>
      <Button
        onClick={onOpen}
        width="100%"
        size={size}
        variant="outline"
        justifyContent="space-between"
        textAlign="left"
        fontWeight="normal"
        backgroundColor="white"
        rightIcon={<ChevronDownIcon />}
      >
        {getDisplayValue()}
      </Button>

      {isOpen && (
        <Portal>
          <Box
            position="fixed"
            zIndex={1400}
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            bg="white"
            boxShadow="xl"
            borderRadius="md"
            width="400px"
            maxHeight="80vh"
            overflow="hidden"
          >
            <VStack spacing={0} align="stretch">
              <Box p={4} borderBottomWidth={1}>
                <Input
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size={size}
                  autoFocus
                />
              </Box>

              <Box overflowY="auto" maxHeight="60vh">
                <VStack align="stretch" spacing={0}>
                  {filteredProperties.map(property => (
                    <HStack
                      key={property.id}
                      p={2}
                      spacing={3}
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => handlePropertyClick(property.id)}
                    >
                      {isMulti && (
                        <Checkbox
                          isChecked={selectedIds.includes(property.id)}
                          pointerEvents="none"
                        />
                      )}
                      <Text>
                        {property.name} ({property.code})
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>

              {isMulti && (
                <Box p={4} borderTopWidth={1}>
                  <Button size={size} width="100%" onClick={onClose}>
                    Done
                  </Button>
                </Box>
              )}
            </VStack>
          </Box>
        </Portal>
      )}
    </Box>
  );
};
