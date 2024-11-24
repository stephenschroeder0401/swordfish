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
  Select,
} from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import {fetchAllProperties, upsertProperties } from '@/lib/data-access';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@chakra-ui/react'; 

const TABLE_CONFIG = {
  id: { visible: false },
  name: { 
    visible: true, 
    displayName: 'Property Name',
    width: '200px',
    type: 'text'
  },
  code: { 
    visible: true, 
    displayName: 'Code',
    width: '100px',
    type: 'text'
  },
  unit: {
    visible: true,
    displayName: 'Unit',
    width: '100px',
    type: 'text'
  },
  entityid: {
    visible: true,
    displayName: 'Entity',
    width: '200px',
    type: 'select'
  },
  client_id: { visible: false }
};

// Helper function to filter visible columns
const getVisibleColumns = (): string[] => {
  return Object.entries(TABLE_CONFIG)
    .filter(([_, config]) => config.visible)
    .map(([columnName]) => columnName);
};

// Helper to get display name for a column
const getColumnDisplayName = (columnName: string): string => {
  return TABLE_CONFIG[columnName]?.displayName || columnName;
};

interface PropertiesTabProps {
  entities: any[]; // Replace 'any' with your entity type if you have one
}

const PropertiesTab = ({ entities }: PropertiesTabProps) => {
  console.log('Properties Tab entities:', entities);
  const [tableData, setTableData] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(40);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeout = useRef(null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Debounce effect with cleanup
  useEffect(() => {
    // Clear any pending timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    // Cleanup function
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm]);

  // Load initial data and handle search
  useEffect(() => {
    const loadData = async () => {
      setIsFilterLoading(true);
      try {
        const { data, count } = await fetchAllProperties(pageSize, 0);
        setTableData(data || []);
        setTotalCount(count || 0);
        setHasMore((data?.length || 0) < (count || 0));
      } catch (error) {
        console.error('Error loading properties:', error);
      } finally {
        setIsFilterLoading(false);
      }
    };

    loadData();
  }, [debouncedSearchTerm, pageSize]);

  const loadMoreData = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = Math.ceil(tableData.length / pageSize);
      const { data: newData, count } = await fetchAllProperties(
        pageSize, 
        nextPage * pageSize
      );

      if (newData?.length) {
        setTableData(prev => [...prev, ...newData]);
        setHasMore(tableData.length + newData.length < count);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleInputChange = (event, index, column) => {
    const updatedData = [...tableData];
    updatedData[index][column] = event.target.value;
    setTableData(updatedData);
  };

  const handleAddRow = () => {
    const emptyRow = { 
      id: uuidv4(),
      name: '',
      code: '',
      unit: '',
      entityid: ''
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
        !row.code?.trim() || 
        !row.entityid
      );

      if (invalidRows.length > 0) {
        toast({
          title: 'Validation Error',
          description: 'All properties must have a name, code, and entity selected',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top'
        });
        setIsLoading(false);
        return;
      }

      await upsertProperties(tableData);
      
      toast({
        title: 'Success',
        description: 'Properties saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });

      // Reload the current page
      const { data, count } = await fetchAllProperties(pageSize, 0);
      setTableData(data || []);
      setTotalCount(count || 0);
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
          <Input
            placeholder="Search properties..."
            size="sm"
            ref={inputRef}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
          />
          {isFilterLoading && <Spinner size="sm" />}  {/* Add spinner next to input */}
        </Flex>

        <Text fontSize="sm" color="gray.600">
          {tableData.length} / {totalCount} properties
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
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          if (
            target.scrollHeight - target.scrollTop <= target.clientHeight * 1.2 && 
            !isLoadingMore && 
            hasMore
          ) {
            loadMoreData();
          }
        }}
      >
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
                    {TABLE_CONFIG[column].type === 'select' ? (
                      <Select
                        size="sm"
                        value={row[column] || ''}
                        onChange={(e) => handleInputChange(e, index, column)}
                      >
                        <option value="">Select Entity</option>
                        {entities.map(entity => (
                          <option key={entity.id} value={entity.id}>
                            {entity.name}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        size="sm"
                        value={row[column] || ''}
                        onChange={(e) => handleInputChange(e, index, column)}
                      />
                    )}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>

        {isLoadingMore && (
          <Center 
            position="sticky" 
            bottom="50%" 
            width="100%" 
            py={4}
            bg="whiteAlpha.800"
          >
            <Spinner 
              size="lg" 
              color="green.500" 
              thickness="4px"
            />
          </Center>
        )}

        {(isLoadingMore || hasMore) && (
          <Box height="200px" />
        )}
      </Box>
    </Box>
  );
};

export default PropertiesTab;
