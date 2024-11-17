import { useState, useEffect } from 'react';
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
import { supabase } from '@/app/utils/supabase-client';
import { v4 as uuidv4 } from 'uuid';

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

const TEMP_CLIENT_ID = 'fc6b5a65-19bd-4419-9c14-5479b3d24f77';

interface PropertiesTabProps {
  entities: any[]; // Replace 'any' with your entity type if you have one
}

const PropertiesTab = ({ entities }: PropertiesTabProps) => {
  const [tableData, setTableData] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(40);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load initial data and handle search
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (debouncedSearchTerm) {
          const { data: searchData, count: searchCount } = await supabase
            .from('property')
            .select(`
              id,
              name,
              code,
              unit,
              entityid
            `, { count: 'planned' })
            .range(0, pageSize - 1)
            .or(`name.ilike.%${debouncedSearchTerm}%,code.ilike.%${debouncedSearchTerm}%`);
          
          setTableData(searchData || []);
          setTotalCount(searchCount || 0);
          setHasMore((searchData?.length || 0) < (searchCount || 0));
        } else {
          const { data: regularData, count: regularCount } = await supabase
            .from('property')
            .select(`
              id,
              name,
              code,
              unit,
              entityid
            `, { count: 'planned' })
            .range(0, pageSize - 1);
          
          setTableData(regularData || []);
          setTotalCount(regularCount || 0);
          setHasMore((regularData?.length || 0) < (regularCount || 0));
        }
      } catch (error) {
        console.error('Error loading properties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [debouncedSearchTerm, pageSize]);

  const loadMoreData = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = Math.ceil(tableData.length / pageSize);
      let query = supabase
        .from('property')
        .select(`
          id,
          name,
          code,
          unit,
          entityid
        `, { count: 'planned' })
        .range(nextPage * pageSize, (nextPage + 1) * pageSize - 1);

      if (debouncedSearchTerm) {
        query = query.or(`name.ilike.%${debouncedSearchTerm}%,code.ilike.%${debouncedSearchTerm}%`);
      }

      const { data: newData, count: totalItems } = await query;

      if (newData?.length) {
        setTableData(prev => [...prev, ...newData]);
        setHasMore(tableData.length + newData.length < totalItems);
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
      entity_id: '',
      client_id: TEMP_CLIENT_ID
    };
    setTableData([emptyRow, ...tableData]);
  };

  const handleDeleteRow = (index) => {
    setTableData(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('property').upsert(tableData);
      if (error) throw error;
      // Reload data after save
      const { data, count } = await supabase
        .from('property')
        .select('*', { count: 'planned' })
        .range(0, pageSize - 1);
      
      setTableData(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error saving changes:', error);
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
