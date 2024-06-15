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
  useToast
} from '@chakra-ui/react';
import {
  supabase,
  fetchAllBillingAccounts,
  fetchAllEmployees,
  fetchAllBillingProperties,
  fetchAllBillingPeriods,
  fetchAllEntities
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
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accounts = await fetchAllBillingAccounts();
        const employeeData = await fetchAllEmployees();
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

  console.log('tableData:', tableData);

  return (
    <Container maxW="container.xl" py={5}>
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
          <Table variant="simple">
            <Thead>
              <Tr>
                {tableData.length > 0 && ['actions', ...Object.keys(tableData[0])].map((column) => (
                  (column !== 'id' && column !== 'isbilledback') && <Th key={column}>{column}</Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                {tableData.length > 0 && ['actions', ...Object.keys(tableData[0])].map((column) => (
                  (column !== 'id' && column !== 'isbilledback' ) &&(
                    <Td key={column}>
                      {column === 'actions' ? (
                        <Button colorScheme="teal" onClick={handleAddRow} isDisabled={isAddRowDisabled}>
                          Add
                        </Button>
                      ) : column === 'entityid' ? (
                        <Select
                          placeholder="Select Entity"
                          onChange={(e) => handleNewRowInputChange(e, column)}
                          value={newRow[column] || ''}
                        >
                          {entities.map(entity => (
                            <option key={entity.id} value={entity.id}>{entity.name}</option>
                          ))}
                        </Select>
                      ) : 
                      selectedTable === 'billing_period' && (column === 'startdate' || column === 'enddate') ? (
                        <Input
                          type="date"
                          placeholder={`Enter ${column}`}
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
                    (column !== 'id' && column !== 'isbilledback') && (
                      <Td key={column}>
                        {column === 'actions' ? (
                          <Button colorScheme="red" onClick={() => handleDeleteRow(rowIndex)}>
                            Delete
                          </Button>
                        ) : column === 'entityid' ? (
                          <Select
                            placeholder="Select Entity"
                            onChange={(e) => handleInputChange(e, rowIndex, column)}
                            value={entities.find(entity => entity.id === row[column])?.id || ''}
                          >
                            {entities.map(entity => (
                              <option key={entity.id} value={entity.id}>{entity.name}</option>
                            ))}
                          </Select>
                        ) : 
                        selectedTable === 'billing_period' && (column === 'startdate' || column === 'enddate') ? (
                          <Input
                            type="date"
                            value={row[column] || ''}
                            onChange={(e) => handleInputChange(e, rowIndex, column)}
                          />
                        ) : (
                          <Input value={row[column] || ''} onChange={(e) => handleInputChange(e, rowIndex, column)} required />
                        )}
                      </Td>
                    )
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Container>
  );
};

export default AdminPanel;
