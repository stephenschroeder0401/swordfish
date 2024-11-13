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

const AdminPanel = () => {
  const [billingAccounts, setBillingAccounts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [properties, setProperties] = useState([]);
  const [billingPeriods, setBillingPeriods] = useState([]);
  const [entities, setEntities] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
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
    if (Object.values(newRow).some(value => !value)) {
      toast({
        title: "Unable to add row",
        description: "Please fill in all fields before adding a new row.",
        status: "error",
        duration: 5000,
        isClosable: true
      });
      return;
    }

    const newRowWithId = { ...newRow, id: uuidv4() };
    setTableData([newRowWithId, ...tableData]);
    setNewRow({});
  };

  const handleDeleteRow = (index) => {
    setTableData(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);

    try {
      console.log('Saving changes:', tableData);
      const { data, error } = await supabase.from(selectedTable).upsert(tableData, {
        onConflict: 'id'
      });
      if (error) throw error;
      if (data) setTableData(data);
    } catch (error) {
      console.error('Error saving changes:', error);
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
          case 'property':
            const propResult = await fetchAllBillingProperties(currentPage, pageSize);
            data = propResult.data;
            count = propResult.count;
            break;
          case 'billing_account':
            const accResult = await fetchAllBillingAccounts(currentPage, pageSize);
            data = accResult.data;
            count = accResult.count;
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
            if (key !== 'id') newRowInit[key] = '';
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
              Save Allocations
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box h="100vh" display="flex" flexDirection="column" overflow="hidden">
      {/* Fixed Header */}
      <Flex 
        bg="white" 
        borderBottom="1px" 
        borderColor="gray.200" 
        p={10}
        h="36px"
        alignItems="center"
      >
        <Heading as="h1" size="lg">
          Admin Panel
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
        >
          <TabList h="32px">
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
              >
                <TabList h="32px">
                  <Tab py={1} fontSize="sm">Billing Accounts</Tab>
                  <Tab py={1} fontSize="sm">Employees</Tab>
                  <Tab py={1} fontSize="sm">Properties</Tab>
                  <Tab py={1} fontSize="sm">Billing Periods</Tab>
                  <Tab py={1} fontSize="sm">Entities</Tab>
                </TabList>
                <TabPanels flex="1" overflow="hidden">
                  <TabPanel h="calc(100vh - 180px)" overflowY="auto" padding={0}>
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
                    <Box maxH="calc(100vh - 200px)">
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
                    </Box>
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
  if (isTableLoading) {
    return (
      <Center py={10}>
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box>
      <Table variant="simple" size="sm">
        <Thead
          position="sticky"
          top={0}
          bg="white"
          zIndex={1}
          boxShadow="0 1px 3px rgba(0,0,0,0.1)"
        >
          <Tr>
            <Th width="50px" px={2.5}></Th>
            {tableData.length > 0 && 
              Object.keys(tableData[0]).map(column => (
                <Th key={column} px={2.5}>{column}</Th>
              ))
            }
          </Tr>
        </Thead>
        <Tbody>
          {/* New Row */}
          <Tr>
            <Td px={2.5}>
              <IconButton
                aria-label="Add row"
                icon={<AddIcon />}
                size="sm"
                colorScheme="green"
                onClick={handleAddRow}
                isDisabled={isAddRowDisabled}
                variant="ghost"
              />
            </Td>
            {Object.keys(newRow).map(column => (
              <Td key={column} px={2.5}>
                <Input
                  size="sm"
                  value={newRow[column] || ''}
                  onChange={(e) => handleNewRowInputChange(e, column)}
                />
              </Td>
            ))}
          </Tr>
          {/* Existing Rows */}
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
              {Object.keys(row).map(column => (
                <Td key={column} px={2.5}>
                  <Input
                    size="sm"
                    value={row[column] || ''}
                    onChange={(e) => handleInputChange(e, index, column)}
                  />
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
      
      {/* Pagination Controls */}
      <Flex justify="space-between" align="center" mt={4}>
        <Button
          size="sm"
          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
          isDisabled={currentPage === 0}
        >
          Previous
        </Button>
        
        <Text>
          Page {currentPage + 1} of {Math.ceil(totalCount / pageSize)}
        </Text>
        
        <Button
          size="sm"
          onClick={() => setCurrentPage(p => p + 1)}
          isDisabled={(currentPage + 1) * pageSize >= totalCount}
        >
          Next
        </Button>
      </Flex>

      <Button
        size="sm"
        mt={4}
        colorScheme="blue"
        onClick={handleSaveChanges}
        isLoading={isLoading}
      >
        Save Changes
      </Button>
    </Box>
  );
};

export default AdminPanel;