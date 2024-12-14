// @ts-nocheck
import React, { useEffect, useState, useRef } from "react";
import { Select, useToast, Box, Button, Container, Flex, Heading, Image, Card, FormControl, FormLabel, SimpleGrid, IconButton, Center, Text } from "@chakra-ui/react";
import BillbackDisplay from "@/components/features/table/billback-table";
import CSVUpload from "@/components/ui/file-upload/upload";
import { v4 as uuidv4 } from 'uuid';
import { useBillingPeriod } from "@/contexts/BillingPeriodContext"; 
import { AddIcon } from "@chakra-ui/icons"
import { saveJobs, upsertBillbackUpload, fetchBillbackUpload } 
from "@/lib/data-access/supabase-client";
import { fetchAllEmployees, fetchAllProperties, fetchAllPropertiesNoPagination,
   fetchAllBillingPeriods, fetchAllBillingAccountsNoPagination, fetchAllEntities,
   fetchAllPropertyGroups
} from "@/lib/data-access";

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
  const [isUploading, setIsUploading] = useState(false);
  const [propertyGroups, setPropertyGroups] = useState([]);

  const calculateTotals = (hours, rate, mileage) => {
    console.log('mileage total: ', mileage);
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
    setIsLoading(true);
    try {
      const [accounts, properties, employeeData, groupsData] = await Promise.all([
        fetchAllBillingAccountsNoPagination(),
        fetchAllPropertiesNoPagination(),
        fetchAllEmployees(),
        fetchAllPropertyGroups()
      ]);
      setBillingAccounts(accounts);
      setBillingProperties(properties);
      setEmployees(employeeData);
      setPropertyGroups(groupsData);
    } catch (error) {
      console.error("Error fetching initial data", error);
    }
    setIsLoading(false);
  };

  // Effect to load dependencies
  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    console.log("=== Data Loading Flow ===");
    console.log("Dependencies:", {
        billingPeriod,
        billingAccountsLength: billingAccounts.length,
        billingPropertiesLength: billingProperties.length,
        employeesLength: employees.length
    });

    if (billingPeriod && billingAccounts.length && billingProperties.length && employees.length) {
      setSelectedFile(null);
      const fetchBillbackData = async () => {
        setIsLoading(true);
        setBillbackData([]);
        try {
          console.log("Fetching data from fetchBillbackUpload...");
          const data = await fetchBillbackUpload(billingPeriod);
          console.log("Raw data received:", data);
          
          if (!data || data.upload_data.length < 1) {
            console.log("No data found, setting empty array");
            setBillbackData([]);
          } else {
            console.log("Processing upload_data:", data.upload_data);
            const uploadData = data?.upload_data || [];
            setBillbackData(uploadData.map(job => {
                if(!!job){
                    console.log("Processing job:", job);
                    const billingAccount = billingAccounts.find((account) => account.name === job.category);
                    const billingProperty = billingProperties.find((property) => property.name === job.property);

                    const employee = employees.find((employee) => employee.name === job.employee);

                    const rate = employee ? employee.rate : 0;

                    const milage = (job.mileage && !isNaN(Number(job.mileage))) ? Number(job.mileage) 
                                : (job.billedmiles && !isNaN(Number(job.billedmiles))) ? Number(job.billedmiles) 
                                : 0;


                    const { laborTotal, mileageTotal, jobTotal } = calculateTotals(job.hours, rate, milage);

                    const isError = !(billingAccount && billingProperty);

                    console.log("Found employee: ", employee);
                    const result = {
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
                    console.log("Processed job result:", result);
                    return result;
                }
                return null;
            }).filter(Boolean));
          }
        } catch (error) {
          console.error("Error fetching billback data for billing period", error);
          setBillbackData([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchBillbackData();
    }
  }, [billingPeriod, billingAccounts, billingProperties, employees]);

  const addRow = () => {
    console.log("=== Adding New Row ===");
    const newRow = {
        rowId: uuidv4(),
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
    console.log("New row data:", newRow);
    setBillbackData([newRow, ...billbackData]);
    console.log("Updated billbackData after add:", billbackData);
  };

  const handleClearData =() =>{
    setBillbackData([]);
    setSelectedFile(null);
  }

  const handleDataProcessed = (newData) => {
    console.log("=== Processing New Data ===");
    console.log("Incoming newData:", newData);
    setIsLoading(true);

    const billingJobs = newData.map((job) => {
        if(!!job){
            console.log("Processing job:", job);
            const billingAccount = billingAccounts.find((account) => account.name === job.category);
            const billingProperty = billingProperties.find((property) => property.name === job.property);

            const employee = employees.find((employee) => employee.name === job.employee);

            const rate = employee ? employee.rate : 0;

            const milage = (job.mileage && !isNaN(Number(job.mileage))) ? Number(job.mileage) 
                        : (job.billedmiles && !isNaN(Number(job.billedmiles))) ? Number(job.billedmiles) 
                        : 0;


            const { laborTotal, mileageTotal, jobTotal } = calculateTotals(job.hours, rate, milage);

            const isError = !(billingAccount && billingProperty);

            console.log("Found employee: ", employee);
            const result = {
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
            console.log("Processed job result:", result);
            return result;
        }
    });

    console.log("All processed billingJobs:", billingJobs);
    console.log("Previous billbackData:", billbackData);
    setBillbackData((prevBillbackData) => {
        const newState = [...prevBillbackData, ...billingJobs];
        console.log("New combined billbackData:", newState);
        return newState;
    });
    setIsLoading(false);
  };
  const handleDelete = (e, key) => {
    console.log(key);
    console.log(billbackData);
    const newData = billbackData.filter(item => item.rowId !== key);
    setBillbackData(newData);
  };
  


  const handleEdit = async (e: any, rowId: string, field: string, tableType: string) => {
    console.log("Editing:", { value: e.target.value, rowId, field, tableType });
    
    if (field === 'property') {
        const value = e.target.value;
        if (!value.startsWith('group-')) {
            const selectedProperty = billingProperties.find(prop => prop.id === value);
            setBillbackData(prevData =>
                prevData.map(row =>
                    row.rowId === rowId
                        ? { 
                            ...row, 
                            propertyId: value,
                            property: selectedProperty ? selectedProperty.name : '',
                            entityId: selectedProperty ? selectedProperty.entityid : '',
                            entity: selectedProperty ? selectedProperty.entityName : '',
                            isError: !selectedProperty || !row.billingAccountId
                        }
                        : row
                )
            );
        } else {
            setBillbackData(prevData =>
                prevData.map(row =>
                    row.rowId === rowId
                        ? { 
                            ...row, 
                            propertyId: value,
                            property: '',
                            entityId: '',
                            entity: '',
                            isError: !row.billingAccountId
                        }
                        : row
                )
            );
        }
    } else if (field === 'category') {
        const selectedAccountId = e.target.value;
        const selectedAccount = billingAccounts.find(account => account.id === selectedAccountId);
        
        setBillbackData(prevData =>
            prevData.map(row => {
                if (row.rowId === rowId) {
                    const isPropertyGroup = row.propertyId?.startsWith('group-');
                    return { 
                        ...row, 
                        billingAccountId: selectedAccountId,
                        category: selectedAccount ? selectedAccount.name : '',
                        isError: isPropertyGroup ? !selectedAccountId : (!selectedAccountId || !row.propertyId)
                    };
                }
                return row;
            })
        );
    } else if (field === 'employee') {
        const selectedEmployeeId = e.target.value;
        const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
        
        setBillbackData(prevData =>
            prevData.map(row => {
                if (row.rowId === rowId) {
                    const newRow = { 
                        ...row, 
                        employeeId: selectedEmployeeId,
                        employee: selectedEmployee ? selectedEmployee.name : '',
                        rate: selectedEmployee ? selectedEmployee.rate : 0
                    };
                    const { laborTotal, mileageTotal, jobTotal } = calculateTotals(
                        newRow.hours, 
                        newRow.rate, 
                        newRow.billedmiles
                    );
                    return {
                        ...newRow,
                        total: laborTotal,
                        mileageTotal,
                        jobTotal
                    };
                }
                return row;
            })
        );
    } else if (field === 'hours' || field === 'rate' || field === 'billedmiles') {
        setBillbackData(prevData =>
            prevData.map(row => {
                if (row.rowId === rowId) {
                    const newRow = { 
                        ...row,
                        [field]: e.target.value
                    };
                    const { laborTotal, mileageTotal, jobTotal } = calculateTotals(
                        field === 'hours' ? parseFloat(e.target.value) : newRow.hours,
                        field === 'rate' ? parseFloat(e.target.value) : newRow.rate,
                        field === 'billedmiles' ? parseFloat(e.target.value) : newRow.billedmiles
                    );
                    return {
                        ...newRow,
                        total: laborTotal,
                        mileageTotal,
                        jobTotal
                    };
                }
                return row;
            })
        );
    } else {
        setBillbackData(prevData =>
            prevData.map(row =>
                row.rowId === rowId
                    ? { ...row, [field]: e.target.value }
                    : row
            )
        );
    }
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
    console.log("=== Saving Progress ===");
    console.log("Current billbackData being saved:", billbackData);
    setIsLoading(true);
    try {
        const result = await upsertBillbackUpload(billbackData, billingPeriod);
        console.log("Save result:", result);
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
        console.error("Detailed save error:", error);
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
    setIsUploading(true);
    try {
        console.log("Submitting jobs:", billbackData);
        await saveJobs(billbackData, billingPeriod, propertyGroups);
        toast({
            title: "Jobs saved successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
        });
    } catch (error) {
        console.error("Error saving jobs:", error);
        toast({
            title: "Error saving jobs",
            description: error.message,
            status: "error",
            duration: 5000,
            isClosable: true,
        });
    }
    setIsUploading(false);
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
  console.log('Current employees:', employees);

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
            Time Management
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
        {isLoading ? (
          <Center height="100vh">
            <Image
              src="/loading.gif"
              alt="Loading..."
              width="300px"
              height="300px"
            />
          </Center>
        ) : (
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
              propertyGroups={propertyGroups}
              handleDelete={handleDelete}
            />
          </Box>
        )}
      </Box>
      {isUploading && (
        <Center
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.300"
          zIndex={999}
        >
          <Image
            src="/loading.gif"
            alt="Loading..."
            width="100px"
            height="100px"
          />
        </Center>
      )}
    </Box>
  );
};

export default BillBack;