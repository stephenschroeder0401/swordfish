// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Select, useToast, Box, Button, Container, Flex, Heading, Spacer, Card, FormControl, FormLabel, SimpleGrid,IconButton  } from "@chakra-ui/react";
import BillbackDisplay from "@/components/table/billback-table";
import CSVUpload from "@/components/file-upload/upload";
import { useBillingPeriod } from "@/contexts/BillingPeriodContext"; 
import { AddIcon } from "@chakra-ui/icons"
import { saveJobs, fetchAllBillingAccounts, fetchAllBillingProperties, fetchAllEmployees, upsertBillbackUpload, fetchBillbackUpload, fetchAllBillingPeriods } from "@/app/utils/supabase-client";
import { color } from "framer-motion";

const BillBack = () => {
  const mileageRate = 0.65;
  const [isValid, setIsValid] = useState(false);
  const { billingPeriod } = useBillingPeriod(); 
  const [sortCriteria, setSortCriteria] = useState("start_time");
  const [sortDirection, setSortDirection] = useState("AscNullsFirst");
  const [isLoading, setIsLoading] = useState(false);
  const [billingAccounts, setBillingAccounts] = useState([]);
  const [billingProperties, setBillingProperties] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [billbackData, setBillbackData] = useState([]);
  const toast = useToast();

  const calculateTotals = (hours, rate, mileage) => {
    console.log("CALCULATE TOTALS " + hours + " " + rate + " "+ mileage)
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accounts = await fetchAllBillingAccounts();
        const employeeData = await fetchAllEmployees();
        const billingProperties = await fetchAllBillingProperties();
        setBillingAccounts(accounts);
        setEmployees(employeeData);
        setBillingProperties(billingProperties);
      } catch (error) {
        console.error("Error fetching initial data", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchBillbackData = async () => {
      if (billingPeriod) {
        try {
          const data = await fetchBillbackUpload(billingPeriod);
          if(data.upload_data)
            setBillbackData(data.upload_data); // Set to empty array if data is not an array
        } catch (error) {
          console.error("Error fetching billback data for billing period", error);
          setBillbackData([]); // Ensure state is still an array on error
        }
      }
    };
  
    fetchBillbackData();
  }, [billingPeriod]);
  

  

  const addRow = () => {
    const newRow = {
        employeeId: "",
        employee: "",
        job_date: "",
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

  const handleDataProcessed = (newData) => {
    const billingJobs = newData.map((job) => {
      const billingAccount = billingAccounts.find((account) => account.name === job.category);
      const billingProperty = billingProperties.find((property) => property.name === job.property);

      console.log("Employees");
      console.log(job.employee);
      console.log(employees);

      const employee = employees.find((employee) => employee.name === job.employee);

      

      const { laborTotal, mileageTotal, jobTotal } = calculateTotals(job.hours, employee.rate, job.mileage);

      const isError = !(billingAccount && billingProperty);

      return {
        employeeId: employee ? employee.id : undefined,
        employee: employee ? employee.name : job.employee + "Not found",
        job_date: job.date,
        propertyId: billingProperty ? billingProperty.id : undefined,
        property: billingProperty ? billingProperty.name : job.property,
        entityId: billingProperty ? billingProperty.entityid : undefined,
        entity: billingProperty ? billingProperty.entityName : "Not Found",
        billingAccountId: billingAccount ? billingAccount.id : undefined,
        category: billingAccount ? billingAccount.name : job.category,
        startTime: job.clockedInAt,
        endTime: job.clockedOutAt,
        hours: job.hours,
        rate: employee.rate,
        total: laborTotal,
        billedmiles: job.mileage,
        mileageTotal: mileageTotal,
        jobTotal: jobTotal,
        notes: job.notes,
        isError: isError,
        isManual: false
      };
    });

    setBillbackData((prevBillbackData) => [...prevBillbackData, ...billingJobs]);


  };
  const handleDelete = (e, index) => {
    const newData = [...billbackData].filter((_, i) => i !== index);
    setBillbackData(newData);
  };

  const handleEdit = (event, index, column, tableType) => {
    const newData = [...billbackData];
    let editedValue = event.target.value;

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

  return (

    <Container maxW='5000px' py={2}>
      <SimpleGrid mt={5}columns={2}>
        <Flex direction="row" alignItems="flex-center" justifyContent="flex-start" >
        <Card size="md" type="outline" mt={5} ml={7} p={4} minWidth='250px' width='18vw'>
          <FormControl>
            <FormLabel color="gray.800" fontWeight={600} mb={1}>Timero Upload:</FormLabel>
            <CSVUpload style={{ width: '180px' }} disabled={!billingPeriod} onDataProcessed={handleDataProcessed} />
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
          bg={'green.400'}
          isLoading={isLoading}
          isDisabled={!isValid}
          mt={2}
          minWidth='9vw'
        >
          Invoice Jobs
        </Button>
      </Flex>
      </SimpleGrid>

      <Box
        border="1px"
        borderColor="gray.200"
        borderRadius="lg"
        mt={2}
        mb={155}
        overflow="auto" 
      >
        <BillbackDisplay
          tableConfig={tableConfig}
          data={billbackData}
          handleSort={() => {}}
          sortField={sortCriteria}
          sortDirection={sortDirection}
          handleEdit={handleEdit}
          tableType="billback"
          accounts={billingAccounts}
          properties={billingProperties}
          employees={employees}
          handleDelete={handleDelete}
        />
      </Box>
    </Container>
  );
};

export default BillBack;



