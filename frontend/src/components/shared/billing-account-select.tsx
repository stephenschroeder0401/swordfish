import { useState } from 'react';
import {
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
  TagCloseButton
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

interface BillingAccount {
  id: string;
  name: string;
  glcode: string;
}

interface BillingAccountSelectProps {
  selectedAccounts?: string[];
  onChange: (accountIds: string[]) => void;
  placeholder?: string;
  isMulti?: boolean;
  excludeIds?: string[];
  size?: 'sm' | 'md' | 'lg';
  width?: string;
  minWidth?: string;
  billingAccounts: BillingAccount[];
}

export const BillingAccountSelect = ({
  selectedAccounts = [],
  onChange,
  placeholder = 'Select billing account',
  isMulti = false,
  excludeIds = [],
  size = 'md',
  width,
  minWidth,
  billingAccounts,
}: BillingAccountSelectProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedAccounts);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const filteredAccounts = billingAccounts
    .filter(account => 
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.glcode.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleAccountClick = (accountId: string) => {
    const newSelectedIds = isMulti
      ? selectedIds.includes(accountId)
        ? selectedIds.filter(id => id !== accountId)
        : [...selectedIds, accountId]
      : [accountId];
    
    setSelectedIds(newSelectedIds);
    onChange(newSelectedIds);
    
    if (!isMulti) {
      onClose();
    }
  };

  const getDisplayValue = () => {
    if (selectedIds.length === 0) return placeholder;
    if (!isMulti) {
      const account = billingAccounts.find(a => a.id === selectedIds[0]);
      return account ? `${account.name} (${account.glcode})` : placeholder;
    }
    return `${selectedIds.length} accounts selected`;
  };

  const handleRemoveAccount = (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the select from opening
    const newSelectedIds = selectedIds.filter(id => id !== accountId);
    setSelectedIds(newSelectedIds);
    onChange(newSelectedIds);
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
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size={size}
                  autoFocus
                />
              </Box>

              <Box overflowY="auto" maxHeight="60vh">
                <VStack align="stretch" spacing={0}>
                  {filteredAccounts.map(account => (
                    <HStack
                      key={account.id}
                      p={2}
                      spacing={3}
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => handleAccountClick(account.id)}
                    >
                      {isMulti && (
                        <Checkbox
                          isChecked={selectedIds.includes(account.id)}
                          pointerEvents="none"
                        />
                      )}
                      <Text>
                        {account.name} ({account.glcode})
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
