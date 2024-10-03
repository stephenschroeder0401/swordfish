import React, { useEffect, useState } from 'react';
import { Container, Heading, Flex, Text, Box, HStack, Button } from "@chakra-ui/react";
import { fetchBillbackUpload } from '../src/app/utils/supabase-client';
import { useBillingPeriod } from '@/contexts/BillingPeriodContext';
import dynamic from 'next/dynamic';
import { ChartData, ChartOptions } from 'chart.js';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Dynamically import the Pie component with SSR disabled
const Pie = dynamic(() => import('react-chartjs-2').then(mod => mod.Pie), { ssr: false });

interface BillbackEntry {
  hours: number;
  jobTotal: string;
  entity: string;
  category: string;
  property: string;
  employee: string;  // Add this line
}

const Analytics: React.FC = () => {
  const [billbackData, setBillbackData] = useState<BillbackEntry[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [entityChartData, setEntityChartData] = useState<ChartData<'pie'> | null>(null);
  const [categoryChartData, setCategoryChartData] = useState<ChartData<'pie'> | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [propertyChartData, setPropertyChartData] = useState<ChartData<'pie'> | null>(null);
  const [employeeChartData, setEmployeeChartData] = useState<ChartData<'pie'> | null>(null);
  const { billingPeriod } = useBillingPeriod();

  useEffect(() => {
    if (billingPeriod) {
      fetchBillbackData();
    }
  }, [billingPeriod]);

  const fetchBillbackData = async () => {
    try {
    console.log("GETTING NEW DATA for billing period ", billingPeriod);  
        
      const data = await fetchBillbackUpload(billingPeriod);


      if (data && data.upload_data) {
        console.log("here is the data: ", data.upload_data);
        const uploadData = data.upload_data;
        setBillbackData(uploadData);
        calculateTotals(uploadData);
      } else {
        setBillbackData([]);
        setTotalHours(0);
        setTotalRevenue(0);
      }
    } catch (error) {
      console.error("Error fetching billback data:", error);
      setBillbackData([]);
      setTotalHours(0);
      setTotalRevenue(0);
    }
  };

  const calculateTotals = (data: BillbackEntry[]) => {
    console.log("calculating for data: ", data);
    const hours = data.reduce((sum, entry) => {
      const entryHours = Number(entry.hours) || 0;
      return sum + (isNaN(entryHours) ? 0 : entryHours);
    }, 0);

    const revenue = data.reduce((sum, entry) => {
      const jobTotal = Number(entry.jobTotal) || 0;
      return sum + (isNaN(jobTotal) ? 0 : jobTotal);
    }, 0);

    setTotalHours(Number(hours.toFixed(2)));
    setTotalRevenue(Number(revenue.toFixed(2)));
  };

  const prepareEntityChartData = (data: BillbackEntry[]) => {
    const entityHours: { [key: string]: number } = {};
    data.forEach(entry => {
      if (entry.entity && entry.hours) {
        entityHours[entry.entity] = (entityHours[entry.entity] || 0) + Number(entry.hours);
      }
    });

    const labels = Object.keys(entityHours);
    const values = Object.values(entityHours);

    setEntityChartData({
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ],
        hoverBackgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ]
      }]
    });
  };

  const preparePropertyChartData = (entity: string) => {
    const propertyHours: { [key: string]: number } = {};
    billbackData.forEach(entry => {
      if (entry.entity === entity && entry.property && entry.hours) {
        propertyHours[entry.property] = (propertyHours[entry.property] || 0) + Number(entry.hours);
      }
    });

    const labels = Object.keys(propertyHours);
    const values = Object.values(propertyHours);

    setPropertyChartData({
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ],
        hoverBackgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ]
      }]
    });
  };

  const prepareCategoryChartData = (data: BillbackEntry[]) => {
    const categoryHours: { [key: string]: number } = {};
    data.forEach(entry => {
      if (entry.category && entry.hours) {
        categoryHours[entry.category] = (categoryHours[entry.category] || 0) + Number(entry.hours);
      }
    });

    const labels = Object.keys(categoryHours);
    const values = Object.values(categoryHours);

    setCategoryChartData({
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ],
        hoverBackgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ]
      }]
    });
  };

  const prepareEmployeeChartData = (category: string) => {
    const employeeHours: { [key: string]: number } = {};
    billbackData.forEach(entry => {
      if (entry.category === category && entry.employee && entry.hours) {
        employeeHours[entry.employee] = (employeeHours[entry.employee] || 0) + Number(entry.hours);
      }
    });

    const labels = Object.keys(employeeHours);
    const values = Object.values(employeeHours);

    setEmployeeChartData({
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ],
        hoverBackgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ]
      }]
    });
  };

  useEffect(() => {
    if (billbackData.length > 0) {
      prepareEntityChartData(billbackData);
      prepareCategoryChartData(billbackData);
    }
  }, [billbackData]);

  const handleEntityClick = (event: any, elements: any) => {
    if (!selectedEntity && elements.length > 0 && entityChartData && entityChartData.labels) {
      const clickedIndex = elements[0].index;
      if (clickedIndex >= 0 && clickedIndex < entityChartData.labels.length) {
        const clickedEntity = entityChartData.labels[clickedIndex] as string;
        setSelectedEntity(clickedEntity);
        preparePropertyChartData(clickedEntity);
      }
    }
  };

  const handleCategoryClick = (event: any, elements: any) => {
    if (!selectedCategory && elements.length > 0 && categoryChartData && categoryChartData.labels) {
      const clickedIndex = elements[0].index;
      if (clickedIndex >= 0 && clickedIndex < categoryChartData.labels.length) {
        const clickedCategory = categoryChartData.labels[clickedIndex] as string;
        setSelectedCategory(clickedCategory);
        prepareEmployeeChartData(clickedCategory);
      }
    }
  };

  const entityChartOptions: ChartOptions<'pie'> = {
    responsive: true, 
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        align: 'center',
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 12
          },
        },
      },
      tooltip: {
        bodyFont: {
          size: 12
        },
        titleFont: {
          size: 14
        }
      }
    },
    layout: {
      padding: {
        right: 50
      }
    },
    onClick: handleEntityClick
  };

  const propertyChartOptions: ChartOptions<'pie'> = {
    ...entityChartOptions,
    onClick: undefined // Remove click handler for property chart
  };

  const categoryChartOptions: ChartOptions<'pie'> = {
    ...entityChartOptions,
    onClick: handleCategoryClick
  };

  const employeeChartOptions: ChartOptions<'pie'> = {
    ...categoryChartOptions,
    onClick: undefined
  };

  return (
    <Container maxW='5000px' py={2}>
      <Flex direction="column" alignItems="stretch">
        <Heading color="gray.700" mb={4}>Analytics</Heading>
        <HStack spacing={4} align="stretch" mb={4}>
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" flex={1}>
            <Heading fontSize="xl">% Of Goober In My Blood</Heading>
            <Text fontSize="3xl" fontWeight="bold" color="red.500">
              0%
            </Text>
          </Box>
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" flex={1}>
            <Heading fontSize="xl">Total Billed Hours</Heading>
            <Text fontSize="3xl" fontWeight="bold">
              {isNaN(totalHours) ? '0' : totalHours.toFixed(2)}
            </Text>
          </Box>
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" flex={1}>
            <Heading fontSize="xl">Total Billed Revenue</Heading>
            <Text fontSize="3xl" fontWeight="bold">
              ${isNaN(totalRevenue) ? '0.00' : totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </Text>
          </Box>
        </HStack>
        <Flex justify="space-between">
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" width="48%">
            <Heading fontSize="xl" mb={4}>
              {selectedEntity ? `Properties for ${selectedEntity}` : 'Billed Hours by Entity'}
            </Heading>
            {selectedEntity && (
              <Button onClick={() => setSelectedEntity(null)} mb={4}>
                Back to Entities
              </Button>
            )}
            <Box height="400px">
              {(selectedEntity && propertyChartData) || (!selectedEntity && entityChartData) ? (
                <Pie 
                  data={selectedEntity ? propertyChartData! : entityChartData!} 
                  options={selectedEntity ? propertyChartOptions : entityChartOptions} 
                />
              ) : (
                <Text>Loading chart data...</Text>
              )}
            </Box>
          </Box>
          <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" width="48%">
            <Heading fontSize="xl" mb={4}>
              {selectedCategory ? `Employees for ${selectedCategory}` : 'Billed Hours by Category'}
            </Heading>
            {selectedCategory && (
              <Button onClick={() => setSelectedCategory(null)} mb={4}>
                Back to Categories
              </Button>
            )}
            <Box height="400px">
              {(selectedCategory && employeeChartData) || (!selectedCategory && categoryChartData) ? (
                <Pie 
                  data={selectedCategory ? employeeChartData! : categoryChartData!} 
                  options={selectedCategory ? employeeChartOptions : categoryChartOptions} 
                />
              ) : (
                <Text>Loading chart data...</Text>
              )}
            </Box>
          </Box>
        </Flex>
      </Flex>
    </Container>
  );
};

export default Analytics;