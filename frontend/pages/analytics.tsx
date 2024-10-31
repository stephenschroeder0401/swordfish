import React, { useEffect, useState } from 'react';
import { Container, Heading, Flex, Text, Box, HStack, Button, Select, Card, CardHeader, CardBody } from "@chakra-ui/react";
import { fetchBillbackUpload, fetchEmployeeTimeAllocations } from '../src/app/utils/supabase-client';
import { useBillingPeriod } from '@/contexts/BillingPeriodContext';
import dynamic from 'next/dynamic';
import { ChartData, ChartOptions } from 'chart.js';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, annotationPlugin);

// Dynamically import the Pie and Bar components with SSR disabled
const Pie = dynamic(() => import('react-chartjs-2').then(mod => mod.Pie), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });

interface BillbackEntry {
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
  billing_account: {
    id: string;
    name: string;
  };
  allocation_percentage: number;
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

  const fetchBillbackData = async () => {
    try {
      console.log("GETTING NEW DATA for billing period ", billingPeriod);  
      
      const data = await fetchBillbackUpload(billingPeriod);

      if (data && data.upload_data) {
        console.log("here is the data: ", data.upload_data);
        const uploadData = data.upload_data;
        setBillbackData(uploadData);
        
        // Calculate overall totals
        calculateTotals(uploadData, true);
        
        // Get unique employees from the new data
        const newUniqueEmployees = Array.from(new Set(uploadData.map(entry => entry.employee)));
        setEmployees(newUniqueEmployees);
        
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
        setSelectedEmployee('');
      }
    } catch (error) {
      console.error("Error fetching billback data:", error);
      setBillbackData([]);
      setOverallTotalHours(0);
      setOverallTotalRevenue(0);
      setEmployees([]);
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

  const prepareEmployeeCategoryData = (employee: string, data: BillbackEntry[] = []) => {
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
    const categoryHours: { [key: string]: number } = {};
    
    data.forEach(entry => {
      if (entry.employee === employee) {
        const hours = Number(entry.hours) || 0;
        const revenue = Number(entry.jobTotal) || 0;
        
        totalHours += hours;
        totalRevenue += revenue;
        
        if (entry.category) {
          categoryHours[entry.category] = (categoryHours[entry.category] || 0) + hours;
        }
      }
    });

    setSelectedEmployeeHours(totalHours);
    setSelectedEmployeeRevenue(totalRevenue);

    const labels = Object.keys(categoryHours);
    const chartData = Object.values(categoryHours);

    if (labels.length === 0) {
      setEmployeeCategoryData(null);
      setEmployeePieChartData(null);
    } else {
      const datasets = [{
        label: 'Hours per Category',
        data: chartData,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }];

      // Add allocation lines
      employeeAllocations.forEach(allocation => {
        const categoryIndex = labels.findIndex(label => 
          label.toLowerCase() === allocation.billing_account.name.toLowerCase()
        );
        if (categoryIndex !== -1) {
          datasets.push({
            label: `${allocation.billing_account.name} Allocation`,
            data: labels.map((_, index) => 
              index === categoryIndex ? allocation.allocation_percentage * totalHours / 100 : null
            ),
            type: 'line' as const,
            borderColor: 'red',
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          });
        }
      });

      setEmployeeCategoryData({
        labels: labels,
        datasets: datasets
      });

      setEmployeePieChartData({
        labels: labels,
        datasets: [{
          data: chartData,
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
          ],
          hoverBackgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
          ]
        }]
      });
    }
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
    const employee = event.target.value;
    setSelectedEmployee(employee);
    
    if (employee) {
      const filteredData = billbackData.filter(entry => entry.employee === employee);
      calculateTotals(filteredData, false);
      
      try {
        const allocations = await fetchEmployeeTimeAllocations(employee);
        setEmployeeAllocations(allocations);
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
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ],
        hoverBackgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ]
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
    onClick: handleMainCategoryClick
  };

  const employeeChartOptions: ChartOptions<'pie'> = {
    ...categoryChartOptions,
    onClick: undefined
  };

  const barChartOptions: ChartOptions<'bar'> = {
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
        display: true
      },
      title: {
        display: true,
        text: `Hours per Category for ${selectedEmployee}`
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
        annotations: {
          capexLine: {
            type: 'line',
            display: (ctx) => ctx.chart.data.labels?.includes('2 CapEx - Other'),
            yMin: 6,
            yMax: 6,
            xMin: (ctx) => {
              const index = ctx.chart.data.labels?.indexOf('2 CapEx - Other') ?? -1;
              return index - 0.5;
            },
            xMax: (ctx) => {
              const index = ctx.chart.data.labels?.indexOf('2 CapEx - Other') ?? -1;
              return index + 0.5;
            },
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: '6 hours 🎯',
              position: 'end'
            }
          },
          rmLine: {
            type: 'line',
            display: (ctx) => ctx.chart.data.labels?.includes('1 R&M - General Labor'),
            yMin: 4,
            yMax: 4,
            xMin: (ctx) => {
              const index = ctx.chart.data.labels?.indexOf('1 R&M - General Labor') ?? -1;
              return index - 0.5;
            },
            xMax: (ctx) => {
              const index = ctx.chart.data.labels?.indexOf('1 R&M - General Labor') ?? -1;
              return index + 0.5;
            },
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: '4 hours 🎯',
              position: 'end'
            }
          }
        }
      }
    }
  };

  const employeePieChartOptions: ChartOptions<'pie'> = {
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
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw as number;
            const total = context.dataset.data.reduce((acc: number, current: number) => acc + current, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            let tooltipText = `${label}: ${percentage}%`;
            
            // Add notes to tooltip if available
            if (selectedEmployeeCategory && jobChartData && jobChartData.notes) {
              const notes = jobChartData.notes[context.dataIndex];
              if (notes) {
                tooltipText += `\nNotes: ${notes}`;
              }
            }
            
            return tooltipText;
          }
        }
      }
    },
    layout: {
      padding: {
        right: 50
      }
    },
    onClick: selectedEmployeeCategory ? undefined : handleEmployeePieChartClick
  };

  return (
    <Container maxW='5000px' py={2} height="auto" minHeight="100vh">
      <Flex direction="column" alignItems="stretch" height="100%">

        <Flex mb={4}>
          <HStack spacing={4} align="stretch" w={'23vw'} minWidth={'300px'} mr={4}>
            <Box p={4} shadow="md" borderWidth="1px" borderRadius="md" flex={1}>
              <Heading fontSize="lg">Billed Hours</Heading>
              <Text fontSize="2xl" fontWeight="bold">
                {isNaN(overallTotalHours) ? '0' : overallTotalHours.toFixed(2)}
              </Text>
            </Box>
            <Box p={4} shadow="md" borderWidth="1px" borderRadius="md" flex={1}>
              <Heading fontSize="lg">Billed Revenue</Heading>
              <Text color={"green.500"} fontSize="2xl" fontWeight="bold">
                ${isNaN(overallTotalRevenue) ? '0.00' : overallTotalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </Text>
            </Box>
          </HStack>
          <Box flex={1} /> {/* This empty box pushes the charts to the right */}
        </Flex>
        <Flex justify="space-between" mb={4} flexWrap="wrap">
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
        <Card mt={2} mb={20}>
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