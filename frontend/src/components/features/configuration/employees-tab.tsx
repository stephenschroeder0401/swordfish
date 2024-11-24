import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Flex,
  Input,
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
} from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import { fetchAllEmployees, upsertEmployees} from '@/lib/data-access/';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@chakra-ui/react';

const TABLE_CONFIG = {
  id: { visible: false },
  name: { 
    visible: true, 
    displayName: 'Name',
    width: '200px',
    type: 'text'
  },
  email: { 
    visible: true, 
    displayName: 'Email',
    width: '250px',
    type: 'text'
  },
  rate: {
    visible: true,
    displayName: 'Hourly Rate ($)',
    type: 'decimal'
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

const EmployeesTab = () => {
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAllEmployees();
        setTableData(data || []);
      } catch (error) {
        console.error('Error loading employees:', error);
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
      email: '',
      rate: ''
    };
    setTableData([emptyRow, ...tableData]);
  };

  const handleDeleteRow = (index) => {
    setTableData(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      // Validate all rows before saving
      const invalidRows = tableData.filter(row => 
        !row.name?.trim() || 
        !row.email?.trim()
      );

      if (invalidRows.length > 0) {
        toast({
          title: 'Validation Error',
          description: 'All employees must have a name and email',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top'
        });
        setIsLoading(false);
        return;
      }

      await upsertEmployees(tableData);
      
      toast({
        title: 'Success',
        description: 'Employees saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });

      // Reload the data
      const data = await fetchAllEmployees();
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
          {tableData.length} employees
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

      <Box overflowY="auto" flex="1" position="relative">
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

export default EmployeesTab;
