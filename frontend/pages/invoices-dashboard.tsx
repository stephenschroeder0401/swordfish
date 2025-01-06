// @ts-nocheck

import React, { useEffect, useState, useMemo } from "react";
import {
  Text,
  Box,
  Flex,
  Input,
  Container,
  Heading,
  Button,
  Select,
  SimpleGrid,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
  Checkbox
} from "@chakra-ui/react";
import { supabase } from '@/lib/data-access/supabase-client';
import TableDisplay from "@/components/features/table/table-display";
import { useBillingPeriod } from "@/contexts/BillingPeriodContext"; 

import { TableConfigItem } from "../src/types/table-config";
import { AppfolioLineItem } from "@/types/billing-types";
import { saveJobs, fetchJobsAsBillingJob} from "@/lib/data-access/supabase-client";
import { fetchAllBillingAccounts, fetchAllProperties, 
  fetchAllBillingPeriods, fetchAllPropertiesNoPagination, 
  fetchAllBillingAccountsNoPagination, fetchMonthlyBillingItems } from "@/lib/data-access"
import debounce from 'lodash/debounce';

const InvoicesDashboard = () => {
  const [hourlyLineItems, setHourlyLineItems] = useState([]);
  const [monthlyLineItems, setMonthlyLineItems] = useState([]);
  const [data, setData] = useState<AppfolioLineItem[]>([]);
  const [billbackName, setBillbackName] = useState("");  
  const [payeeName, setPayeeName] = useState("");  
  const [billDate, setBillDate] = useState("");
  const [includeGLDescription, setIncludeGLDescription] = useState(true);
  const { billingPeriod } = useBillingPeriod(); 
  const [separateByEntity, setSeparateByEntity] = useState(true);

  // Create debounced update functions with shorter delay
  const debouncedUpdateBillback = useMemo(
    () => debounce((name: string) => {
      setBillbackName(name);
    }, 200),
    []
  );

  const debouncedUpdatePayee = useMemo(
    () => debounce((name: string) => {
      setPayeeName(name);
    }, 200),
    []
  );

  const debouncedUpdateBillDate = useMemo(
    () => debounce((date: string) => {
      setBillDate(date);
    }, 200),
    []
  );

  // Update the input handlers
  const handleBillbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value || '';  // Handle null case
    debouncedUpdateBillback(e.target.value);
  };

  const handlePayeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value || '';
    debouncedUpdatePayee(e.target.value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value || '';
    debouncedUpdateBillDate(e.target.value);
  };

  const updateDataWithState = () => {
    const newData = data.map(item => ({
      ...item,
      payeeName: payeeName,
      billDescription: billbackName ? `${billbackName}: ${item.billingAccountCategory}` : item.billDescription,
      billDate: billDate,
      dueDate: billDate,
      billReference: billbackName,
      billRemarks: billbackName,
      memoForCheck: billbackName,
    }));
  
    setData(newData);
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const accounts = await fetchAllBillingAccounts();
        const billingProperties = await fetchAllProperties();
      } catch (error) {
        console.error("Error fetching initial data", error);
      }
    };

    fetchData();
  }, []);
  

    const tableConfig: TableConfigItem[] = [
      { 
        column: "billPropertyCode", 
        label: "Bill Property Code", 
        canSort: false,
        width: "30vw"
      },
      { column: "entity", label: "Entity", canSort: false },
      { 
        column: "amount", 
        label: "Amount", 
        canSort: false,
        format: (value) => `$ ${Number(value).toFixed(2)}`
      },
      { column: "billAccountCode", label: "Bill Account", canSort: false },
      { column: "billDescription", label: "Bill Description", canSort: false },
      { column: "billDate", label: "Bill Date", canSort: false },
      { column: "dueDate", label: "Due Date", canSort: false }, 
  ]
  const handleSort = (column: string) => {}

  const updateBillbackName = (name: string) => {
    setBillbackName(name);
    const newData: AppfolioLineItem[] = data.map((item) => {
      const newName = includeGLDescription && item.billingAccountCategory 
        ? `${name}: ${item.billingAccountCategory}` 
        : name;

      return {
        ...item,
        billDescription: newName, 
      };
    });
    setData(newData);
  }

  const handleGLDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeGLDescription(e.target.checked);
    updateBillbackName(billbackName);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!billingPeriod) {
        setHourlyLineItems([]);
        setMonthlyLineItems([]);
        return;
      }

      try {
        // Fetch hourly jobs
        const jobs = await fetchJobsAsBillingJob(billingPeriod);
        const billingProperties = await fetchAllPropertiesNoPagination();
        const billbackCategories = await fetchAllBillingAccountsNoPagination();
        
        // Fetch monthly billing items
        const monthlyItems = await fetchMonthlyBillingItems();

        // Process hourly items
        const hourlyItems = jobs.flatMap((job) => {
          const account = billbackCategories.find((account) => account.id == job.billing_account_id);
          const billbackCategory = billbackCategories.find((category) => category.id == job.billing_account_id);
          const property = billingProperties.find((property) => property.id == job.property_id);

          const billDescription = includeGLDescription 
            ? (billbackName ? `${billbackName}: ${account?.description}` : account?.description)
            : '';

          const baseLineItem = {
            billPropertyCode: property?.code,
            billUnitName: property?.unit,
            entity: property ? property.entityName : '',
            payeeName: payeeName,
            billAccountCode: billbackCategory?.glcode,
            billDate: billDate,
            dueDate: billDate,
            billReference: billbackName,
            billRemarks: billbackName,
            memoForCheck: billbackName,
            billingAccountCategory: account ? account.name : ""
          };

          const items = [];

          if (Number(job.total)) {
            items.push({
              ...baseLineItem,
              amount: Number(job.total),
              billDescription: billDescription,
            });
          }

          if (Number(job.milage_total)) {
            items.push({
              ...baseLineItem,
              amount: Number(job.milage_total),
              billDescription: billbackName ? `${billbackName}: Mileage: ${account?.description}` : `Mileage: ${account?.description}`,
            });
          }

          return items;
        });

        // Process monthly items
        const monthlyLineItemsObj = monthlyItems.flatMap(item => 
          item.property_group_gl.flatMap(groupGl => 
            groupGl.property_group.property_group_property.map(propertyAllocation => ({
              billPropertyCode: propertyAllocation.property.code,
              billUnitName: '',
              entity: propertyAllocation.property.entity.name,
              payeeName: payeeName,
              amount: (propertyAllocation.percentage * 0.01) * item.rate,
              billAccountCode: item.glcode,
              billDescription: includeGLDescription
                ? (billbackName ? `${billbackName}: Monthly: ${item.description}` : `Monthly: ${item.description}`)
                : '',
              billDate: billDate,
              dueDate: billDate,
              billReference: billbackName,
              billRemarks: billbackName,
              memoForCheck: billbackName,
              billingAccountCategory: item.description
            }))
          )
        ).reduce((acc, curr) => {
          const key = `${curr.billPropertyCode}-${curr.billAccountCode}`;
          if (!acc[key]) {
            acc[key] = curr;
          } else {
            acc[key].amount += curr.amount;
          }
          return acc;
        }, {});

        // In your useEffect where we process the data
        const hourlyItemsObj = hourlyItems.reduce((acc, curr) => {
          // Create a key combining property, bill account, and description
          const key = `${curr.billPropertyCode}-${curr.billAccountCode}-${curr.billDescription}`;
          
          if (!acc[key]) {
            // First time seeing this combo
            acc[key] = curr;
          } else {
            // We've seen this before, sum up the amounts
            acc[key].amount += curr.amount;
          }
          
          return acc;
        }, {});

        // Convert back to array before setting state
        setHourlyLineItems(Object.values(hourlyItemsObj));

        // Set separate states
        setMonthlyLineItems(Object.values(monthlyLineItemsObj));

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [billingPeriod, billbackName, payeeName, billDate, includeGLDescription]);

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
  
    // Add this function to properly escape CSV fields
    const escapeCSVField = (field: any, key?: string) => {
      if (field === null || field === undefined) return '';
      
      // Round amount to nearest 100th (2 decimal places)
      if (key === 'amount') {
        return Number(field).toFixed(2);
      }

      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };
  
    // Generate each data row with escaped fields
    const rows = objArray.map(obj => {
      return Object.keys(headerMap)
        .map(key => escapeCSVField(obj[key], key))
        .join(',');
    }).join('\r\n');
  
    return headers + rows;
  };
  

  const exportCSVFile = () => {
    const combinedData = [...hourlyLineItems, ...monthlyLineItems].map(item => ({
      ...item,
      billDescription: includeGLDescription 
        ? item.billDescription
        : billbackName
    }));
    
    console.log("Exporting data: ", combinedData);

    if (separateByEntity) {
      // Existing entity separation logic
      const entityGroups = combinedData.reduce((acc, lineItem) => {
        const key = lineItem.entity;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(lineItem);
        return acc;
      }, {});

      Object.keys(entityGroups).forEach(entity => {
        const csvStr = convertToCSV(entityGroups[entity]);
        const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const firstItem = entityGroups[entity][0];
        const formattedBillDate = firstItem.billDate.replace(/-/g, '');
        const fileName = `${entity}_${formattedBillDate}.csv`;
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    } else {
      // Single file export
      const csvStr = convertToCSV(combinedData);
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Use the bill date from first item for the filename
      const formattedBillDate = combinedData[0]?.billDate.replace(/-/g, '') || 'export';
      const fileName = `combined_${formattedBillDate}.csv`;
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  

  // Create a version without date columns for Hourly and Monthly tabs
  const baseTableConfig = tableConfig.filter(config => 
    !['billDate', 'dueDate'].includes(config.column)
  );

  return (
    <Box h="100vh" display="flex" flexDirection="column">
      <Flex 
        bg="white" 
        borderBottom="1px" 
        borderColor="gray.200" 
        p={4}
        h="7vh"
        alignItems="center"
        pb="3vh"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Heading as="h1" size="lg">
          Invoices
        </Heading>
      </Flex>

      <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
        <Tabs 
          variant="enclosed" 
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
              padding: 0,
              overflowY: 'auto'
            }
          }}
        >
          <TabList height="5vh" bg="white" position="sticky" top={0} zIndex={1}>
            <Tab py={1} fontSize="lg">Hourly Costs</Tab>
            <Tab py={1} fontSize="lg">Monthly Allocated Costs</Tab>
            <Tab py={1} fontSize="lg">Export</Tab>
          </TabList>

          <TabPanels flex="1" overflow="hidden">
            <TabPanel h="100%" p={0}>
              <Box p={4}>
                <TableDisplay
                  tableConfig={baseTableConfig}
                  data={hourlyLineItems}
                  handleSort={handleSort}
                  sortField=""
                  sortDirection=""
                />
                <Box mb="155px" />
              </Box>
            </TabPanel>

            <TabPanel h="100%" p={0}>
              <Box p={4}>
                <TableDisplay
                  tableConfig={baseTableConfig}
                  data={monthlyLineItems}
                  handleSort={handleSort}
                  sortField=""
                  sortDirection=""
                />
                <Box mb="155px" />
              </Box>
            </TabPanel>

            <TabPanel h="100%" p={0}>
              <Box p={2} position="relative">
                <Box position="absolute" left={4} right={4} bg="white" zIndex={3}>
                  <Box width="100%" mb={6} mt={4}>  
                    <Box width="100%" mb={4} pb={4} borderBottom="1px" borderColor="gray.200">  
                      <SimpleGrid columns={2} spacing={10}>
                        <Flex direction="row" gap={4}>
                          <Flex alignItems="center" gap={2}>
                            <Checkbox 
                              isChecked={includeGLDescription}
                              onChange={handleGLDescriptionChange}
                              size="sm"
                            >
                              <Text fontSize="xs" color="gray.500">Include GL Description</Text>
                            </Checkbox>
                            <Input
                              placeholder="Enter billback name"
                              onChange={handleBillbackChange}
                              width="300px"
                            />
                          </Flex>
                          <Input
                            placeholder="Enter payee name"
                            onChange={handlePayeeChange}
                            width="300px"
                          />
                          <Input
                            type="date"
                            onChange={handleDateChange}
                            width="300px"
                          />
                        </Flex>
                        <Flex justifyContent="flex-end" gap={4} alignItems="center">
                          <Checkbox 
                            isChecked={separateByEntity}
                            onChange={(e) => setSeparateByEntity(e.target.checked)}
                            size="sm"
                          >
                            <Text fontSize="xs" color="gray.500">Separate by Entity</Text>
                          </Checkbox>
                          <Button 
                            onClick={exportCSVFile} 
                            colorScheme="green"
                          >
                            Export to CSV
                          </Button>
                        </Flex>
                      </SimpleGrid>
                    </Box>

                    <Box overflowX="auto">
                      <Box minWidth="2000px">
                        <TableDisplay
                          tableConfig={tableConfig}
                          data={[...hourlyLineItems, ...monthlyLineItems].map(item => ({
                            ...item,
                            billDescription: includeGLDescription 
                              ? item.billDescription 
                              : billbackName
                          }))}
                          handleSort={handleSort}
                          sortField=""
                          sortDirection=""
                        />
                      </Box>
                    </Box>
                    <Box mb="155px" />
                  </Box>
                </Box>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default InvoicesDashboard;
