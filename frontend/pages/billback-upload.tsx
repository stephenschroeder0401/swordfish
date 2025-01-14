// @ts-nocheck
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Select, useToast, Box, Button, Container, Flex, Heading, Image, Card, FormControl, FormLabel, SimpleGrid, IconButton, Center, Text, Tooltip } from "@chakra-ui/react";
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
import { FaExclamationTriangle } from 'react-icons/fa';

// Add a new type for clarity
type FileFormat = 'timero' | 'manual';

// Add format detection function
const detectFileFormat = (firstRow: any): FileFormat => {
  // Check object keys instead of trying to join array
  const headers = Object.keys(firstRow);
  
  if (headers.includes('Clocked In At') && headers.includes('Clocked Out At')) {
    return 'timero';
  }
  if (headers.includes('Minutes') && headers.includes('Task')) {
    return 'manual';
  }
  
  // If data is already transformed (from upload.tsx)
  if (firstRow.format === 'timero' || firstRow.format === 'manual') {
    return firstRow.format;
  }
  
  throw new Error('Unrecognized file format');
};

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const calculateTotals = (hours, laborRate, billingRate, mileage, isBilledBack = true) => {
    const laborTotal = (hours * laborRate).toFixed(2);
    const billingTotal = isBilledBack ? 
        ((hours * billingRate) || parseFloat(laborTotal)).toFixed(2) : 
        "0.00";
    const mileageTotal = (mileage * mileageRate).toFixed(2);
    const jobTotal = isBilledBack ? 
        ((parseFloat(billingTotal) + parseFloat(mileageTotal)).toFixed(2)) :
        "0.00";
    return { laborTotal, billingTotal, mileageTotal, jobTotal };
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
      console.log("Loaded billing accounts:", accounts); // Debug log
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
                const data = await fetchBillbackUpload(billingPeriod);
                
                if (!data || data.upload_data.length < 1) {
                    setBillbackData([]);
                } else {
                    const uploadData = data?.upload_data || [];
                    const processedData = uploadData.map(job => {
                        if(!!job) {
                            // Recheck billing account
                            const billingAccount = billingAccounts.find((account) => 
                                account.id === job.billingAccountId
                            );

                            // Recheck property/group
                            const isPropertyGroup = job.propertyId?.startsWith('group-');
                            let propertyGroup, billingProperty;
                            
                            if (isPropertyGroup) {
                                propertyGroup = propertyGroups.find(group => 
                                    `group-${group.id}` === job.propertyId
                                );
                            } else {
                                billingProperty = billingProperties.find((property) => 
                                    property.id === job.propertyId
                                );
                            }

                            // Update entity information if it's a property
                            const entityId = !isPropertyGroup ? billingProperty?.entityid : '';
                            const entityName = !isPropertyGroup ? billingProperty?.entityName : '';

                            // Recheck employee
                            const employee = employees.find((emp) => 
                                emp.id === job.employeeId
                            );

                            // Set isError based on current data
                            const isError = (!propertyGroup && !billingProperty) || !billingAccount || !employee;

                            return {
                                ...job,
                                property: propertyGroup?.name || billingProperty?.name || job.property,
                                entity: entityName || job.entity,
                                entityId: entityId || job.entityId,
                                employee: employee?.name || job.employee,
                                rate: employee?.rate || job.rate,
                                isError
                            };
                        }
                        return null;
                    }).filter(Boolean);

                    setBillbackData(processedData);
                    
                    // Check if any rows have errors
                    const hasErrors = processedData.some(row => row.isError);
                    setIsValid(!hasErrors);
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
}, [billingPeriod, billingAccounts, billingProperties, employees, propertyGroups]);

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
        billingRate: 0,
        total: 0,
        billedmiles: 0,
        mileageTotal: 0,
        jobTotal: 0,
        notes: "",
        isError: true,
        isManual: true
    };
    console.log("New row data:", newRow);
    setBillbackData([newRow, ...billbackData]);
    setHasUnsavedChanges(true);
    setIsValid(false);
    console.log("Updated billbackData after add:", billbackData);
  };

  const handleClearData =() =>{
    setBillbackData([]);
    setSelectedFile(null);
    setHasUnsavedChanges(true);
  }

  const handleDataProcessed = (newData) => {
    console.log("=== Processing New Data ===");
    console.log("First row:", newData[0]);
    setIsLoading(true);

    try {
      // Get first row to detect format
      const fileFormat = detectFileFormat(newData[0]);
      console.log("Detected format:", fileFormat);

      const billingJobs = newData.map((job) => {
        if (!job) return null;

        // Process based on format
        if (fileFormat === 'timero') {
          return processTimeroJob(job);
        } else {
          return processManualJob(job);
        }
      });

      console.log("All processed billingJobs:", billingJobs);
      setBillbackData((prevBillbackData) => {
        const newState = [...prevBillbackData, ...billingJobs];
        setHasUnsavedChanges(true);
        console.log("New combined billbackData:", newState);
        return newState;
      });
    } catch (error) {
      console.error("CSV Upload Error:", {
        error,
        data: newData[0]
      });
      // ... error handling ...
    }
    setIsLoading(false);
  };

  // Split processing logic
  const processTimeroJob = (job) => {
    // First check if the property name matches a property group
    const propertyGroup = propertyGroups.find(group => 
        group.name.toLowerCase() === job.property.toLowerCase()
    );
    
    const billingAccount = billingAccounts.find((account) => 
        account.name.toLowerCase() === job.category.toLowerCase()
    );
    
    // Only look for individual property if no matching group found
    const billingProperty = !propertyGroup ? billingProperties.find((property) => 
        property.name.toLowerCase() === job.property.toLowerCase()
    ) : null;
    
    const employee = employees.find((employee) => 
        employee.name.toLowerCase() === job.employee.toLowerCase()
    );
    
    const rate = employee ? (Number(employee.rate) || 0) : 0;
    const billingRate = billingAccount ? (Number(billingAccount.rate) || 0) : 0;
    
    const mileage = (() => {
        if (!job) return 0;
        const mileageValue = job.mileage || job.billedmiles || job.Mileage || '0';
        const parsedMileage = Number(mileageValue);
        return isNaN(parsedMileage) ? 0 : parsedMileage;
    })();

    const { laborTotal, billingTotal, mileageTotal, jobTotal } = calculateTotals(
        job.hours, 
        rate, 
        billingRate, 
        mileage
    );

    // If we found a property group, use its ID with 'group-' prefix
    const propertyId = propertyGroup 
        ? `group-${propertyGroup.id}`
        : (billingProperty?.id || '');

    return {
        rowId: uuidv4(),
        employeeId: employee?.id,
        employee: employee?.name || job.employee,
        job_date: job.date || job.job_date,
        propertyId: propertyId,
        property: propertyGroup?.name || billingProperty?.name || job.property,
        entityId: billingProperty?.entityid || '',
        entity: billingProperty?.entityName || '',
        billingAccountId: billingAccount?.id,
        category: billingAccount?.name || job.category,
        startTime: job.clockedInAt,
        endTime: job.clockedOutAt,
        hours: job.hours,
        rate,
        billingRate,
        total: laborTotal,
        billingTotal: billingTotal,
        mileageTotal,
        jobTotal,
        notes: job.notes,
        // Only mark as error if we have neither a property group nor a valid property
        isError: (!propertyGroup && !billingProperty) || !billingAccount,
        isManual: false
    };
  };

  const processManualJob = (job) => {
    const hours = Number(job.hours) || 0;
    
    const propertyGroup = propertyGroups.find(group => 
        group.name.toLowerCase() === job.property.toLowerCase()
    );
    
    const billingAccount = billingAccounts.find((account) => 
        account.name.toLowerCase() === job.category.toLowerCase()
    );
    
    const billingProperty = !propertyGroup ? billingProperties.find((property) => 
        property.name.toLowerCase() === job.property.toLowerCase()
    ) : null;
    
    const employee = employees.find((employee) => 
        employee.name.toLowerCase() === job.employee.toLowerCase()
    );
    
    const rate = employee ? (Number(employee.rate) || 0) : 0;
    const billingRate = billingAccount ? (Number(billingAccount.rate) || 0) : 0;
    
    const { laborTotal, billingTotal, mileageTotal, jobTotal } = calculateTotals(
        hours, 
        rate, 
        billingRate, 
        0
    );

    const propertyId = propertyGroup 
        ? `group-${propertyGroup.id}`
        : (billingProperty?.id || '');

    return {
        rowId: uuidv4(),
        employeeId: employee?.id,
        employee: employee?.name || job.employee,
        job_date: job.date,
        propertyId: propertyId,
        property: propertyGroup?.name || billingProperty?.name || job.property,
        entityId: billingProperty?.entityid || '',
        entity: billingProperty?.entityName || '',
        billingAccountId: billingAccount?.id || '',
        category: billingAccount?.name || job.category || '',
        startTime: null,
        endTime: null,
        hours,
        rate,
        billingRate,
        total: laborTotal,
        billingTotal: billingTotal,
        mileageTotal,
        jobTotal,
        notes: job.notes || '',
        isError: (!propertyGroup && !billingProperty) || !billingAccount,
        isManual: true
    };
  };

  const handleDelete = (e, key) => {
    console.log(key);
    console.log(billbackData);
    const newData = billbackData.filter(item => item.rowId !== key);
    setBillbackData(newData);
    setHasUnsavedChanges(true);
  };
  


  const handleEdit = async (e: any, rowId: string, field: string, tableType: string) => {
    setHasUnsavedChanges(true);
    
    setBillbackData(prevData =>
        prevData.map(row => {
            if (row.rowId === rowId) {
                let updatedRow = { ...row };
                
                if (field === 'property') {
                    const selectedPropertyId = e.target.value;
                    
                    // Check if it's a property group
                    const isPropertyGroup = selectedPropertyId.startsWith('group-');
                    let propertyGroup, billingProperty;
                    
                    if (isPropertyGroup) {
                        const groupId = selectedPropertyId.replace('group-', '');
                        propertyGroup = propertyGroups.find(group => group.id === groupId);
                        updatedRow = {
                            ...updatedRow,
                            propertyId: selectedPropertyId,
                            property: propertyGroup ? propertyGroup.name : '',
                            entityId: '', 
                            entity: '', // Just leave empty for property groups
                            isError: !propertyGroup || !row.billingAccountId
                        };
                    } else {
                        billingProperty = billingProperties.find(prop => prop.id === selectedPropertyId);
                        updatedRow = {
                            ...updatedRow,
                            propertyId: selectedPropertyId,
                            property: billingProperty ? billingProperty.name : '',
                            entityId: billingProperty?.entityid || '',
                            entity: billingProperty?.entityName || "Not Found",
                            isError: !billingProperty || !row.billingAccountId
                        };
                    }
                } else if (field === 'employee') {
                    const selectedEmployeeId = e.target.value;
                    const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
                    
                    updatedRow = {
                        ...updatedRow,
                        employeeId: selectedEmployeeId,
                        employee: selectedEmployee ? selectedEmployee.name : '',
                        rate: selectedEmployee ? Number(selectedEmployee.rate) : 0
                    };

                    // Recalculate totals with new employee rate
                    const { laborTotal, billingTotal, mileageTotal, jobTotal } = calculateTotals(
                        row.hours,
                        updatedRow.rate,
                        row.billingRate,
                        row.billedmiles,
                        billingAccounts.find(acc => acc.id === row.billingAccountId)?.isbilledback
                    );
                    
                    updatedRow = {
                        ...updatedRow,
                        total: laborTotal,
                        billingTotal: billingTotal,
                        mileageTotal: mileageTotal,
                        jobTotal: jobTotal
                    };
                } else if (field === 'category') {
                    const selectedAccountId = e.target.value;
                    const selectedAccount = billingAccounts.find(account => account.id === selectedAccountId);
                    
                    console.log("Category Edit Debug:", {
                        selectedAccountId,
                        selectedAccount,
                        currentCategory: row.category,
                        isPropertyGroup: row.propertyId?.startsWith('group-')
                    });
                    
                    // Debug logging
                    console.log("Selected Account:", selectedAccount);

                    const isBilledBack = selectedAccount?.isbilledback === true || selectedAccount?.isbilledback === 1;
                    const effectiveBillingRate = isBilledBack ? Number(selectedAccount?.rate) : 0;

                    updatedRow = {
                        ...updatedRow,
                        billingAccountId: selectedAccountId,
                        category: selectedAccount?.name || '',
                        billingRate: effectiveBillingRate,
                        isError: !selectedAccountId || !row.propertyId
                    };

                    const { laborTotal, billingTotal, mileageTotal, jobTotal } = calculateTotals(
                        row.hours,
                        row.rate,
                        effectiveBillingRate,
                        row.billedmiles,
                        isBilledBack
                    );
                    
                    updatedRow = {
                        ...updatedRow,
                        total: laborTotal,
                        billingTotal: billingTotal,
                        mileageTotal: mileageTotal,
                        jobTotal: jobTotal
                    };
                } else if (field === 'hours' || field === 'billedmiles') {
                    // Handle numeric fields
                    const numericValue = Number(e.target.value) || 0;
                    updatedRow = { ...row, [field]: numericValue };

                    // Recalculate totals
                    const { laborTotal, billingTotal, mileageTotal, jobTotal } = calculateTotals(
                        field === 'hours' ? numericValue : row.hours,
                        row.rate,
                        row.billingRate,
                        field === 'billedmiles' ? numericValue : row.billedmiles,
                        billingAccounts.find(acc => acc.id === row.billingAccountId)?.isbilledback
                    );
                    
                    updatedRow = {
                        ...updatedRow,
                        total: laborTotal,
                        billingTotal: billingTotal,
                        mileageTotal: mileageTotal,
                        jobTotal: jobTotal
                    };
                } else {
                    updatedRow = { ...row, [field]: e.target.value };
                }

                return updatedRow;
            }
            return row;
        })
    );
  };



  const tableConfig = [
    { column: "delete", label: "", canSort: false },
    { column: "employee", label: "Employee", canSort: false },
    { column: "job_date", label: "Date", canSort: false },
    { column: "property", label: "Property", canSort: false },
    { column: "entity", label: "Entity", canSort: false, canEdit: false },
    { column: "category", label: "Category", canSort: false },
    { column: "hours", label: "Hours", canSort: false },
    { column: "rate", label: "Labor Rate", canSort: false },
    { column: "billingRate", label: "Billing Rate", canSort: false, canEdit: false },
    { column: "total", label: "Labor Total", canSort: false, canEdit: false },
    { column: "billingTotal", label: "Billing Total", canSort: false, canEdit: false },
    { column: "billedmiles", label: "Mileage", canSort: false },
    { column: "mileageTotal", label: "Mileage Total", canSort: false, canEdit: false },
    { column: "jobTotal", label: "Job Total", canSort: false, canEdit: false },
    { column: "notes", label: "Notes", canSort: false, width: "800px" }
  ];

  const handleSaveProgress = async (notify:boolean) => {
    console.log("=== Saving Progress ===");
    console.log("Current billbackData being saved:", billbackData);
    setIsLoading(true);
    try {
        const result = await upsertBillbackUpload(billbackData, billingPeriod);
        console.log("Save result:", result);
        setHasUnsavedChanges(false);
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

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Create a callback for the save function
  const handleSave = useCallback((e?: KeyboardEvent) => {
    if (e) {
      e.preventDefault(); // Prevent browser's default save dialog
    }
    
    if (hasUnsavedChanges && billingPeriod) {
      handleSaveProgress(true);
    }
  }, [hasUnsavedChanges, billingPeriod]);

  // Add keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        handleSave(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  return (
    <Box width="100%" overflowX="hidden">
      <Container maxW='100%' px={0} py={2}>
        <SimpleGrid mt={5}columns={2}>
          <Flex direction="row" alignItems="flex-center" justifyContent="flex-start" >
          <Card size="md" type="outline" mt={5} ml={7} p={4} minWidth='250px' width='18vw'>
            <FormControl>
              <FormLabel color="gray.800" fontWeight={600} mb={1}>Timesheet Upload:</FormLabel>
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
        <Text 
          color={'red.400'} 
          _hover={{
            color: 'red.700',
            transform: 'scale(1.1)',
            cursor: 'pointer'
          }}
          onClick={handleClearData}
          ml={2}
        >
          CLEAR
        </Text>
        </Flex>
        <Flex mr={8} direction="row" alignItems="flex-end" justifyContent="flex-end" height="100%">
          <Flex direction="column" alignItems="flex-end">
            {hasUnsavedChanges && (
              <Text
                color="orange.500"
                fontSize="sm"
                mb={2}
                fontWeight="medium"
                display="flex"
                alignItems="center"
              >
                <FaExclamationTriangle style={{ marginRight: '8px' }} />
                You have unsaved changes
              </Text>
            )}
            <Tooltip 
              label={`Save changes (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+S)`}
              isDisabled={!hasUnsavedChanges || !billingPeriod}
            >
              <Button
                onClick={() => handleSave()}
                size="md"
                bg={hasUnsavedChanges ? "orange.400" : "gray.100"}
                color={hasUnsavedChanges ? "white" : "gray.800"}
                isDisabled={!billingPeriod || !hasUnsavedChanges}
                mr={4}  
                minWidth='9vw'
                transition="all 0.2s ease"
                _hover={hasUnsavedChanges ? {
                  transform: 'scale(1.05)',
                  bg: 'orange.500'
                } : {
                  bg: 'gray.200'
                }}
              >
                {hasUnsavedChanges ? "Save Changes" : "Save Progress"}
              </Button>
            </Tooltip>
          </Flex>
          <Button
            onClick={handleSubmit}
            size="md"
            colorScheme="green"
            bg={'green.500'}
            isLoading={false}
            isDisabled={!isValid || hasUnsavedChanges}
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
