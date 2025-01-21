import { useState, useRef } from 'react';
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
  showSelectAll?: boolean;
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
  showSelectAll = false,
}: BillingAccountSelectProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedAccounts);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  const handleSelectAll = () => {
    const allAccountIds = billingAccounts
      .filter(account => !excludeIds.includes(account.id))
      .map(account => account.id);
    
    setSelectedIds(allAccountIds);
    onChange(allAccountIds);
    if (!isMulti) {
      onClose();
    }
  };

  const options = [
    {
      label: "Select All",
      value: "all"
    },
    ...billingAccounts.map(account => ({
      label: account.name,
      value: account.id
    }))
  ];

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
                  placeholder="Search accounts..."
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
                  {showSelectAll && isMulti && (
                    <HStack
                      p={2}
                      spacing={3}
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      onClick={handleSelectAll}
                    >
                      <Checkbox
                        isChecked={selectedIds.length === billingAccounts.length}
                        pointerEvents="none"
                      />
                      <Text>Select All</Text>
                    </HStack>
                  )}
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
