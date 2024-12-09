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

interface Property {
  id: string;
  name: string;
  code: string;
}

interface PropertyGroupRow {
  id: string;
  name: string;
  isExpanded: boolean;
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
        setRows(groups);
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

  // Show loading state
  if (isLoading) {
    return (
      <Center p={8}>
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box p={4} width="100%">
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
            <Th width="25%">Property Group Name</Th>
            <Th width="35%">Properties</Th>
            <Th width="35%">Billing Accounts</Th>
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
                  <PropertySelect
                    selectedProperties={row.properties.map(p => p.id)}
                    properties={properties}
                    onChange={(ids) => {
                      console.log('Selected property IDs:', ids);
                      console.log('All available properties:', properties);
                      console.log('Properties for this row:', row.properties);
                      
                      // Update the row's properties based on the new selection
                      setRows(rows.map(r => {
                        if (r.id === row.id) {
                          // Keep existing properties that are still selected
                          const updatedProperties = r.properties.filter(p => 
                            ids.includes(p.id)
                          );
                          
                          // Add new properties with 0 percentage
                          const newProperties = ids
                            .filter(id => !r.properties.find(p => p.id === id))
                            .map(id => {
                              const property = properties.find(p => p.id === id);
                              console.log('Adding new property:', property);
                              return { id, percentage: 0 };
                            });

                          const finalProperties = [...updatedProperties, ...newProperties];
                          console.log('Final properties array:', finalProperties);
                          
                          // If we're adding the first property, expand the row
                          const shouldExpand = r.properties.length === 0 && finalProperties.length > 0;
                          
                          return {
                            ...r,
                            properties: finalProperties,
                            isExpanded: shouldExpand ? true : r.isExpanded
                          };
                        }
                        return r;
                      }));
                    }}
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
