import { useState, useRef } from 'react';
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
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  const allOption = {
    label: "Select All",
    value: "all"
  };

  const handleChange = (selected) => {
    if (selected?.find(option => option.value === "all")) {
      // If "Select All" is chosen, select all items
      onChange(properties.map(property => property.id));
    } else {
      // Normal selection
      onChange(selected.map(option => option.value));
    }
  };

  const options = [
    allOption,
    ...properties.map(property => ({
      label: property.name,
      value: property.id
    }))
  ];

  const handleSelectAll = () => {
    const allPropertyIds = properties
      .filter(prop => !excludeIds.includes(prop.id))
      .map(prop => prop.id);
    
    setSelectedIds(allPropertyIds);
    onChange(allPropertyIds);
    if (!isMulti) {
      onClose();
    }
  };

  return (
    <Box position="relative" width={width} minWidth={minWidth}>
      <Button
        ref={buttonRef}
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

      {isOpen && buttonRef.current && (
        <Portal>
          <Box
            position="fixed"
            zIndex={1400}
            bg="white"
            boxShadow="xl"
            borderRadius="md"
            width="400px"
            overflow="hidden"
            mt={1}
            style={{
              top: `${Math.min(
                buttonRef.current.getBoundingClientRect().bottom,
                window.innerHeight - 400
              )}px`,
              left: `${buttonRef.current.getBoundingClientRect().left}px`,
              maxHeight: `${Math.min(
                400,
                window.innerHeight - buttonRef.current.getBoundingClientRect().bottom - 20
              )}px`
            }}
          >
            <VStack spacing={0} align="stretch" height="100%">
              <Box p={4} borderBottomWidth={1}>
                <Input
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size={size}
                  autoFocus
                />
              </Box>

              <Box 
                overflowY="auto" 
                maxHeight="calc(100vh - 300px)"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '4px',
                  },
                  '&::-webkit-scrollbar-track': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'gray.200',
                    borderRadius: '24px',
                  },
                }}
              >
                <VStack align="stretch" spacing={0}>
                  {isMulti && (
                    <HStack
                      p={2}
                      spacing={3}
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      onClick={handleSelectAll}
                    >
                      <Checkbox
                        isChecked={selectedIds.length === properties.length}
                        pointerEvents="none"
                      />
                      <Text>Select All</Text>
                    </HStack>
                  )}
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
                <Box p={4} borderTopWidth={1} bg="white" position="sticky" bottom={0}>
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
