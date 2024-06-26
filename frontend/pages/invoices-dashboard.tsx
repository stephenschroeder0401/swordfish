// @ts-nocheck

import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Input,
  Container,
  Heading,
  Button,
  Select,
  SimpleGrid
} from "@chakra-ui/react";

import TableDisplay from "@/components/table/table-display";
import { useBillingPeriod } from "@/contexts/BillingPeriodContext"; 

import { TableConfigItem } from "../src/app/types/table-config";
import { AppfolioLineItem } from "@/app/types/billing-types";
import { saveJobs, fetchAllBillingAccounts, fetchAllBillingProperties, fetchJobsAsBillingJob, fetchAllBillingPeriods} from "@/app/utils/supabase-client";

const InvoicesDashboard = () => {
  const [data, setData] = useState<AppfolioLineItem[]>([]);
  const [billbackName, setBillbackName] = useState("");  
  const [payeeName, setPayeeName] = useState("");  
  const [billDate, setBillDate] = useState("");
  const { billingPeriod } = useBillingPeriod(); 


  const updateDataWithState = () => {
    const newData = data.map(item => ({
      ...item,
      // Update fields based on state variables
      
      payeeName: payeeName,  // Assuming you want to set all items to the same payeeName
      billDescription: billbackName ? `${billbackName}: ${item.billingAccountCategory}` : item.billDescription,
      billDate: billDate, // Set bill date for all items
      dueDate: billDate, // Set due date for all items
      billReference: billbackName, // Set bill reference for all items
      billRemarks: billbackName, // Set bill remarks for all items
      memoForCheck: billbackName, // Set memo for check for all items
    }));
  
    setData(newData);
  };
  
  useEffect(() => {
    updateDataWithState();
  }, [billbackName, payeeName, billDate]); // Add any other state variables as needed
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accounts = await fetchAllBillingAccounts();
        const billingProperties = await fetchAllBillingProperties();

        setBillingAccounts(accounts as never[]);
        setBillingProperties(billingProperties as never[]);


      } catch (error) {
        console.error("Error fetching initial data", error);
      }
    };

    fetchData();
  }, []);
  

    const tableConfig: TableConfigItem[] = [
      { column: "billPropertyCode", label: "Bill Property Code", canSort: false },
      { column: "entity", label: "Entity", canSort: false },
      { column: "amount", label: "Amount", canSort: false },
      { column: "billAccountCode", label: "Bill Account", canSort: false },
      { column: "billDescription", label: "Bill Description", canSort: false },
      { column: "billDate", label: "Bill Date", canSort: false },
      { column: "dueDate", label: "Due Date", canSort: false }, 
  ]
  const handleSort = (column: string) => {}

  const updateBillbackName = (name: string) => {
    setBillbackName(name);
    const newData: AppfolioLineItem[] = data.map((item) => {


      const newName = item.billingAccountCategory? `${name}: ${item.billingAccountCategory}` : name;

      return {
        ...item,
        billDescription: newName, 
      };
    });

    setData(newData);
  }
  
    

  const fetchData = async () => {
    try {
      const jobs = await fetchJobsAsBillingJob(billingPeriod);
      const billingProperties = await fetchAllBillingProperties();
      const billbackCategories = await fetchAllBillingAccounts();
      //convert billingJobs to AppfolioLineItems
      const appfolioLineItems: AppFolioLineItem[] = jobs.map((job) => {

        const account = billbackCategories.find((account) => account.id == job.billing_account_id);

        const billbackCategory = billbackCategories.find((category) => category.id == job.billing_account_id);
        const property = billingProperties.find((property) => property.id == job.property_id);

        const lineItem = {
          billPropertyCode: property.code,
          billUnitName: property.unit,
          entity: property ? property.entityName : '',
          payeeName: payeeName,
          amount: job.total,
          billAccountCode: billbackCategory?.glcode,
          billDescription: account.description,
          billDate: billDate,
          dueDate: billDate,
          billReference: billbackName,
          billRemarks: billbackName,
          memoForCheck: billbackName,
          billingAccountCategory: account ? account.name : ""
        };

        return lineItem;
      });

      setData(appfolioLineItems);

    } catch (error) {
      console.error("Error fetching jobs:", error);
    }

  };

  useEffect(() => {
    fetchData();
  }, [billingPeriod]);

  const convertToCSV = (objArray: AppFolioLineItem[]) => {
    if (!objArray.length) return '';
  
    // Mapping of object keys to friendly header names
    const headerMap = {
      billPropertyCode: "Bill Property Code",
      billUnitName: "Bill Unit Name",
      entity: "Entity",
      payeeName: "Payee Name",
      amount: "Amount",
      billAccountCode: "Bill Account Code",
      billDescription: "Bill Description",
      billDate: "Bill Date",
      dueDate: "Due Date",
      billReference: "Bill Reference",
      billRemarks: "Bill Remarks",
      memoForCheck: "Memo For Check"
    };
  
    // Generate the header row from the headerMap values
    const headers = Object.values(headerMap).join(',') + '\r\n';
  
    // Generate each data row
    const rows = objArray.map(obj => {
      return Object.keys(headerMap) // Use the keys from headerMap to ensure correct order
        .map(key => obj[key]) // Retrieve each value in the specified order
        .join(','); // Join each value with a comma
    }).join('\r\n');
  
    return headers + rows;
  };
  

  const exportCSVFile = () => {
    const entityGroups = data.reduce((acc, lineItem) => {
      // Group data by entity
      const key = lineItem.entity;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(lineItem);
      return acc;
    }, {});
  
    Object.keys(entityGroups).forEach(entity => {
      // Convert each group to CSV
      const csvStr = convertToCSV(entityGroups[entity]);
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
  
      // Format file name to include the entity and bill date
      // Assuming billDate is consistent across all items in a single entity group
      const firstItem = entityGroups[entity][0];
      const formattedBillDate = firstItem.billDate.replace(/-/g, '');
      const fileName = `${entity}_${formattedBillDate}.csv`;
  
      // Create and trigger download
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };
  /*
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
      </SimpleGrid>*/
  

  return (
    <Container maxW='5000px' py={5}>
      <SimpleGrid mt={5}columns={2}>
        <Flex direction="row" alignItems="flex-center" justifyContent="flex-start" >
        </Flex>
      <Flex minWidth={'250px'} direction="row" alignItems="flex-start" justifyContent="flex-end" >
      <Heading as="h1" size="xl" mb={6}>
        Invoice Line Items
      </Heading>  

      </Flex>
      </SimpleGrid>
      <SimpleGrid columns={2}>
      <Flex justifyContent="left" my="4" ml={0}>
         <Input
          placeholder="Billback Name"
          value={billbackName}
          onChange={(e) => updateBillbackName(e.target.value)}
          width="auto"
          ml="4"
        />
        <Input
          placeholder="Payee Name"
          value={payeeName}
          onChange={(e) => setPayeeName(e.target.value)}
          width="auto"
          ml="4"
        />
         <Input
          placeholder="Bill Date"
          type="date"
          value={billDate}
          onChange={(e) => setBillDate(e.target.value)}
          width="auto"
          ml="4"
        />
        </Flex>
        <Flex justifyContent={"right"} alignItems={"flex-end"}>
      <Button colorScheme="green"
          bg={'green.500'} onClick={exportCSVFile} mb={4}>
        Export to CSV
      </Button>
      </Flex>
      </SimpleGrid>
      <Box
        overflowX="auto"
        border="1px"
        borderColor="gray.200"
        borderRadius="lg"
      >

        <TableDisplay
         tableConfig ={tableConfig}
          data={data}
          handleSort={handleSort}
          
        />
      </Box>
    </Container>
  );
};

export default InvoicesDashboard;
