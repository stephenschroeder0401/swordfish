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
} from '@/app/utils/supabase-client';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accounts = await fetchAllBillingAccounts();
        const employeeData = await fetchAllEmployees();
        console.log('Fetched employees:', employeeData); // Log fetched employees
        const propertyData = await fetchAllBillingProperties();
        const periodData = await fetchAllBillingPeriods();
        const entityData = await fetchAllEntities();
        setBillingAccounts(accounts);
        setEmployees(employeeData);
        setProperties(propertyData);
        setBillingPeriods(periodData);
        setEntities(entityData);
      } catch (error) {
        console.error('Error fetching initial data', error);
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

  return (
    <Container maxW='5000px' py={5}>
      <Heading as="h1" size="xl" mb={6}>
        Admin Panel
      </Heading>
      <Select placeholder="Select Table" onChange={handleTableChange} mb={6}>
        <option value="billing_account">Billing Account</option>
        <option value="employee">Employee</option>
        <option value="property">Property</option>
        <option value="billing_period">Billing Period</option>
        <option value="entity">Entity</option>
      </Select>
      {selectedTable && (
        <Box>
          <Flex mb={4} justify="space-between">
            <Button onClick={handleSaveChanges} colorScheme="green" isLoading={isLoading}>
              Save Changes
            </Button>
          </Flex>
          {Array.isArray(tableData) && tableData.length > 0 ? (
            <Table variant="simple">
              <Thead>
                <Tr>
                  {['actions', ...Object.keys(tableData[0])].map((column) => (
                    (column !== 'id') && <Th key={column}>{column}</Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  {['actions', ...Object.keys(tableData[0])].map((column) => (
                    (column !== 'id') && (
                      <Td key={column}>
                        {column === 'actions' ? (
                          <Button colorScheme="teal" onClick={handleAddRow} isDisabled={isAddRowDisabled}>
                            Add
                          </Button>
                        ) : column === 'employee_id' ? (
                          renderEmployeeDropdown(
                            newRow[column],
                            (e) => handleNewRowInputChange(e, column)
                          )
                        ) : column === 'category_id' ? (
                          <Select
                            placeholder="Select Category"
                            value={newRow[column] || ''}
                            onChange={(e) => handleNewRowInputChange(e, column)}
                          >
                            {billingAccounts.map(account => (
                              <option key={account.id} value={account.id}>{account.name}</option>
                            ))}
                          </Select>
                        ) : column === 'percentage' ? (
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter percentage"
                            value={newRow[column] || ''}
                            onChange={(e) => handleNewRowInputChange(e, column)}
                          />
                        ) : (
                          <Input
                            placeholder={`Enter ${column}`}
                            value={newRow[column] || ''}
                            onChange={(e) => handleNewRowInputChange(e, column)}
                          />
                        )}
                      </Td>
                    )
                  ))}
                </Tr>
                {tableData.map((row, rowIndex) => (
                  <Tr key={rowIndex}>
                    {['actions', ...Object.keys(row)].map((column) => (
                      (column !== 'id') && (
                        <Td key={column}>
                          {column === 'actions' ? (
                            <Button colorScheme="red" onClick={() => handleDeleteRow(rowIndex)}>
                              Delete
                            </Button>
                          ) : column === 'employee_id' ? (
                            renderEmployeeDropdown(
                              row[column],
                              (e) => handleInputChange(e, rowIndex, column)
                            )
                          ) : column === 'category_id' ? (
                            <Select
                              value={row[column] || ''}
                              onChange={(e) => handleInputChange(e, rowIndex, column)}
                            >
                              {billingAccounts.map(account => (
                                <option key={account.id} value={account.id}>{account.name}</option>
                              ))}
                            </Select>
                          ) : column === 'percentage' ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={row[column] || ''}
                              onChange={(e) => handleInputChange(e, rowIndex, column)}
                            />
                          ) : (
                            <Input value={row[column] || ''} onChange={(e) => handleInputChange(e, rowIndex, column)} />
                          )}
                        </Td>
                      )
                    ))}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Box>No data available for this table.</Box>
          )}
        </Box>
      )}
      
      <Heading as="h2" size="lg" mt={8} mb={4}>
        Employee Allocations
      </Heading>
      <Select placeholder="Select Employee" onChange={handleEmployeeChange} mb={4}>
        {employees.map(employee => (
          <option key={employee.id} value={employee.id}>{employee.name}</option>
        ))}
      </Select>
      
      {selectedEmployee && (
        <Accordion allowMultiple>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  Allocations for {employees.find(e => e.id === selectedEmployee)?.name}
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              {allocations[selectedEmployee]?.map((allocation, index) => (
                <Flex key={index} mb={2} alignItems="center">
                  <Select
                    placeholder="Select Billing Account"
                    value={allocation.billing_account} // Changed from allocation.category
                    onChange={(e) => handleAllocationChange(selectedEmployee, index, 'billing_account', e.target.value)}
                    mr={4}
                    width="400px"
                  >
                    {billingAccounts.map(account => (
                      <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    placeholder="%"
                    value={allocation.percentage}
                    onChange={(e) => handleAllocationChange(selectedEmployee, index, 'percentage', e.target.value)}
                    mr={1}
                    width="80px"
                  />
                  %
                  <Button ml={8} colorScheme="red" onClick={() => handleDeleteAllocation(selectedEmployee, index)}>
                    Delete
                  </Button>
                </Flex>
              ))}
              <Button mt={2} onClick={() => handleAddAllocation(selectedEmployee)}>
                Add Allocation
              </Button>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}
      
      <Button mt={4} colorScheme="blue" onClick={handleSaveAllocations} isLoading={isLoading}>
        Save Allocations
      </Button>
    </Container>
  );
};

export default AdminPanel;