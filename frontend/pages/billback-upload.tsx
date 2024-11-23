// @ts-nocheck
import React, { useEffect, useState, useRef } from "react";
import { Select, useToast, Box, Button, Container, Flex, Heading, Spinner, Card, FormControl, FormLabel, SimpleGrid,IconButton, Center, Text } from "@chakra-ui/react";
import BillbackDisplay from "@/components/table/billback-table";
import CSVUpload from "@/components/file-upload/upload";
import { v4 as uuidv4 } from 'uuid';
import { useBillingPeriod } from "@/contexts/BillingPeriodContext"; 
import { AddIcon } from "@chakra-ui/icons"
import { saveJobs, fetchAllBillingAccountsNoPagination, fetchAllBillingProperties, fetchAllEmployees, upsertBillbackUpload, fetchBillbackUpload, fetchAllBillingPeriods, fetchAllEntities, fetchAllBillingPropertiesNoPagination } from "@/app/utils/supabase-client";

const BillBack = () => {
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const mileageRate = 0.65;
  const [isValid, setIsValid] = useState(false);
  const { billingPeriod } = useBillingPeriod(); 
  const [isLoading, setIsLoading] = useState(false);
  const [billingAccounts, setBillingAccounts] = useState([]);
  const [billingProperties, setBillingProperties] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [billbackData, setBillbackData] = useState([]);
  const toast = useToast();
  const [entities, setEntities] = useState([]);

  const calculateTotals = (hours, rate, mileage) => {
    const laborTotal = (hours * rate).toFixed(2);
    const mileageTotal = (mileage * mileageRate).toFixed(2);
    const jobTotal = ((parseFloat(laborTotal) + parseFloat(mileageTotal)).toFixed(2));
    return { laborTotal, mileageTotal, jobTotal };
  };

  useEffect(() => {
    const checkIsValid = () => {
      const allValid = billbackData.every(row => !row.isError);
      setIsValid(allValid);
    };

    checkIsValid();
  }, [billbackData]);

  const loadDependencies = async () => {
    console.log("LOADING DEPS");
    setIsLoading(true);
    try {
      const accounts = await fetchAllBillingAccountsNoPagination();
      const properties = await fetchAllBillingPropertiesNoPagination();
      const employeeData = await fetchAllEmployees();
      setBillingAccounts(accounts);
      setBillingProperties(properties);
      setEmployees(employeeData);
      console.log("LOADED DEPS");
    } catch (error) {
      console.error("Error fetching initial data", error);
    }
    console.log("LOADED DEPS dONE");
    setIsLoading(false);
  };

  // Effect to load dependencies
  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    setSelectedFile(null);
    const fetchBillbackData = async () => {
      if (!billingPeriod || !billingAccounts.length || !billingProperties.length || !employees.length) {
        return;  // Ensure all dependencies are loaded
      }

      setIsLoading(true);
      setBillbackData([]);
      try {
        console.log("GETTING NEW DATA for billing period ", billingPeriod);  
        const data = await fetchBillbackUpload(billingPeriod);
        console.log(data);
        if (!data || data.upload_data.length < 1) {
          setBillbackData([]);
        }
        else{
          const uploadData = data?.upload_data || [];
          handleDataProcessed(uploadData);
        }
      } catch (error) {
        console.error("Error fetching billback data for billing period", error);
        setBillbackData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillbackData();
  }, [billingPeriod, billingAccounts, billingProperties, employees]);

  const addRow = () => {
    const newRow = {
        employeeId: "",
        employee: "",
        job_date: new Date().toISOString().split('T')[0],
        propertyId: "",
        property: "",
        entityId: "",
        entity: "",
        billingAccountId: "",
        category: "",
        startTime: "",
        endTime: "",
        hours: 0,
        rate: 0,
        total: 0,
        billedmiles: 0,
        mileageTotal: 0,
        jobTotal: 0,
        notes: "",
        isError: false,
        isManual: true
    };
    setBillbackData([newRow, ...billbackData]);
    console.log(billbackData);
  };

  const handleClearData =() =>{
    setBillbackData([]);
    setSelectedFile(null);
  }

  const handleDataProcessed = (newData) => {
    
    setIsLoading(true);

    console.log(newData);

    const billingJobs = newData.map((job) => {
      if(!!job){
      
      const billingAccount = billingAccounts.find((account) => account.name === job.category);
      const billingProperty = billingProperties.find((property) => property.name === job.property);

      const employee = employees.find((employee) => employee.name === job.employee);

      const rate = employee ? employee.rate : 0;

      const milage = (job.mileage && !isNaN(Number(job.mileage))) ? Number(job.mileage) 
                : (job.billedmiles && !isNaN(Number(job.billedmiles))) ? Number(job.billedmiles) 
                : 0;


      const { laborTotal, mileageTotal, jobTotal } = calculateTotals(job.hours, rate, milage);

      const isError = !(billingAccount && billingProperty);

    
      
      return {
        rowId: uuidv4(),
        employeeId: employee ? employee.id : undefined,
        employee: employee ? employee.name : job.employee,
        job_date: job.date ? job.date : job.job_date,
        propertyId: billingProperty ? billingProperty.id : undefined,
        property: billingProperty ? billingProperty.name : job.property,
        entityId: billingProperty ? billingProperty.entityid : undefined,
        entity: billingProperty ? billingProperty.entityName : "Not Found",
        billingAccountId: billingAccount ? billingAccount.id : undefined,
        category: billingAccount ? billingAccount.name : job.category,
        startTime: job.clockedInAt,
        endTime: job.clockedOutAt,
        hours: job.hours,
        rate: rate,
        total: laborTotal,
        billedmiles: milage,
        mileageTotal: mileageTotal,
        jobTotal: jobTotal,
        notes: job.notes,
        isError: isError,
        isManual: false
      };
    }
    });

    setBillbackData((prevBillbackData) => [...prevBillbackData, ...billingJobs]);
    setIsLoading(false);

  };
  const handleDelete = (e, key) => {
    console.log(key);
    console.log(billbackData);
    const newData = billbackData.filter(item => item.rowId !== key);
    setBillbackData(newData);
  };
  


  const handleEdit = (event, key, column, tableType) => {
    console.log('handling edit..');
    const newData = [...billbackData];
    let editedValue = event.target.value;

    // Find the index of the item using the key
    const index = newData.findIndex(item => item.rowId === key);
    if (index === -1) {
        console.error('Item not found');
        return; // Exit if item not found
    }

    if ((column === 'hours' || column === 'rate') && editedValue !== '') {
      editedValue = Number(editedValue);
    }

    newData[index] = {
      ...newData[index],
      [column]: editedValue
    };

    const { laborTotal, mileageTotal, jobTotal } = calculateTotals(newData[index].hours, newData[index].rate, newData[index].billedmiles);
    newData[index] = {
      ...newData[index],
      total: laborTotal,
      jobTotal: jobTotal,
      mileageTotal: mileageTotal
    };

    if (column === 'property') {
      const updatedRow = newData[index];
      const property = billingProperties.find(property => property.id === editedValue);
      if (property) {
        newData[index] = {
          ...updatedRow,
          propertyId: property.id,
          property: property.name,
          entity: property.entityName
        };
      }
    }

    if (column === 'category') {
      const updatedRow = newData[index];
      const billingAccount = billingAccounts.find(account => account.id === editedValue);
      if (billingAccount) {
        newData[index] = {
          ...updatedRow,
          billingAccountId: billingAccount.id,
          category: billingAccount.name
        };
      }
    }

    if (column === 'employee') {
      const updatedRow = newData[index];
      const employee = employees.find(employee => employee.id === editedValue);
      if (employee) {
        newData[index] = {
          ...updatedRow,
          employeeId: employee.id,
          employee: employee.name,
          rate: employee.rate
        };
      }
    }

    console.log("UPDATE ROW");
    const updatedRow = newData[index];
    console.log(updatedRow);
    const entity = billingProperties.find(property => property.id === updatedRow.propertyId);
    const account = billingAccounts.find(account => account.id === updatedRow.billingAccountId);

    const inError = !(account && entity);

    console.log("IS ERROR", inError);

    newData[index] = {
      ...updatedRow,
      isError: inError
    };

    setBillbackData(newData);
    
    console.log('edit handled');
};



  const tableConfig = [
    { column: "delete", label: "", canSort: false },
    { column: "employee", label: "Employee", canSort: false },
    { column: "job_date", label: "Date", canSort: false },
    { column: "property", label: "Property", canSort: false },
    { column: "entity", label: "Entity", canSort: false, canEdit: false },
    { column: "category", label: "Category", canSort: false },
    { column: "hours", label: "Hours", canSort: false, canEdit: true },
    { column: "rate", label: "Rate", canSort: false, canEdit: true },
    { column: "total", label: "Labor Total", canSort: false },
    { column: "billedmiles", label: "Mileage", canSort: false },
    { column: "mileageTotal", label: "Mileage Total", canSort: false },
    { column: "jobTotal", label: "Job Total", canSort: false },
    { column: "notes", label: "Notes", canSort: false, canEdit: false },
  ];

  const handleSaveProgress = async (notify:boolean) => {
    setIsLoading(true);
    try {
      await upsertBillbackUpload(billbackData, billingPeriod);
      setIsLoading(false);
      if(notify){
      toast({
        title: "Success",
        description: "Progress has been saved",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom-right"
      });
    }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save jobs. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right"
      });
      console.error("Error saving jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await saveJobs(billbackData, billingPeriod);
      setIsLoading(false);
      await handleSaveProgress(false);
      toast({
        title: "Success",
        description: "Jobs saved for billing period",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom-right"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save jobs. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right"
      });
      console.error("Error saving jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch entities first
        const fetchedEntities = await fetchAllEntities();
        console.log('Fetched entities:', fetchedEntities); // Debug log
        setEntities(fetchedEntities || []); // Ensure we set an empty array if null/undefined
        
        // ... other fetch calls ...
      } catch (error) {
        console.error("Error fetching data:", error);
        setEntities([]); // Set empty array on error
      }
    };

    fetchData();
  }, []);

  // Add debug log to check entities before passing to component
  console.log('Current entities:', entities);

  return (
    <Box width="100%" overflowX="hidden">
      <Container maxW='100%' px={0} py={2}>
        <SimpleGrid mt={5}columns={2}>
          <Flex direction="row" alignItems="flex-center" justifyContent="flex-start" >
          <Card size="md" type="outline" mt={5} ml={7} p={4} minWidth='250px' width='18vw'>
            <FormControl>
              <FormLabel color="gray.800" fontWeight={600} mb={1}>Timero Upload:</FormLabel>
              <CSVUpload
                style={{ width: '180px' }}
                disabled={!billingPeriod}
                onDataProcessed={handleDataProcessed}
                setLoading={setIsLoading}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}  
               />
            </FormControl>
          </Card>
          </Flex>
          <Flex minWidth={'250px'} direction="row" alignItems="flex-start" justifyContent="flex-end" >
          <Heading color="gray.700" mt={4} ml={1} mr={5}>
            Billback Upload
          </Heading>
          </Flex>
        </SimpleGrid>

        <SimpleGrid mt={5} columns={2}>
        <Flex direction="row" alignItems="flex-end" justifyContent="flex-start" height="100%">
        <IconButton
          onClick={addRow}
          colorScheme="white"
          size="md"
          width="4vw"
          icon={<AddIcon size="large" color="green.400" _hover={{color:"green.200", transform: 'scale(1.2)'}}/>}
          aria-label="Add Row"
          mb={-2}
          
        />
        <Text color={'red.400'} _hover={{
                color: 'red.700',
                transform: 'scale(1.1)',
                cursor: 'pointer'
              }}
              onClick={handleClearData}>
         CLEAR FILTERS
        </Text>
        </Flex>
        <Flex mr={8} direction="row" alignItems="flex-end" justifyContent="flex-end" height="100%">
          <Button
            onClick={handleSaveProgress}
            size="md"
            colorScheme="gray"
            isDisabled={!billingPeriod}
            mr={4}  
            minWidth='9vw'
          >
            Save Progress
          </Button>
          <Button
            onClick={handleSubmit}
            size="md"
            colorScheme="green"
            bg={'green.500'}
            isLoading={false}
            isDisabled={!isValid}
            mt={2}
            minWidth='9vw'
          >
            Invoice Jobs
          </Button>
        </Flex>
        </SimpleGrid>
      </Container>

      <Box
        width="100%"
        overflowX="auto"
        border="1px"
        borderColor="gray.200"
        borderRadius="lg"
        mt={2}
        mb={155}
      >
        {/* {isLoading ? (
          <Center height="100vh">
            <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="blue.500" size="xl" />
          </Center>
        ) : ( */}
          <Box minWidth="100%" width="fit-content">
            <BillbackDisplay
              tableConfig={tableConfig}
              data={billbackData}
              handleSort={() => {}}
              sortField={'something'}
              sortDirection={'up'}
              handleEdit={handleEdit}
              tableType="billback"
              accounts={billingAccounts || []}
              properties={billingProperties || []}
              employees={employees || []}
              entities={entities}
              handleDelete={handleDelete}
            />
          </Box>
        {/* )} */}
      </Box>
    </Box>
  );
};

export default BillBack;