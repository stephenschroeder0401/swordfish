import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Collapse,
  Select,
  NumberInput,
  NumberInputField,
  HStack,
  VStack,
  Text,
  Divider,
  Flex,
  Center,
  Spinner
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, AddIcon, MinusIcon } from '@chakra-ui/icons';
import { PropertySelect } from '@/components/shared/property-select';
import { BillingAccountSelect } from '@/components/shared/billing-account-select';
import { fetchAllBillingAccounts, saveAllPropertyGroups, fetchAllPropertyGroups } from '@/lib/data-access/';
import { useToast } from '@chakra-ui/react';
import { v4 as uuidv4 } from 'uuid';
import { getRevenueAllocation } from '@/lib/utils/revenue-calculations';

interface Property {
  id: string;
  name: string;
  code: string;
}

interface PropertyGroupRow {
  id: string;
  name: string;
  isExpanded: boolean;
  allocationType: 'custom' | 'revenue';
  properties: Array<{
    id: string;
    percentage: number;
  }>;
  billingAccounts: string[];
}

export const PropertyGroupsPanel = ({ properties = [], billingAccounts = [] }) => {
  const [rows, setRows] = useState<PropertyGroupRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const loadPropertyGroups = async () => {
      try {
        const groups = await fetchAllPropertyGroups();
        setRows(groups.map(group => ({
          ...group,
          allocationType: 'custom' as const
        })));
      } catch (error) {
        console.error('Error loading property groups:', error);
        toast({
          title: 'Error',
          description: 'Failed to load property groups. Please refresh the page.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPropertyGroups();
  }, [toast]);

  const addNewRow = () => {
    const newRow: PropertyGroupRow = {
      id: uuidv4(),
      name: '',
      isExpanded: false,
      allocationType: 'custom',
      properties: [],
      billingAccounts: []
    };
    setRows([newRow, ...rows]);
  };

  const toggleRow = (rowId: string) => {
    setRows(rows.map(row => 
      row.id === rowId ? { ...row, isExpanded: !row.isExpanded } : row
    ));
  };

  const updateGroupName = (rowId: string, name: string) => {
    setRows(rows.map(row =>
      row.id === rowId ? { ...row, name } : row
    ));
  };

  const addPropertyToGroup = (rowId: string, propertyId: string) => {
    setRows(rows.map(row => {
      if (row.id === rowId && !row.properties.find(p => p.id === propertyId)) {
        return {
          ...row,
          properties: [...row.properties, { id: propertyId, percentage: 0 }]
        };
      }
      return row;
    }));
  };

  const updatePropertyPercentage = (rowId: string, propertyId: string, percentage: number) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          properties: row.properties.map(prop => 
            prop.id === propertyId ? { ...prop, percentage } : prop
          )
        };
      }
      return row;
    }));
  };

  const deleteRow = (rowId: string) => {
    setRows(rows.filter(row => row.id !== rowId));
  };

  const deletePropertyFromGroup = (rowId: string, propertyId: string) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          properties: row.properties.filter(prop => prop.id !== propertyId)
        };
      }
      return row;
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const rowsToSave = rows.map(row => ({
        ...row,
        id: row.id.startsWith('temp-') ? uuidv4() : row.id
      }));
      
      await saveAllPropertyGroups(rowsToSave);
      
      setRows(rowsToSave);
      
      toast({
        title: 'Success',
        description: 'Property groups saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    } catch (error) {
      console.error('Error saving property groups:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateBillingAccounts = (rowId: string, accountIds: string[]) => {
    setRows(rows.map(row =>
      row.id === rowId ? { ...row, billingAccounts: accountIds } : row
    ));
  };

  const handlePropertySelection = async (ids: string[], rowId: string) => {
    const row = rows.find(r => r.id === rowId);
    
    setRows(rows.map(r => {
      if (r.id === rowId) {
        const updatedProperties = ids.map(id => ({
          id,
          percentage: 0
        }));

        // If revenue-based allocation, calculate percentages
        if (r.allocationType === 'revenue') {
          getRevenueAllocation(ids).then(allocations => {
            const updatedPropertiesWithRevenue = updatedProperties.map(prop => ({
              ...prop,
              percentage: allocations.find(a => a.propertyId === prop.id)?.percentage || 0
            }));

            setRows(rows.map(row => 
              row.id === rowId 
                ? { ...row, properties: updatedPropertiesWithRevenue }
                : row
            ));
          });
        }

        return {
          ...r,
          properties: updatedProperties,
          isExpanded: true
        };
      }
      return r;
    }));
  };

  // Show loading state
  if (isLoading) {
    return (
      <Center p={8}>
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box p={4} width="100%" height="100%" overflowY="auto">
      <Flex justify="space-between" align="center" px={4} py={2}>
        <Flex gap={4} align="center" width="300px">
          <IconButton
            aria-label="Add row"
            icon={<AddIcon />}
            size="xs"
            colorScheme="green"
            onClick={addNewRow}
          />
        </Flex>

        <Box width="300px" textAlign="right">
          <Button
            size="sm"
            color="white"
            background="green.600"
            onClick={handleSaveAll}
            isLoading={isSaving}
          >
            Save Changes
          </Button>
        </Box>
      </Flex>

      <Table variant="simple" width="100%">
        <Thead>
          <Tr>
            <Th width="40px"></Th>
            <Th width="20%">Property Group Name</Th>
            <Th width="20%">Allocation Type</Th>
            <Th width="30%">Properties</Th>
            <Th width="30%">Billing Accounts</Th>
            <Th width="40px"></Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map(row => (
            <>
              <Tr 
                key={row.id}
                css={{
                  backgroundColor: row.isExpanded ? 'var(--chakra-colors-gray-50)' : undefined,
                  'input, .chakra-select__control, [role="button"]': {
                    backgroundColor: 'white !important'
                  }
                }}
              >
                <Td>
                  <IconButton
                    aria-label="Delete group"
                    icon={<MinusIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => deleteRow(row.id)}
                  />
                </Td>
                <Td>
                  <Input
                    value={row.name}
                    onChange={(e) => updateGroupName(row.id, e.target.value)}
                    placeholder="Enter group name"
                    size="md"
                  />
                </Td>
                <Td>
                  <Select
                    size="md"
                    value={row.allocationType || 'custom'}
                    onChange={(e) => {
                      const newType = e.target.value as 'custom' | 'revenue';
                      if (newType === 'revenue' && row.properties.length > 0) {
                        getRevenueAllocation(row.properties.map(p => p.id))
                          .then(allocations => {
                            setRows(rows.map(r => {
                              if (r.id === row.id) {
                                return {
                                  ...r,
                                  allocationType: newType,
                                  properties: r.properties.map(prop => ({
                                    ...prop,
                                    percentage: allocations.find(a => a.propertyId === prop.id)?.percentage || 0
                                  }))
                                };
                              }
                              return r;
                            }));
                          });
                      }
                      setRows(rows.map(r => 
                        r.id === row.id 
                          ? { ...r, allocationType: newType }
                          : r
                      ));
                    }}
                  >
                    <option value="custom">Custom Allocation</option>
                    <option value="revenue">Revenue-Based</option>
                  </Select>
                </Td>
                <Td>
                  <PropertySelect
                    selectedProperties={row.properties.map(p => p.id)}
                    properties={properties}
                    onChange={(ids) => handlePropertySelection(ids, row.id)}
                    placeholder="Add properties"
                    isMulti
                    size="md"
                    width="100%"
                  />
                </Td>
                <Td>
                  <BillingAccountSelect
                    selectedAccounts={row.billingAccounts}
                    onChange={(ids) => updateBillingAccounts(row.id, ids)}
                    billingAccounts={billingAccounts}
                    isMulti
                    showSelectAll={true}
                    size="md"
                    placeholder="Add billing accounts"
                    width="100%"
                  />
                </Td>
                <Td>
                  <IconButton
                    aria-label="Toggle row"
                    icon={row.isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleRow(row.id)}
                  />
                </Td>
              </Tr>
              <Tr>
                <Td colSpan={5} p={0}>
                  <Collapse in={row.isExpanded}>
                    <Box 
                      p={4} 
                      bg="white"
                      borderWidth="0 1px 1px 1px"
                      borderStyle="solid"
                      borderColor="green.100"
                      borderBottomRadius="md"
                      backgroundColor="white"
                      maxHeight="400px"
                      overflowY="auto"
                    >
                      <HStack align="stretch" spacing={4} height="100%" py={1}>
                        {/* Property Allocations Section */}
                        <Box flex={1} width="14vw">
                          <VStack align="stretch" spacing={4}>
                            <HStack spacing={0}>
                              <Text 
                                width="20vw"
                                fontFamily="heading"
                                textTransform="uppercase"
                                letterSpacing="wider"
                                textAlign="start"
                                fontSize="xs"
                                ml={10}
                              >
                                Property
                              </Text>
                              <Text 
                                width="20vw"
                                fontFamily="heading"
                                textTransform="uppercase"
                                letterSpacing="wider"
                                textAlign="start"
                                fontSize="xs"
                                ml={6}
                              >
                                Percent Allocated
                              </Text>
                            </HStack>
                            {row.properties.map(prop => {
                              const propertyDetails = properties.find(p => p.id === prop.id);
                              return (
                                <HStack key={prop.id} spacing={4}>
                                  <Text fontSize="sm" ml={10} width="20vw">
                                    {propertyDetails?.name} 
                                  </Text>
                                  <HStack width="10vw" spacing={2}>
                                    <NumberInput
                                      value={prop.percentage}
                                      onChange={(_, value) => 
                                        updatePropertyPercentage(row.id, prop.id, value)
                                      }
                                      min={0}
                                      max={100}
                                      width="5vw"
                                    >
                                      <NumberInputField />
                                    </NumberInput>
                                    <Text>%</Text>
                                  </HStack>
                                </HStack>
                              );
                            })}
                          </VStack>
                        </Box>

                        <Divider 
                          orientation="vertical" 
                          height="auto"
                          borderColor="gray.200"
                          borderWidth="1px"
                          alignSelf="stretch"
                          mx={4}
                          my={-4}
                        />

                        {/* Billing Categories Section */}
                        <Box flex={1}>
                          <VStack align="stretch" spacing={3}>
                            <Text 
                              fontFamily="heading"
                              textTransform="uppercase"
                              letterSpacing="wider"
                              textAlign="start"
                              fontSize="xs"
                            >
                              Billing Categories
                            </Text>
                            {row.billingAccounts?.map(accountId => {
                              const account = billingAccounts?.find(a => a.id === accountId);
                              return account ? (
                                <HStack key={accountId} spacing={4}>
                                  <Text fontSize="sm">
                                    {account.name} ({account.glcode})
                                  </Text>
                                </HStack>
                              ) : null;
                            })}
                            {(!row.billingAccounts || row.billingAccounts.length === 0) && (
                              <Text color="gray.500" fontSize="sm">
                                No billing categories selected
                              </Text>
                            )}
                          </VStack>
                        </Box>
                      </HStack>
                    </Box>
                  </Collapse>
                </Td>
              </Tr>
            </>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};
