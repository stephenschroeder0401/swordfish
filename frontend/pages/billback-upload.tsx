// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Select, useToast, Box, Button, Container, Flex, Heading, Spacer, Card, FormControl, FormLabel, SimpleGrid } from "@chakra-ui/react";
import BillbackDisplay from "@/components/table/billback-table";
import CSVUpload from "@/components/file-upload/upload";
import { saveJobs, fetchAllBillingAccounts, fetchAllBillingProperties, fetchAllEmployees, upsertBillbackUpload, fetchBillbackUpload, fetchAllBillingPeriods } from "@/app/utils/supabase-client";

const BillBack = () => {
  const mileageRate = 0.65;
  const [isValid, setIsValid] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState(null);
  const [billingPeriods, setBillingPeriods] = useState([]);
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
        const billingPeriods = await fetchAllBillingPeriods();
        setBillingAccounts(accounts);
        setEmployees(employeeData);
        setBillingProperties(billingProperties);
        setBillingPeriods(billingPeriods);
      } catch (error) {
        console.error("Error fetching initial data", error);
      }
    };

    fetchData();
  }, []);

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

  const handleBillingPeriodChange = (event) => {
    setBillingPeriod(event.target.value);
    
    fetchBillbackUpload(event.target.value).then((data) => { 
      if (data) {
        setBillbackData(data.upload_data);
      } else {
        setBillbackData([]);
      }
    });
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

    const uniqueEmployees = Array.from(new Set(newData.map(item => item.employee)));

    const matchingEmployees = employees.filter(employee => uniqueEmployees.some(uniqueEmployee => uniqueEmployee === employee.name))
      .map(employee => ({
        employeeId: employee.id,
        employee: employee.name,
        rate: 0
      }));

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

  const handleSaveProgress = async () => {
    setIsLoading(true);
    try {
      await upsertBillbackUpload(billbackData, billingPeriod);
      toast({
        title: "Success",
        description: "Jobs have been successfully saved for billing period",
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

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await saveJobs(billbackData, billingPeriod);
      toast({
        title: "Success",
        description: "Jobs have been successfully saved.",
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
    <Container maxW='5000px' py={5}>
      <Heading as="h1" size="xl" mb={6}>
        Billback Upload
      </Heading>
      <Card size="md" type="outline" style={{
  padding: '16px',
  minWidth: '300px', // Ensures Card does not shrink below 300px
  margin: '16px',
  width: '20vw', // Keeps Card responsive but no smaller than 300px
}}>
  {/* Billing Period Selection */}
  <FormControl>
    <FormLabel htmlFor="billing-period-select" mb={1}>Billing Period:</FormLabel>
    <Flex alignItems="center">
    <Select
  id="billing-period-select"
  size="md"
  width='200px'
  style={{
    display: 'inline-block', // Ensures the select behaves correctly in flow
    boxSizing: 'border-box' // Ensures padding and borders are included in the width
  }}
  placeholder="Select Billing Period"
  onChange={handleBillingPeriodChange}
  value={billingPeriod?.id}
>
        {billingPeriods.map((period) => (
          <option key={period.id} value={period.id}>
            {period.enddate}
          </option>
        ))}
      </Select>
    </Flex>
  </FormControl>

  {/* CSV Upload */}
  <FormControl mt={4}>
    <FormLabel fontWeight mb={1}>Timero Upload:</FormLabel>
    <CSVUpload style={{ width: '180px' }} disabled={!billingPeriod} onDataProcessed={handleDataProcessed} />
  </FormControl>
</Card>

      <SimpleGrid mt={10} columns={2}>
      <Flex direction="row" alignItems="flex-start" justifyContent="flex-start" height="100%">
        <Button onClick={addRow} colorScheme="blue" size="md" mt={2} ml={4}>
          Add Row
          </Button>
      </Flex>
      <Flex direction="row" alignItems="flex-end" justifyContent="flex-end" height="100%">
        <Button
          onClick={handleSaveProgress}
          size="md"
          colorScheme="gray"
          isDisabled={!billingPeriod}
          mr={4}
        >
          Save Progress
        </Button>
        <Button
          onClick={handleSubmit}
          size="md"
          colorScheme="blue"
          isLoading={isLoading}
          isDisabled={!isValid}
          mt={2}
          mr={4}
        >
          Invoice Jobs
        </Button>
      </Flex>
      </SimpleGrid>

      <Box
        overflowX="scroll"
        border="1px"
        borderColor="gray.200"
        borderRadius="lg"
        mt={2}
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



