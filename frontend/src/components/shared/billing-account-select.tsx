import { useState, useRef, useEffect } from 'react';
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
import { fetchAllBillingAccounts } from '@/lib/data-access/';

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
  const [accounts, setAccounts] = useState<BillingAccount[]>(billingAccounts || []);

  console.log("All billing accounts:", billingAccounts);
  console.log("Selected accounts:", selectedAccounts);

  useEffect(() => {
    setAccounts(billingAccounts);
  }, [billingAccounts]);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const { data } = await fetchAllBillingAccounts(0, 1000);
        setAccounts(data || []);
      } catch (error) {
        console.error('Error loading billing accounts:', error);
      }
    };

    if (!billingAccounts || billingAccounts.length === 0) {
      loadAccounts();
    }
  }, [billingAccounts]);

  const filteredAccounts = accounts
    .filter(account => {
      const matches = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.glcode.toLowerCase().includes(searchTerm.toLowerCase());
      console.log(`Account ${account.name}: matches filter? ${matches}`);
      return matches;
    });
  console.log("Filtered accounts:", filteredAccounts);

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
      const account = accounts.find(a => a.id === selectedIds[0]);
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
    const allAccountIds = accounts
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
    ...accounts.map(account => ({
      label: account.name,
      value: account.id
    }))
  ];

  // Calculate available space dynamically
  const getMaxHeight = () => {
    if (!buttonRef.current) return 500;
    const buttonBottom = buttonRef.current.getBoundingClientRect().bottom;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - buttonBottom - 20; // 20px buffer
    return Math.max(200, Math.min(500, spaceBelow));
  };

  const handleOpen = async () => {
    try {
      const { data } = await fetchAllBillingAccounts(0, 1000);
      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading billing accounts:', error);
    }
    onOpen();
  };

  return (
    <Box
      position="relative"
      width={width}
      minWidth={minWidth}
    >
      <Button
        ref={buttonRef}
        onClick={handleOpen}
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
                window.innerHeight - getMaxHeight()
              )}px`,
              left: `${buttonRef.current.getBoundingClientRect().left}px`,
              maxHeight: getMaxHeight()
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
                maxHeight="400px"
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
                        isChecked={selectedIds.length === accounts.length}
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
