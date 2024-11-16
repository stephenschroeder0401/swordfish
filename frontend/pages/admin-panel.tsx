// @ts-nocheck
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Select,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Center,
  Text,
  VStack,
  Icon,
  IconButton,
  Checkbox,
} from '@chakra-ui/react';
import {
  supabase,
  fetchAllBillingAccounts,
  fetchAllEmployees,
  fetchAllBillingProperties,
  fetchAllBillingPeriods,
  fetchAllEntities,
  saveEmployeeAllocations,
  fetchEmployeeAllocations,
  fetchAllBillingAccountsNoPagination,
} from '@/app/utils/supabase-client';
import { FiDatabase, FiPieChart } from 'react-icons/fi';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

type ColumnConfig = {
  visible: boolean;
  displayName?: string;
  width?: string;
  type?: 'text' | 'boolean' | 'decimal';
};

type TableConfig = {
  [columnName: string]: ColumnConfig;
};

export const TABLE_CONFIG: Record<string, TableConfig> = {
  billing_account: {
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
    rate: {
      visible: true,
      displayName: 'Hourly Rate ($)',
      type: 'decimal'
    },
    isbilledback: {
      visible: true,
      displayName: 'Billed Back',
      type: 'boolean'
    },
    client_id: { visible: false },
  },
};

// Helper function to filter visible columns
export const getVisibleColumns = (tableName: string): string[] => {
  const tableConfig = TABLE_CONFIG[tableName];
  if (!tableConfig) return [];
  
  return Object.entries(tableConfig)
    .filter(([_, config]) => config.visible)
    .map(([columnName]) => columnName);
};

// Helper to get display name for a column
export const getColumnDisplayName = (tableName: string, columnName: string): string => {
  return TABLE_CONFIG[tableName]?.[columnName]?.displayName || columnName;
};

const AdminPanel = () => {
  const [billingAccounts, setBillingAccounts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [properties, setProperties] = useState([]);
  const [billingPeriods, setBillingPeriods] = useState([]);
  const [entities, setEntities] = useState([]);
  const [selectedTable, setSelectedTable] = useState('billing_account');
  const [tableData, setTableData] = useState([]);
  const [newRow, setNewRow] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAddRowDisabled, setIsAddRowDisabled] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [allocations, setAllocations] = useState({});
  const toast = useToast();
  const [pageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSection, setSelectedSection] = useState('data');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use the no-pagination version for dropdowns
        const accountsData = await fetchAllBillingAccountsNoPagination();
        setBillingAccounts(accountsData);
        
        const employeeData = await fetchAllEmployees();
        setEmployees(employeeData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setBillingAccounts([]);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    console.log(newRow);
    const addRowDisabled = Object.keys(newRow).length === 0 || Object.values(newRow).some((value: string) => !value.trim());
    setIsAddRowDisabled(addRowDisabled);
  }, [newRow]);

  const handleTableChange = async (event) => {
    const tableName = event.target.value;
    setSelectedTable(tableName);
  
    if (tableName === 'employee_time_allocation') {
      try {
        const { data, error } = await supabase
          .from('employee_time_allocation')
          .select(`
            id,
            employee_id,
            category_id,
            percentage
          `);
        if (error) throw error;
        setTableData(data || []);
        
        // Initialize newRow for employee time allocation
        setNewRow({
          employee_id: '',
          category_id: '',
          percentage: ''
        });
      } catch (error) {
        console.error('Error fetching employee time allocations:', error);
        setTableData([]);
        setNewRow({});
      }
    } else {
      // Define which columns to select based on the table name
      const selectColumns = tableName === 'billing_account' ? 'id, glcode, name' : '*';
    
      try {
        const { data, error } = await supabase.from(tableName).select(selectColumns);
        if (error) throw error;
        setTableData(data || []);
    
        // Initialize newRow with keys for all columns (excluding 'id' if present)
        if (data.length > 0) {
          const newRowInit = {};
          Object.keys(data[0]).forEach(key => {
            if (key !== 'id') newRowInit[key] = '';
          });
          setNewRow(newRowInit);
        } else {
          // If no data is present, clear newRow
          setNewRow({});
        }
      } catch (error) {
        console.error(`Error fetching data from ${tableName}:`, error);
        setTableData([]);
        setNewRow({});
      }
    }
  };
  

  const handleInputChange = (event, index, column) => {
    console.log(event.target.value);

    const updatedData = [...tableData];
    updatedData[index][column] = event.target.value;
    setTableData(updatedData);
  };

  const handleNewRowInputChange = (event, column) => {
    setNewRow({
      ...newRow,
      [column]: event.target.value,
    });
  };

  const handleAddRow = () => {
    const emptyRow = { 
      id: uuidv4(),
      name: '',
      glcode: '',
      description: '',
      rate: '',
      isbilledback: false,
      client_id: 'fc6b5a65-19bd-4419-9c14-5479b3d24f77'
    };
    setTableData([emptyRow, ...tableData]);
  };

  const handleDeleteRow = (index) => {
    setTableData(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      // Validate all required fields are filled
      const visibleColumns = getVisibleColumns(selectedTable);
      const hasEmptyFields = tableData.some(row => 
        visibleColumns.some(column => {
          // Skip validation for rate field
          if (column === 'rate') return false;
          
          // For boolean fields, false is a valid value
          if (TABLE_CONFIG[selectedTable][column].type === 'boolean') {
            return row[column] === undefined || row[column] === null;
          }
          // For other fields, empty string or null/undefined is invalid
          return !row[column] || row[column].toString().trim() === '';
        })
      );

      if (hasEmptyFields) {
        toast({
          title: "Validation Error",
          description: "All fields except Hourly Rate are required. Please fill in all empty fields.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsLoading(false);
        return;
      }

      // Clean and format the data before saving
      const dataToSave = tableData.map(row => ({
        ...row,
        rate: row.rate ? parseFloat(row.rate.toString().replace(/[^0-9.]/g, '')) : null,
        isbilledback: !!row.isbilledback  // Ensure boolean
      }));
      
      const { data, error } = await supabase.from(selectedTable).upsert(dataToSave, {
        onConflict: 'id'
      });
      if (error) throw error;
      if (data) {
        setTableData(data);
        toast({
          title: "Success",
          description: "Changes saved successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployeeChange = async (event) => {
    const employeeId = event.target.value;
    setSelectedEmployee(employeeId);
    
    try {
      const employeeAllocations = await fetchEmployeeAllocations(employeeId);
      setAllocations({
        ...allocations,
        [employeeId]: employeeAllocations
      });
    } catch (error) {
      console.error('Error fetching employee allocations:', error);
      toast({
        title: "Error fetching allocations",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAddAllocation = (employeeId) => {
    const newAllocation = { account: '', percentage: '' };
    setAllocations({
      ...allocations,
      [employeeId]: [...(allocations[employeeId] || []), newAllocation],
    });
  };

  const handleAllocationChange = (employeeId, index, field, value) => {
    const updatedAllocations = { ...allocations };
    updatedAllocations[employeeId][index][field] = value;
    setAllocations(updatedAllocations);
  };

  const handleDeleteAllocation = (employeeId, index) => {
    const updatedAllocations = { ...allocations };
    updatedAllocations[employeeId].splice(index, 1);
    setAllocations(updatedAllocations);
  };

  const handleSaveAllocations = async () => {
    setIsLoading(true);
    try {
      console.log('allocations');
      console.log(allocations);
      const formattedAllocations = Object.entries(allocations).reduce((acc, [employeeId, employeeAllocations]) => {
        acc[employeeId] = employeeAllocations.map(allocation => (
          {
          billing_account: allocation.billing_account, // Changed from 'category' to 'billing_account'
          percentage: allocation.percentage
        }));
        return acc;
      }, {});

      console.log("Formatted allocations:", formattedAllocations);
      await saveEmployeeAllocations(formattedAllocations);
      toast({
        title: "Allocations saved",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving allocations:', error);
      toast({
        title: "Error saving allocations",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmployeeDropdown = (value, onChange) => {
    console.log('Rendering employee dropdown. Current employees:', employees);
    return (
      <Select
        placeholder="Select Employee"
        value={value || ''}
        onChange={onChange}
      >
        {employees.length > 0 ? (
          employees.map(employee => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))
        ) : (
          <option disabled>No employees available</option>
        )}
      </Select>
    );
  };

  console.log('tableData:', tableData);

  const handleTabChange = async (index: number) => {
    const tables = ['billing_account', 'employee', 'property', 'billing_period', 'entity'];
    if (index < tables.length) {
      const tableName = tables[index];
      setSelectedTable(tableName);
      setIsTableLoading(true);
      try {
        let data, count;

        switch(tableName) {
          case 'billing_account':
            const accResult = await fetchAllBillingAccounts(currentPage, pageSize);
            data = accResult.data?.map(({ id, client_id, name, glcode, description, rate, isbilledback }) => ({
              id,
              client_id,
              name,
              glcode,
              description,
              rate: rate ?? '',
              isbilledback
            }));
            count = accResult.count;
            
            // Initialize newRow with only visible fields
            setNewRow({
              name: '',
              glcode: '',
              description: '',
              rate: '',
              isbilledback: false
            });
            break;
          case 'property':
            const { data: propData, count: propCount } = await supabase
              .from('property')
              .select(`
                id,
                name,
                code,
                address,
                unit,
                entityid,
                entity (
                  name
                )
              `, { count: 'exact' })
              .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);
            
            data = propData?.map(({ id, name, code, address, unit, entity }) => ({
              name,
              code,
              address,
              unit,
              entity: entity?.name || 'Unknown Entity',
              _id: id
            }));
            count = propCount;
            
            // Initialize newRow with only visible fields
            setNewRow({
              name: '',
              code: '',
              address: '',
              unit: '',
              entity: ''
            });
            break;
          case 'employee':
            // For now, no pagination on employees
            const empData = await fetchAllEmployees();
            data = empData;
            count = empData.length;
            break;
          case 'billing_period':
            // For now, no pagination on billing periods
            const periodData = await fetchAllBillingPeriods();
            data = periodData;
            count = periodData.length;
            break;
          case 'entity':
            // For now, no pagination on entities
            const entityData = await fetchAllEntities();
            data = entityData;
            count = entityData.length;
            break;
        }
        
        setTableData(data || []);
        setTotalCount(count);
        
        if (data && data.length > 0) {
          const newRowInit = {};
          Object.keys(data[0]).forEach(key => {
            if (!key.startsWith('_')) newRowInit[key] = '';
          });
          setNewRow(newRowInit);
        }
      } catch (error) {
        console.error(`Error fetching ${tableName}:`, error);
      } finally {
        setIsTableLoading(false);
      }
    }
  };

  useEffect(() => {
    if (selectedTable) {
      const tables = ['billing_account', 'employee', 'property', 'billing_period', 'entity'];
      handleTabChange(tables.indexOf(selectedTable));
    }
  }, [currentPage]);

  const renderEmployeeAllocations = () => {
    return (
      <Box>
        {renderEmployeeDropdown(selectedEmployee, handleEmployeeChange)}
        
        {selectedEmployee && (
          <Box mt={4}>
            <Accordion allowMultiple>
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    Time Allocations
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel>
                  {allocations[selectedEmployee]?.map((allocation, index) => (
                    <Flex key={index} gap={4} mb={4}>
                      <Select
                        value={allocation.billing_account}
                        onChange={(e) => handleAllocationChange(selectedEmployee, index, 'billing_account', e.target.value)}
                      >
                        <option value="">Select Account</option>
                        {billingAccounts.map(account => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                      </Select>
                      <Input
                        type="number"
                        value={allocation.percentage}
                        onChange={(e) => handleAllocationChange(selectedEmployee, index, 'percentage', e.target.value)}
                        placeholder="Percentage"
                      />
                      <Button
                        colorScheme="red"
                        onClick={() => handleDeleteAllocation(selectedEmployee, index)}
                      >
                        Delete
                      </Button>
                    </Flex>
                  ))}
                  <Button
                    mt={2}
                    onClick={() => handleAddAllocation(selectedEmployee)}
                  >
                    Add Allocation
                  </Button>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
            
            <Button
              mt={4}
              colorScheme="blue"
              onClick={handleSaveAllocations}
              isLoading={isLoading}
            >
              Allocations
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  useEffect(() => {
    // Trigger initial load of billing accounts
    handleTabChange(0); // 0 is the index for billing accounts tab
  }, []); // Empty dependency array means this runs once on mount

  return (
    <Box h="100vh" display="flex" flexDirection="column" overflow="hidden">
      {/* Fixed Header */}
      <Flex 
        bg="white" 
        borderBottom="1px" 
        borderColor="gray.200" 
        p={4}
        h="7vh"
        alignItems="center"
        pb="3vh"
      >
        <Heading as="h1" size="lg">
          Configuration
        </Heading>
      </Flex>

      {/* Fixed Navigation and Content Area */}
      <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
        <Tabs 
          variant="enclosed" 
          onChange={(index) => setSelectedSection(index === 0 ? 'data' : 'allocations')}
          display="flex"
          flexDirection="column"
          h="100%"
          sx={{
            '.chakra-tabs__tab[aria-selected=true]': {
              color: 'green.700',
              borderColor: 'green.700',
              borderBottomColor: 'transparent'
            },
            '.chakra-tabs__tab:hover': {
              color: 'green.600'
            },
            '.chakra-tabs__tab-panel': {
              padding: 0
            }
          }}
        >
          <TabList height="5vh">
            <Tab py={1} fontSize="lg">Data Management</Tab>
            <Tab py={1} fontSize="lg">Allocations</Tab>
          </TabList>
          <TabPanels flex="1" overflow="hidden">
            <TabPanel h="100%" p={0}>
              {/* Data Management Content */}
              <Tabs 
                variant="line" 
                onChange={handleTabChange}
                display="flex"
                flexDirection="column"
                h="100%"
                sx={{
                  '.chakra-tabs__tab[aria-selected=true]': {
                    color: 'green.700',
                    borderColor: 'green.700'
                  },
                  '.chakra-tabs__tab:hover': {
                    color: 'green.600'
                  }
                }}
              >
                <TabList height="5vh">
                  <Tab py={1} fontSize="sm">Billing Accounts</Tab>
                  <Tab py={1} fontSize="sm">Employees</Tab>
                  <Tab py={1} fontSize="sm">Properties</Tab>
                  <Tab py={1} fontSize="sm">Billing Periods</Tab>
                  <Tab py={1} fontSize="sm">Entities</Tab>
                </TabList>
                <TabPanels flex="1" overflow="hidden">
                  <TabPanel h="100%" overflowY="auto" padding={0}>
                    {renderTable('billing_account', {
                      tableData,
                      newRow,
                      handleNewRowInputChange,
                      handleAddRow,
                      isAddRowDisabled,
                      handleInputChange,
                      handleDeleteRow,
                      handleSaveChanges,
                      isLoading,
                      isTableLoading,
                      currentPage,
                      setCurrentPage,
                      totalCount,
                      pageSize
                    })}
                  </TabPanel>
                  <TabPanel h="100%" overflowY="auto" padding={0}>
                    {renderTable('employee', {
                      tableData,
                      newRow,
                      handleNewRowInputChange,
                      handleAddRow,
                      isAddRowDisabled,
                      handleInputChange,
                      handleDeleteRow,
                      handleSaveChanges,
                      isLoading,
                      isTableLoading,
                      currentPage,
                      setCurrentPage,
                      totalCount,
                      pageSize
                    })}
                  </TabPanel>
                  <TabPanel h="100%" overflowY="auto" padding={0}>
                    {renderTable('property', {
                      tableData,
                      newRow,
                      handleNewRowInputChange,
                      handleAddRow,
                      isAddRowDisabled,
                      handleInputChange,
                      handleDeleteRow,
                      handleSaveChanges,
                      isLoading,
                      isTableLoading,
                      currentPage,
                      setCurrentPage,
                      totalCount,
                      pageSize: 20
                    })}
                  </TabPanel>
                  <TabPanel h="100%" overflowY="auto" padding={0}>
                    {renderTable('billing_period', {
                      tableData,
                      newRow,
                      handleNewRowInputChange,
                      handleAddRow,
                      isAddRowDisabled,
                      handleInputChange,
                      handleDeleteRow,
                      handleSaveChanges,
                      isLoading,
                      isTableLoading,
                      currentPage,
                      setCurrentPage,
                      totalCount,
                      pageSize
                    })}
                  </TabPanel>
                  <TabPanel h="100%" overflowY="auto" padding={0}>
                    {renderTable('entity', {
                      tableData,
                      newRow,
                      handleNewRowInputChange,
                      handleAddRow,
                      isAddRowDisabled,
                      handleInputChange,
                      handleDeleteRow,
                      handleSaveChanges,
                      isLoading,
                      isTableLoading,
                      currentPage,
                      setCurrentPage,
                      totalCount,
                      pageSize
                    })}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </TabPanel>
            <TabPanel h="100%">
              <Box p={4}>
                {renderEmployeeAllocations()}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

// Update renderTable to remove its own scrolling container
const renderTable = (
  tableName: string,
  {
    tableData,
    newRow,
    handleNewRowInputChange,
    handleAddRow,
    isAddRowDisabled,
    handleInputChange,
    handleDeleteRow,
    handleSaveChanges,
    isLoading,
    isTableLoading,
    currentPage,
    setCurrentPage,
    totalCount,
    pageSize
  }
) => {
  return (
    <Box display="flex" flexDirection="column" height="100%" maxH="83vh">
      {/* Pagination Bar */}
      <Box 
        position="sticky"
        top={0}
        bg="white" 
        zIndex={2}
        borderBottom="1px"
        borderColor="gray.200"
        py={2}
      >
        <Flex justify="space-between" align="center" px={4}>
          <IconButton
            aria-label="Add row"
            icon={<AddIcon />}
            size="xs"
            colorScheme="green"
            onClick={handleAddRow}
          />

          <Flex justify="center" align="center" gap={4}>
            <IconButton
              size="sm"
              icon={<ChevronLeftIcon boxSize={5} />}
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              isDisabled={currentPage === 0}
              variant="ghost"
              aria-label="Previous page"
            />
            
            <Text fontSize="sm">
              Page {currentPage + 1} of {Math.ceil(totalCount / pageSize)} ({totalCount} rows)
            </Text>
            
            <IconButton
              size="sm"
              icon={<ChevronRightIcon boxSize={5} />}
              onClick={() => setCurrentPage(p => p + 1)}
              isDisabled={(currentPage + 1) * pageSize >= totalCount}
              variant="ghost"
              aria-label="Next page"
            />
          </Flex>

          <Button
            size="sm"
            color="white"
            background="green.600"
            onClick={handleSaveChanges}
            isLoading={isLoading}
            mr='3vw'
          >
            Save Changes
          </Button>
        </Flex>
      </Box>

      {/* Table Container */}
      <Box 
        overflowY="auto" 
        flex="1" 
        position="relative"
        pb="50vh"
        sx={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
          },
        }}
      >
        <Table variant="simple" size="sm">
          <Thead position="sticky" top={0} bg="white" zIndex={1}> {/* Made header sticky */}
            <Tr>
              <Th width="50px" px={2.5}></Th>
              {getVisibleColumns(tableName).map(column => (
                <Th key={column} px={2.5}>
                  {getColumnDisplayName(tableName, column)}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {tableData.map((row, index) => (
              <Tr key={row._id || index}>
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
                {getVisibleColumns(tableName).map(column => (
                  <Td key={column} px={2.5}>
                    {TABLE_CONFIG[tableName][column].type === 'boolean' ? (
                      <Checkbox
                        isChecked={row[column]}
                        onChange={(e) => handleInputChange(
                          { target: { value: e.target.checked } }, 
                          index, 
                          column
                        )}
                      />
                    ) : (
                      <Input
                        size="sm"
                        value={column === 'rate' ? `$ ${row[column] || ''}` : (row[column] || '')}
                        onChange={(e) => {
                          // For rate column, strip the $ and only pass the number
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
      </Box>
    </Box>
  );
};

export default AdminPanel;