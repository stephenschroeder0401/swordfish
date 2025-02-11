import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Input,
  Select,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  IconButton,
  Spinner,
  Center,
  Text,
  Checkbox,
} from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import { fetchAllBillingAccounts, upsertBillingAccounts, deleteBillingAccount } from '@/lib/data-access/';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@chakra-ui/react';

const TABLE_CONFIG = {
  id: { visible: false },
  name: { 
    visible: true, 
    displayName: 'Account Name',
    width: '200px',
    type: 'text'
  },
  glcode: { 
    visible: true, 
    displayName: 'GL Code',
    type: 'text'
  },
  description: { 
    visible: true,
    displayName: 'Description',
    width: '300px',
    type: 'text'
  },
  billing_type: {
    visible: true,
    displayName: 'Billing Type',
    type: 'select',
    options: ['Hourly', 'Monthly']
  },
  rate: {
    visible: true,
    displayName: 'Rate ($)',
    type: 'decimal'
  },
  isbilledback: {
    visible: true,
    displayName: 'Billed Back',
    type: 'boolean'
  }
};

// Helper functions
const getVisibleColumns = (): string[] => {
  return Object.entries(TABLE_CONFIG)
    .filter(([_, config]) => config.visible)
    .map(([columnName]) => columnName);
};

const getColumnDisplayName = (columnName: string): string => {
  return TABLE_CONFIG[columnName]?.displayName || columnName;
};

const BillingAccountTab = () => {
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { data } = await fetchAllBillingAccounts(0, 1000);
        console.log('Received billing accounts:', data);
        setTableData(data || []);
      } catch (error) {
        console.error('Error loading billing accounts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleInputChange = (event, index, column) => {
    const updatedData = [...tableData];
    updatedData[index][column] = event.target.value;
    setTableData(updatedData);
  };

  const handleAddRow = () => {
    const emptyRow = { 
      id: uuidv4(),
      name: '',
      glcode: '',
      description: '',
      rate: '',
      isbilledback: false,
      billing_type: ''
    };
    setTableData([emptyRow, ...tableData]);
  };

  const handleDeleteRow = async (index) => {
    const row = tableData[index];
    
    // Only call delete if it's an existing record (has an ID)
    if (row.id) {
      setIsLoading(true);
      try {
        await deleteBillingAccount(row.id);
        setTableData(prev => prev.filter((_, i) => i !== index));
        
        toast({
          title: 'Success',
          description: 'Billing account deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top'
        });
      } catch (error) {
        console.error('Error deleting billing account:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top'
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // For new unsaved rows, just remove from UI
      setTableData(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      // Validate all required fields are filled
      const invalidRows = tableData.filter(row => 
        !row.name?.trim() || 
        !row.glcode?.trim() || 
        !row.description?.trim() ||
        !row.billing_type?.trim()
      );

      if (invalidRows.length > 0) {
        toast({
          title: 'Validation Error',
          description: 'All fields except Rate are required',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top'
        });
        setIsLoading(false);
        return;
      }

      // Ensure empty rates are set to 0
      const dataToSave = tableData.map(row => ({
        ...row,
        rate: row.rate || 0
      }));

      await upsertBillingAccounts(dataToSave);
      
      toast({
        title: 'Success',
        description: 'Billing accounts saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });

      // Reload the data
      const { data } = await fetchAllBillingAccounts(0, 1000);
      setTableData(data || []);
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box h="100%" display="flex" flexDirection="column" overflow="hidden">
      <Flex justify="space-between" align="center" px={4} py={2}>
        <Flex gap={4} align="center" width="300px">
          <IconButton
            aria-label="Add row"
            icon={<AddIcon />}
            size="xs"
            colorScheme="green"
            onClick={handleAddRow}
          />
        </Flex>

        <Text fontSize="sm" color="gray.600">
          {tableData.length} billing accounts
        </Text>

        <Box width="300px" textAlign="right">
          <Button
            size="sm"
            color="white"
            background="green.600"
            onClick={handleSaveChanges}
            isLoading={isLoading}
          >
            Save Changes
          </Button>
        </Box>
      </Flex>

      <Box 
        overflowY="auto" 
        flex="1" 
        position="relative"
        maxHeight="calc(100vh - 200px)"
        pb="100px"
      >
        {isLoading ? (
          <Center h="200px">
            <Spinner size="xl" />
          </Center>
        ) : (
          <Table variant="simple" size="sm">
            <Thead position="sticky" top={0} bg="white" zIndex={1}>
              <Tr>
                <Th width="50px" px={2.5} py={4}></Th>
                {getVisibleColumns().map(column => (
                  <Th key={column} px={2.5} py={4}>
                    {getColumnDisplayName(column)}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {tableData.map((row, index) => (
                <Tr key={row.id || index}>
                  <Td px={2.5}>
                    <IconButton
                      aria-label="Delete row"
                      icon={<MinusIcon />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDeleteRow(index)}
                      variant="ghost"
                    />
                  </Td>
                  {getVisibleColumns().map(column => (
                    <Td key={column} px={2.5}>
                      {TABLE_CONFIG[column].type === 'boolean' ? (
                        <Checkbox
                          isChecked={row[column]}
                          onChange={(e) => handleInputChange(
                            { target: { value: e.target.checked } }, 
                            index, 
                            column
                          )}
                        />
                      ) : TABLE_CONFIG[column].type === 'select' ? (
                        <Select
                          size="sm"
                          value={row[column] || ''}
                          onChange={(e) => handleInputChange(e, index, column)}
                        >
                          <option value="">Select...</option>
                          {TABLE_CONFIG[column].options.map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          size="sm"
                          value={column === 'rate' ? `$ ${row[column] || ''}` : (row[column] || '')}
                          onChange={(e) => {
                            if (column === 'rate') {
                              const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                              handleInputChange({ target: { value: numericValue } }, index, column);
                            } else {
                              handleInputChange(e, index, column);
                            }
                          }}
                          placeholder={column === 'rate' ? '$ ' : ''}
                        />
                      )}
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
    </Box>
  );
};

export default BillingAccountTab;
