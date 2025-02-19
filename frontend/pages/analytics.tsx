import React, { useEffect, useState } from 'react';
import { Container, Heading, Flex, Text, Box, HStack, Button, Select, Card, CardHeader, CardBody } from "@chakra-ui/react";
import { fetchBillbackUpload } from '../src/lib/data-access/supabase-client';
import {fetchAllEmployees} from '../src/lib/data-access';
import { useBillingPeriod } from '@/contexts/BillingPeriodContext';
import dynamic from 'next/dynamic';
import { ChartData, ChartOptions } from 'chart.js';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, annotationPlugin);

// Dynamically import the Pie and Bar components with SSR disabled
const Pie = dynamic(() => import('react-chartjs-2').then(mod => mod.Pie), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });

interface BillbackEntry {
  billingAccountId: string;
  hours: number;
  jobTotal: string;
  entity: string;
  category: string;
  property: string;
  employee: string;
  notes?: string;  // Add this line
}

interface JobChartData extends ChartData<'pie'> {
  notes?: string[];
}

interface TimeAllocation {
  percentage: any;
  billing_account_id: any;
  billing_account: {
    id: string;
    name: string;
  };
  allocation_percentage: number;
}

interface Employee {
  id: string;
  name: string;
}

const Analytics: React.FC = () => {
  const [billbackData, setBillbackData] = useState<BillbackEntry[]>([]);
  const [overallTotalHours, setOverallTotalHours] = useState(0);
  const [overallTotalRevenue, setOverallTotalRevenue] = useState(0);
  const [employeeTotalHours, setEmployeeTotalHours] = useState(0);
  const [employeeTotalRevenue, setEmployeeTotalRevenue] = useState(0);
  const [entityChartData, setEntityChartData] = useState<ChartData<'pie'> | null>(null);
  const [categoryChartData, setCategoryChartData] = useState<ChartData<'pie'> | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [propertyChartData, setPropertyChartData] = useState<ChartData<'pie'> | null>(null);
  const [employeeChartData, setEmployeeChartData] = useState<ChartData<'pie'> | null>(null);
  const { billingPeriod } = useBillingPeriod();
  const [employees, setEmployees] = useState<string[]>([]);
  const [employeesWithIds, setEmployeesWithIds] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [employeeCategoryData, setEmployeeCategoryData] = useState<ChartData<'bar'> | null>(null);
  const [employeePieChartData, setEmployeePieChartData] = useState<ChartData<'pie'> | null>(null);
  const [selectedEmployeeHours, setSelectedEmployeeHours] = useState(0);
  const [selectedEmployeeRevenue, setSelectedEmployeeRevenue] = useState(0);
  const [jobChartData, setJobChartData] = useState<JobChartData | null>(null);
  const [selectedEmployeeCategory, setSelectedEmployeeCategory] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedJobNotes, setSelectedJobNotes] = useState<string | null>(null);
  const [employeeAllocations, setEmployeeAllocations] = useState<TimeAllocation[]>([]);

  // Replace with a refined, modern color palette
  const sophisticatedColors = [
    '#63B3ED',  // Soft blue
    '#76E4F7',  // Light cyan
    '#9F7AEA',  // Lavender
    '#4FD1C5',  // Teal
    '#68D391',  // Sage green
    '#F687B3',  // Dusty pink
  ];

  useEffect(() => {
    if (billingPeriod) {
      fetchBillbackData();
    }
  }, [billingPeriod]);

  useEffect(() => {
    if (selectedEmployee) {
      prepareEmployeeCategoryData(selectedEmployee, billbackData);
    }
  }, [selectedEmployee]);

  useEffect(() => {
    console.log("Employee allocations updated:", employeeAllocations);
    if (selectedEmployee) {
      prepareEmployeeCategoryData(selectedEmployee, billbackData);
    }
  }, [employeeAllocations]);

  const fetchBillbackData = async () => {
    try {
      console.log("GETTING NEW DATA for billing period ", billingPeriod);  
      
      const [billbackData, employeesData] = await Promise.all([
        fetchBillbackUpload(billingPeriod),
        fetchAllEmployees()
      ]);

      if (billbackData && billbackData.upload_data) {
        console.log("here is the data: ", billbackData.upload_data);
        const uploadData = billbackData.upload_data;
        setBillbackData(uploadData);
        
        // Calculate overall totals
        calculateTotals(uploadData, true);
        
        // Get unique employees from the new data
        const newUniqueEmployees = Array.from(new Set(uploadData.map(entry => entry.employee))) as string[];
        setEmployees(newUniqueEmployees);
        
        // Store all employees with their IDs and log them
        console.log("Setting employees with IDs:", employeesData);
        setEmployeesWithIds(employeesData);

        // If there's a selected employee, filter data for that employee
        if (selectedEmployee) {
          const filteredData = uploadData.filter(entry => entry.employee === selectedEmployee);
          calculateTotals(filteredData, false);
          prepareEmployeeCategoryData(selectedEmployee, uploadData);
        }

        // Update main charts
        prepareEntityChartData(uploadData);
        prepareCategoryChartData(uploadData);
      } else {
        setBillbackData([]);
        setOverallTotalHours(0);
        setOverallTotalRevenue(0);
        setEmployees([]);
        setEmployeesWithIds([]);
        setSelectedEmployee('');
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setBillbackData([]);
      setOverallTotalHours(0);
      setOverallTotalRevenue(0);
      setEmployees([]);
      setEmployeesWithIds([]);
      setSelectedEmployee('');
    }
  };

  const calculateTotals = (data: BillbackEntry[], isOverall: boolean = true) => {
    console.log("calculating for data: ", data);
    const hours = data.reduce((sum, entry) => {
      const entryHours = Number(entry.hours) || 0;
      return sum + (isNaN(entryHours) ? 0 : entryHours);
    }, 0);

    const revenue = data.reduce((sum, entry) => {
      const jobTotal = Number(entry.jobTotal) || 0;
      return sum + (isNaN(jobTotal) ? 0 : jobTotal);
    }, 0);

    if (isOverall) {
      setOverallTotalHours(Number(hours.toFixed(2)));
      setOverallTotalRevenue(Number(revenue.toFixed(2)));
    } else {
      setEmployeeTotalHours(Number(hours.toFixed(2)));
      setEmployeeTotalRevenue(Number(revenue.toFixed(2)));
    }
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
        backgroundColor: sophisticatedColors,
        hoverBackgroundColor: sophisticatedColors.map(color => `${color}CC`),  // Slight transparency on hover
        borderWidth: 0,
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
        backgroundColor: sophisticatedColors,
        hoverBackgroundColor: sophisticatedColors.map(color => `${color}CC`),  // Slight transparency on hover
        borderWidth: 0,
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
        backgroundColor: sophisticatedColors,
        hoverBackgroundColor: sophisticatedColors.map(color => `${color}CC`),  // Slight transparency on hover
        borderWidth: 0,
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
        backgroundColor: sophisticatedColors,
        hoverBackgroundColor: sophisticatedColors.map(color => `${color}CC`),  // Slight transparency on hover
        borderWidth: 0,
      }]
    });
  };

  useEffect(() => {
    if (billbackData.length > 0) {
      prepareEntityChartData(billbackData);
      prepareCategoryChartData(billbackData);
    }
  }, [billbackData]);

  const prepareEmployeeCategoryData = (employee: string, data: BillbackEntry[] = []) => {
    console.log("Raw employee allocations:", employeeAllocations);
    
    if (!data || data.length === 0) {
      console.log("No data available for employee category breakdown");
      setSelectedEmployeeHours(0);
      setSelectedEmployeeRevenue(0);
      setEmployeeCategoryData(null);
      setEmployeePieChartData(null);
      return;
    }

    let totalHours = 0;
    let totalRevenue = 0;
    const categoryHours: { [key: string]: { hours: number, id?: string } } = {};
    
    data.forEach(entry => {
      console.log("entry: ", entry);
      if (entry.employee === employee) {
        const hours = Number(entry.hours) || 0;
        const revenue = Number(entry.jobTotal) || 0;
        
        totalHours += hours;
        totalRevenue += revenue;
        
        if (entry.category) {
          if (!categoryHours[entry.category]) {
            categoryHours[entry.category] = {
              hours: 0,
              id: entry.billingAccountId// Make sure this property exists in your data
            };
          }
          categoryHours[entry.category].hours += hours;
        }
      }
    });

    setSelectedEmployeeHours(totalHours);
    setSelectedEmployeeRevenue(totalRevenue);

    const labels = Object.keys(categoryHours);
    const chartData = Object.values(categoryHours).map(cat => cat.hours);
    const categoryIds = Object.values(categoryHours).map(cat => cat.id);

    console.log("Category mapping:", Object.entries(categoryHours).map(([name, data]) => ({
      name,
      hours: data.hours,
      id: data.id
    })));

    console.log("Employee Allocations:", employeeAllocations);
    console.log("Category IDs:", categoryIds);
    console.log("Total Hours:", totalHours);

    const datasets = [{
      label: 'Hours per Category',
      data: chartData,
      backgroundColor: '#63B3ED',  // Soft blue
      borderColor: '#4299E1',      // Slightly darker blue
      borderWidth: 1
    }];

    setEmployeeCategoryData({
      labels: labels,
      datasets: datasets
    });

    setEmployeePieChartData({
      labels: labels,
      datasets: [{
        data: chartData,
        backgroundColor: sophisticatedColors,
        hoverBackgroundColor: sophisticatedColors.map(color => `${color}CC`),  // Slight transparency on hover
        borderWidth: 0,
      }]
    } as JobChartData);
  };

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

  const handleMainCategoryClick = (event: any, elements: any) => {
    if (!selectedMainCategory && elements.length > 0 && categoryChartData && categoryChartData.labels) {
      const clickedIndex = elements[0].index;
      if (clickedIndex >= 0 && clickedIndex < categoryChartData.labels.length) {
        const clickedCategory = categoryChartData.labels[clickedIndex] as string;
        setSelectedMainCategory(clickedCategory);
        prepareEmployeeChartData(clickedCategory);
      }
    }
  };

  const handleEmployeeChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const employeeName = event.target.value;
    setSelectedEmployee(employeeName);
    
    if (employeeName) {
      const filteredData = billbackData.filter(entry => entry.employee === employeeName);
      calculateTotals(filteredData, false);
      
      try {
        // Find the employee ID from our stored employeesWithIds
        const employee = employeesWithIds.find(emp => emp.name === employeeName);
        if (employee) {
          // console.log("Found employee:", employee);
          // //const allocations = await fetchEmployeeTimeAllocations(employee.id);
          // console.log("Fetched allocations:", allocations);
          // setEmployeeAllocations(allocations);
        } else {
          console.log("Could not find employee with name:", employeeName);
        }
      } catch (error) {
        console.error("Failed to fetch employee time allocations:", error);
        setEmployeeAllocations([]);
      }
    } else {
      setEmployeeTotalHours(0);
      setEmployeeTotalRevenue(0);
      setEmployeeCategoryData(null);
      setEmployeePieChartData(null);
      setEmployeeAllocations([]);     
    }
  };

  const handleEmployeePieChartClick = (event: any, elements: any) => {
    if (elements.length > 0 && employeePieChartData && employeePieChartData.labels) {
      const clickedIndex = elements[0].index;
      const clickedCategory = employeePieChartData.labels[clickedIndex] as string;
      setSelectedEmployeeCategory(clickedCategory);
      prepareJobChartData(selectedEmployee, clickedCategory);
    }
  };

  const prepareJobChartData = (employee: string, category: string) => {
    const jobData: { [key: string]: { hours: number, notes: string } } = {};
    
    billbackData.forEach(entry => {
      if (entry.employee === employee && entry.category === category) {
        const hours = Number(entry.hours) || 0;
        if (!jobData[entry.property]) {
          jobData[entry.property] = { hours: 0, notes: entry.notes || '' };
        }
        jobData[entry.property].hours += hours;
        // Concatenate notes if there are multiple entries for the same job
        if (entry.notes && !jobData[entry.property].notes.includes(entry.notes)) {
          jobData[entry.property].notes += (jobData[entry.property].notes ? '\n' : '') + entry.notes;
        }
      }
    });

    const labels = Object.keys(jobData);
    const data = labels.map(job => jobData[job].hours);
    const notes = labels.map(job => jobData[job].notes);

    setJobChartData({
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: sophisticatedColors,
        hoverBackgroundColor: sophisticatedColors.map(color => `${color}CC`),  // Slight transparency on hover
        borderWidth: 0,
      }],
      notes: notes // Add this line to include notes in the chart data
    });
  };

  const entityChartOptions: ChartOptions<'pie'> = {
    responsive: true, 
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        align: 'center',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11,
            family: "'Inter', sans-serif"  // More modern font
          },
          color: 'white'  // White text for legend
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleFont: {
          size: 13,
          family: "'Inter', sans-serif"
        },
        bodyFont: {
          size: 12,
          family: "'Inter', sans-serif"
        },
        padding: 12,
        cornerRadius: 4,
        titleColor: 'white',
        bodyColor: 'white'
      }
    },
    layout: {
      padding: {
        right: 40
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
    onClick: handleMainCategoryClick
  };

  const employeeChartOptions: ChartOptions<'pie'> = {
    ...categoryChartOptions,
    onClick: undefined
  };

  const getBarChartOptions = (allocations: any[], totalHours: number): ChartOptions<'bar'> => {
    const annotations: any = {};
    
    console.log("Creating annotations with:", {
      chartLabels: employeeCategoryData?.labels,
      allocations: allocations.map(a => ({
        name: a.billing_account.name,
        percentage: a.percentage
      }))
    });
    
    allocations.forEach((allocation, index) => {
      const targetHours = (allocation.percentage / 100) * totalHours;
      
      // Find the exact category name match
      const categoryIndex = employeeCategoryData?.labels?.findIndex(
        label => (label as string).trim() === allocation.billing_account.name.trim()
      ) ?? -1;

      console.log(`Matching allocation for ${allocation.billing_account.name}:`, {
        categoryIndex,
        labels: employeeCategoryData?.labels,
        allocationPercentage: allocation.percentage,
        totalHours,
        targetHours
      });

      // Only create annotation if we found the exact matching category
      if (categoryIndex !== -1) {
        annotations[`line${index + 1}`] = {
          type: 'line',
          yMin: targetHours,
          yMax: targetHours,
          borderColor: 'red',
          borderWidth: 2,
          borderDash: [5, 5],
          xMin: categoryIndex - 0.5,
          xMax: categoryIndex + 0.5,
          label: {
            display: true,
            content: `🎯 ${targetHours.toFixed(1)}h (${allocation.percentage}%)`,
            position: 'end',
            backgroundColor: '#2D3748',
            color: 'white',
            padding: 6,
            font: {
              size: 12,
              weight: 'bold'
            },
            borderRadius: 4,
            z: 100
          }
        };
      } else {
        console.warn(`No matching category found for ${allocation.billing_account.name}`);
      }
    });

    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Hours'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: [
            `Hours per Category for ${selectedEmployee}`,
            `Total Hours: ${selectedEmployeeHours.toFixed(2)}`,
            `Total Revenue: $${selectedEmployeeRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
          ]
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(2) + ' hours';
              }
              return label;
            }
          }
        },
        annotation: {
          annotations: annotations
        }
      }
    };
  };

  const barChartOptions = getBarChartOptions(employeeAllocations, selectedEmployeeHours);

  const employeePieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        align: 'center',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11,
            family: "'Inter', sans-serif"  // More modern font
          },
          color: 'white'  // White text for legend
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleFont: {
          size: 13,
          family: "'Inter', sans-serif"
        },
        bodyFont: {
          size: 12,
          family: "'Inter', sans-serif"
        },
        padding: 12,
        cornerRadius: 4,
        titleColor: 'white',
        bodyColor: 'white'
      }
    },
    layout: {
      padding: {
        right: 40
      }
    },
    onClick: selectedEmployeeCategory ? undefined : handleEmployeePieChartClick
  };
  return (
    <Container maxW='5000px' py={2} height="auto" minHeight="100vh" bg="gray.900">
      <Flex direction="column" alignItems="stretch" height="100%">

        <Flex mb={4}>
          <HStack spacing={4} align="stretch" w={'23vw'} minWidth={'300px'} mr={4}>
            <Box p={4} shadow="lg" borderRadius="md" flex={1} bg="gray.800">
              <Heading fontSize="lg" color="white">Billed Hours</Heading>
              <Text fontSize="2xl" fontWeight="bold" color="white">
                {isNaN(overallTotalHours) ? '0' : overallTotalHours.toFixed(2)}
              </Text>
            </Box>
            <Box p={4} shadow="lg" borderRadius="md" flex={1} bg="gray.800">
              <Heading fontSize="lg" color="white">Billed Revenue</Heading>
              <Text color="green.400" fontSize="2xl" fontWeight="bold">
                ${isNaN(overallTotalRevenue) ? '0.00' : overallTotalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </Text>
            </Box>
          </HStack>
          <Box flex={1} /> {/* This empty box pushes the charts to the right */}
        </Flex>
        <Flex justify="space-between" mb={4} flexWrap="wrap">
          <Box p={5} shadow="lg" borderRadius="md" width="48%" bg="gray.800">
            <Heading fontSize="xl" mb={4} color="white">
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
          <Box p={5} shadow="lg" borderRadius="md" width="48%" bg="gray.800">
            <Heading fontSize="xl" mb={4} color="white">
              {selectedMainCategory ? `Employees for ${selectedMainCategory}` : 'Billed Hours by Category'}
            </Heading>
            {selectedMainCategory && (
              <Button onClick={() => setSelectedMainCategory(null)} mb={4}>
                Back to Categories
              </Button>
            )}
            <Box height="400px">
              {(selectedMainCategory && employeeChartData) || (!selectedMainCategory && categoryChartData) ? (
                <Pie 
                  data={selectedMainCategory ? employeeChartData! : categoryChartData!} 
                  options={categoryChartOptions} 
                />
              ) : (
                <Text>Loading chart data...</Text>
              )}
            </Box>
          </Box>
        </Flex>
        <Card mt={2} mb={20} bg="gray.800" color="white">
          <CardHeader py={2}>
            <Heading size="md">Employee Category Breakdown</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <Flex alignItems="center" mb={2} justifyContent="space-between">
              <Flex alignItems="center">
                <Select
                  placeholder="Select an employee"
                  value={selectedEmployee}
                  onChange={handleEmployeeChange}
                  width="300px"
                  mr={4}
                >
                  {employees.map((employee) => (
                    <option key={employee} value={employee}>{employee}</option>
                  ))}
                </Select>
                {selectedEmployee && (
                  <HStack spacing={4} align="stretch" w={'23vw'} minWidth={'300px'} mr={4}>
                    <Box p={2} borderWidth={1} borderColor="gray.200" borderRadius="md" flex={1}>
                      <Heading fontSize="medium">Billed Hours</Heading>
                      <Text fontWeight="bold">{employeeTotalHours.toFixed(2)}</Text>
                    </Box>
                    <Box p={2} borderWidth={1} borderColor="gray.200" borderRadius="md" flex={1}>
                      <Heading fontSize="medium">Billed Revenue</Heading>
                      <Text fontWeight="bold" color="green.500">${employeeTotalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                    </Box>
                  </HStack>
                )}
                {!selectedEmployee && <Text fontSize="sm" color="gray.500">Select an employee to view their category breakdown</Text>}
              </Flex>
              {selectedEmployeeCategory && (
                <Button onClick={() => setSelectedEmployeeCategory(null)} size="sm">
                  Back to Categories
                </Button>
              )}
            </Flex>
            <Flex>
              <Box width="50%" height="300px" pr={2}>
                {employeeCategoryData && (
                  <Bar data={employeeCategoryData} options={barChartOptions} />
                )}
              </Box>
              <Box width="50%" pl={2}>
                <Flex direction="column" height="300px">
                  {selectedEmployeeCategory && jobChartData ? (
                    <>
                      <Heading size="sm" mb={1}>Jobs for {selectedEmployeeCategory}</Heading>
                      <Box height="280px">
                        <Pie data={jobChartData} options={employeePieChartOptions} />
                      </Box>
                    </>
                  ) : employeePieChartData ? (
                    <Box height="300px">
                      <Pie data={employeePieChartData} options={employeePieChartOptions} />
                    </Box>
                  ) : (
                    <Text>No data available</Text>
                  )}
                </Flex>
              </Box>
            </Flex>
          </CardBody>
        </Card>
      </Flex>
    </Container>
  );
};

export default Analytics;