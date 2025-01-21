// @ts-nocheck
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Select, useToast, Box, Button, Container, Flex, Heading, Image, Card, FormControl, FormLabel, SimpleGrid, IconButton, Center, Text, Tooltip, Spinner } from "@chakra-ui/react";
import BillbackDisplay from "@/components/features/table/billback-table";
import { v4 as uuidv4 } from 'uuid';
import { useBillingPeriod } from "@/contexts/BillingPeriodContext"; 
import { AddIcon, AttachmentIcon, CalendarIcon, RepeatIcon } from "@chakra-ui/icons"
import { saveJobs, upsertBillbackUpload, fetchBillbackUpload } 
from "@/lib/data-access/supabase-client";
import { fetchAllEmployees, fetchAllProperties, fetchAllPropertiesNoPagination,
   fetchAllBillingPeriods, fetchAllBillingAccountsNoPagination, fetchAllEntities,
   fetchAllPropertyGroups
} from "@/lib/data-access";
import { FaExclamationTriangle } from 'react-icons/fa';
import { useRouter } from 'next/router';
import CSVUpload from "@/components/ui/file-upload/upload";
import { CloseIcon } from '@chakra-ui/icons';

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
  const billbackDataRef = useRef(billbackData);
  const toast = useToast();
  const [entities, setEntities] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [propertyGroups, setPropertyGroups] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const router = useRouter();
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  // Near your other state declarations
  const { entryCount, totalHours, totalBilled } = useMemo(() => {
    return {
      entryCount: billbackData.length,
      totalHours: billbackData.reduce((sum, item) => sum + (parseFloat(item.hours) || 0), 0),
      totalBilled: billbackData.reduce((sum, item) => sum + (parseFloat(item.billingTotal || item.total) || 0), 0)
    };
  }, [billbackData]);

  // Update ref whenever billbackData changes
  useEffect(() => {
    billbackDataRef.current = billbackData;
  }, [billbackData]);

  const calculateTotals = (hours, laborRate, billingRate, mileage) => {
    // Labor total always uses labor rate
    const laborTotal = (hours * laborRate).toFixed(2);
    
    // Billing total uses billing rate if available, otherwise uses labor total
    const billingTotal = billingRate ? 
      (hours * billingRate).toFixed(2) : 
      laborTotal;
    
    const mileageTotal = (mileage * mileageRate).toFixed(2);
    
    // Job total is billing total + mileage
    const jobTotal = (parseFloat(billingTotal) + parseFloat(mileageTotal)).toFixed(2);
    
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

  const addRow = useCallback(() => {
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
      hours: "",
      rate: "",
      billingRate: "",
      total: "",
      billedmiles: "",
      mileageTotal: "",
      jobTotal: "",
      notes: "",
      isError: true,
      isManual: true
    };
    
    setBillbackData(prev => [newRow, ...prev]);
    setHasUnsavedChanges(true);
    setIsValid(false);
  }, []);

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

    // Add this check for property group billing accounts
    const isValidBillingAccount = propertyGroup ? 
        propertyGroup.billingAccounts.includes(billingAccount?.id) : 
        true;

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
        category: (billingAccount && isValidBillingAccount) ? 
            billingAccount.name : 
            `${job.category}`,
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
        isError: (!propertyGroup && !billingProperty) || !billingAccount || !isValidBillingAccount,
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

    // Add this check for property group billing accounts
    const isValidBillingAccount = propertyGroup ? 
        propertyGroup.billingAccounts.includes(billingAccount?.id) : 
        true;

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
        category: (billingAccount && isValidBillingAccount) ? 
            billingAccount.name : 
            `${job.category}`,
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
        isError: (!propertyGroup && !billingProperty) || !billingAccount || !isValidBillingAccount,
        isManual: true
    };
  };

  const handleDelete = useCallback((e, key) => {
    setBillbackData(prevData => {
      const newData = prevData.filter(item => item.rowId !== key);
      console.log(`Deleted row ${key}. New count: ${newData.length}`);
      return newData;
    });
    setHasUnsavedChanges(true);
  }, []);
  


  const handleEdit = useCallback((e, rowId, field) => {
    setBillbackData(prevData => {
      const newData = [...prevData];
      const index = newData.findIndex(row => row.rowId === rowId);
      if (index === -1) return prevData;

      const updatedRow = { ...newData[index] };
      
      // Handle different field types
      if (field === 'employee') {
        const selectedEmployee = employees.find(emp => emp.id === e.target.value);
        updatedRow.employeeId = e.target.value;
        updatedRow.employee = e.target.employeeName;
        // Recalculate totals with new employee rate
        if (selectedEmployee?.rate) {
          updatedRow.rate = selectedEmployee.rate;
          const { laborTotal, billingTotal, mileageTotal, jobTotal } = calculateTotals(
            updatedRow.hours || 0,
            selectedEmployee.rate,
            updatedRow.billingRate || 0,
            updatedRow.billedmiles || 0
          );
          updatedRow.total = laborTotal;
          updatedRow.billingTotal = billingTotal;
          updatedRow.mileageTotal = mileageTotal;
          updatedRow.jobTotal = jobTotal;
        }
      } else if (field === 'category') {
        const selectedAccount = billingAccounts.find(account => account.id === e.target.value);
        updatedRow.billingAccountId = e.target.value;
        updatedRow.category = selectedAccount?.name || '';
        updatedRow.billingRate = selectedAccount?.rate || 0;
        // Recalculate totals with new billing rate
        const { laborTotal, billingTotal, mileageTotal, jobTotal } = calculateTotals(
          updatedRow.hours || 0,
          updatedRow.rate || 0,
          selectedAccount?.rate || 0,
          updatedRow.billedmiles || 0
        );
        updatedRow.total = laborTotal;
        updatedRow.billingTotal = billingTotal;
        updatedRow.mileageTotal = mileageTotal;
        updatedRow.jobTotal = jobTotal;
      } else if (field === 'hours' || field === 'billedmiles') {
        const numericValue = e.target.value === '' ? 0 : Number(e.target.value) || 0;
        updatedRow[field] = e.target.value === '' ? '' : numericValue;
        
        if (e.target.value !== '') {
          const { laborTotal, billingTotal, mileageTotal, jobTotal } = calculateTotals(
            field === 'hours' ? numericValue : updatedRow.hours || 0,
            updatedRow.rate || 0,
            updatedRow.billingRate || 0,
            field === 'billedmiles' ? numericValue : updatedRow.billedmiles || 0
          );
          updatedRow.total = laborTotal;
          updatedRow.billingTotal = billingTotal;
          updatedRow.mileageTotal = mileageTotal;
          updatedRow.jobTotal = jobTotal;
        }
      } else if (field === 'property') {
        const selectedPropertyId = e.target.value;
        const isPropertyGroup = selectedPropertyId.startsWith('group-');
        
        if (isPropertyGroup) {
          const groupId = selectedPropertyId.replace('group-', '');
          const propertyGroup = propertyGroups.find(group => group.id === groupId);
          updatedRow.propertyId = selectedPropertyId;
          updatedRow.property = propertyGroup?.name || '';
          updatedRow.entityId = '';
          updatedRow.entity = '';
          
          // Check if current billing account is valid for this group
          const currentBillingAccountId = updatedRow.billingAccountId;
          if (currentBillingAccountId && propertyGroup) {
            const isValidBillingAccount = propertyGroup.billingAccounts.includes(currentBillingAccountId);
            if (!isValidBillingAccount) {
              // Clear the category if it's not valid for this group
              updatedRow.billingAccountId = '';
              updatedRow.category = '';
              updatedRow.billingRate = 0;
              // Recalculate totals without billing rate
              const { laborTotal, billingTotal, mileageTotal, jobTotal } = calculateTotals(
                updatedRow.hours || 0,
                updatedRow.rate || 0,
                0,
                updatedRow.billedmiles || 0
              );
              updatedRow.total = laborTotal;
              updatedRow.billingTotal = billingTotal;
              updatedRow.mileageTotal = mileageTotal;
              updatedRow.jobTotal = jobTotal;
            }
          }
        } else {
          const billingProperty = billingProperties.find(prop => prop.id === selectedPropertyId);
          updatedRow.propertyId = selectedPropertyId;
          updatedRow.property = billingProperty?.name || '';
          updatedRow.entityId = billingProperty?.entityid || '';
          updatedRow.entity = billingProperty?.entityName || '';
        }
      } else {
        updatedRow[field] = e.target.value;
      }

      // After all field updates, check if the row is still in error
      const isPropertyGroup = updatedRow.propertyId?.startsWith('group-');
      const propertyGroup = isPropertyGroup ? 
        propertyGroups.find(group => `group-${group.id}` === updatedRow.propertyId) : 
        null;
      const billingProperty = !isPropertyGroup ? 
        billingProperties.find(prop => prop.id === updatedRow.propertyId) : 
        null;
      
      // Row is in error if any required field is missing
      updatedRow.isError = (
        (!propertyGroup && !billingProperty) || // Must have valid property or group
        !updatedRow.billingAccountId ||         // Must have category
        !updatedRow.employeeId                  // Must have employee
      );

      newData[index] = updatedRow;
      return newData;
    });

    setHasUnsavedChanges(true);
  }, [employees, billingAccounts, propertyGroups, billingProperties, calculateTotals]);



  const tableConfig = [
    { 
      column: "delete", 
      label: "", 
      canSort: false,
      sticky: true,
      width: "35px"
    },
    { column: "employee", label: "Employee", canSort: false },
    { column: "job_date", label: "Date", canSort: false },
    { column: "property", label: "Property", canSort: false, width: "350px" },
    { 
      column: "entity", 
      label: "Entity", 
      canSort: false,
      width: "200px"
    },
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
    console.log("Current billbackData being saved:", billbackDataRef.current);
    setIsLoading(true);
    try {
        const result = await upsertBillbackUpload(billbackDataRef.current, billingPeriod);
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

  // Memoize filtered data
  const filteredData = useMemo(() => {
    return billbackData.filter(row => {
      // Employee filter
      if (employeeFilter && row.employeeId !== employeeFilter) {
        return false;
      }

      // Property filter
      if (propertyFilter && row.propertyId !== propertyFilter) {
        return false;
      }

      // Entity filter
      if (entityFilter && row.entityId !== entityFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter && row.billingAccountId !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [billbackData, employeeFilter, propertyFilter, entityFilter, categoryFilter]);

  // Memoize table configuration
  const memoizedTableConfig = useMemo(() => tableConfig, []);

  const handleFileUpload = async (file) => {
    console.log('File upload started:', file);
    try {
      // Your upload logic
      console.log('Upload response:', response);
      console.log('Processed data:', processedData); // or whatever variable holds your data
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  console.log('Current billbackData:', billbackData); // Add this before the return

  console.log('About to render BillbackDisplay with data:', {
    dataLength: billbackData?.length,
    firstItem: billbackData?.[0]
  });

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to leave this page?')) {
        router.events.emit('routeChangeError');
        throw 'Route change aborted.';
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [hasUnsavedChanges, router]);

  // Add this near your other useMemo hooks
  const totals = useMemo(() => {
    console.log('Calculating totals for', billbackData.length, 'rows');
    const result = billbackData.reduce((acc, item) => {
      const hours = parseFloat(item.hours) || 0;
      const total = parseFloat(item.billingTotal || item.total) || 0;
      console.log('Adding hours:', hours, 'total:', total);
      return {
        hours: acc.hours + hours,
        total: acc.total + total
      };
    }, { hours: 0, total: 0 });
    console.log('Final totals:', result);
    return result;
  }, [billbackData]);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      handleDataProcessed(file);
    }
  };

  // Create a helper function to handle all filter changes
  const handleFilterChange = async (type: string, value: string) => {
    setIsFiltering(true);
    
    // Use requestAnimationFrame to ensure loading state is rendered
    requestAnimationFrame(() => {
      switch(type) {
        case 'employee':
          setEmployeeFilter(value);
          break;
        case 'property':
          setPropertyFilter(value);
          break;
        case 'entity':
          setEntityFilter(value);
          break;
        case 'category':
          setCategoryFilter(value);
          break;
      }
      
      // Clear loading state after a brief delay to allow for table re-render
      setTimeout(() => {
        setIsFiltering(false);
      }, 0);
    });
  };

  return (
    <Box 
      h="100vh" 
      display="flex" 
      flexDirection="column" 
      overflow="hidden"
      p={0}  // Remove all padding
    >
      {/* Header Section */}
      <Flex 
        bg="white" 
        borderBottom="1px" 
        borderColor="gray.200" 
        p={4}
        h="7vh"
        alignItems="center"
        pb="1vh"
        justifyContent="space-between"
      >
        <Heading as="h1" size="lg">
          Time Management
        </Heading>
      </Flex>

      {/* First row with actions and totals */}
      <Flex 
        justify="space-between" 
        align="center" 
        px={4} 
        py={2}
        bg="gray.50"  // Lighter grey for the top bar
      >
        <Flex gap={4} align="center" width="300px">
          <IconButton
            aria-label="Add row"
            icon={<AddIcon />}
            size="xs"
            colorScheme="green"
            onClick={addRow}
          />

          <CSVUpload
            style={{ 
              width: '180px',
              background: 'white',
              border: '2px solid #E2E8F0',  // Default border
              borderRadius: '4px',
              transition: 'all 0.2s',  // Smooth transition for hover effect
              _hover: {
                border: '2px solid #63B3ED',  // Light blue border on hover (Chakra's blue.300)
                transform: 'translateY(-1px)',  // Slight lift effect
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',  // Subtle shadow on hover
                cursor: 'pointer'  // Add pointer cursor on hover
              }
            }}
            disabled={!billingPeriod}
            onDataProcessed={handleDataProcessed}
            setLoading={setIsLoading}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
          />
        </Flex>

        <Flex gap={6} fontSize="sm" color="gray.600" align="center">
          <Text>
            <Text as="span" fontWeight="bold">{entryCount}</Text> time entries
          </Text>
          <Text color="gray.300">|</Text>
          <Text>
            <Text as="span" fontWeight="bold">{Math.round(totalHours)}</Text> billed hours
          </Text>
          <Text color="gray.300">|</Text>
          <Text>
            <Text as="span" color="green.500">$<Text as="span" fontWeight="bold">{totalBilled.toFixed(2)}</Text></Text> billed total
          </Text>
        </Flex>

        <Box width="300px" textAlign="right">
          <Flex gap={2} justify="flex-end">
            <Button
              size="sm"
              variant="outline"
              colorScheme="green"
              bg="white"  // Add white background
              onClick={() => handleSaveProgress(true)}
              isLoading={isLoading}
              isDisabled={!hasUnsavedChanges}
            >
              Save Progress
            </Button>

            <Button
              size="sm"
              color="white"
              background="green.600"
              onClick={handleSubmit}
              isLoading={isUploading}
              isDisabled={!isValid || billbackData.length === 0}
              _hover={{
                bg: "green.500"
              }}
            >
              Invoice Jobs
            </Button>
          </Flex>
        </Box>
      </Flex>

      {/* Divider */}
      <Box borderBottom="1px" borderColor="gray.200" />

      {/* Second row with filters */}
      <Flex 
        px={4} 
        py={2} 
        gap={4} 
        borderBottom="1px" 
        borderColor="gray.200" 
        bg="gray.100"
        align="center"
      >
        <Text
          color="gray.600"
          fontSize="sm"
          fontWeight="medium"
        >
          Filters:
        </Text>
        <Flex align="center" gap={2}>
          <Select
            placeholder="All Employees"
            size="sm"
            width="200px"
            onChange={(e) => handleFilterChange('employee', e.target.value)}
            value={employeeFilter}
            bg="white"
          >
            {employees?.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </Select>
          {employeeFilter && (
            <CloseIcon 
              color="red.500"
              w={3}
              h={3}
              cursor="pointer"
              _hover={{ color: "red.600" }}
              onClick={() => handleFilterChange('employee', '')}
            />
          )}
        </Flex>

        <Flex align="center" gap={2}>
          <Select
            placeholder="All Properties"
            size="sm"
            width="200px"
            onChange={(e) => handleFilterChange('property', e.target.value)}
            value={propertyFilter}
            bg="white"
          >
            {billingProperties?.map(prop => (
              <option key={prop.id} value={prop.id}>{prop.name}</option>
            ))}
          </Select>
          {propertyFilter && (
            <CloseIcon 
              color="red.500"
              w={3}
              h={3}
              cursor="pointer"
              _hover={{ color: "red.600" }}
              onClick={() => handleFilterChange('property', '')}
            />
          )}
        </Flex>

        <Flex align="center" gap={2}>
          <Select
            placeholder="All Entities"
            size="sm"
            width="200px"
            onChange={(e) => handleFilterChange('entity', e.target.value)}
            value={entityFilter}
            bg="white"
          >
            {entities?.map(entity => (
              <option key={entity.id} value={entity.id}>{entity.name}</option>
            ))}
          </Select>
          {entityFilter && (
            <CloseIcon 
              color="red.500"
              w={3}
              h={3}
              cursor="pointer"
              _hover={{ color: "red.600" }}
              onClick={() => handleFilterChange('entity', '')}
            />
          )}
        </Flex>

        <Flex align="center" gap={2}>
          <Select
            placeholder="All Categories"
            size="sm"
            width="200px"
            onChange={(e) => handleFilterChange('category', e.target.value)}
            value={categoryFilter}
            bg="white"
          >
            {billingAccounts?.map(account => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </Select>
          {categoryFilter && (
            <CloseIcon 
              color="red.500"
              w={3}
              h={3}
              cursor="pointer"
              _hover={{ color: "red.600" }}
              onClick={() => handleFilterChange('category', '')}
            />
          )}
        </Flex>
      </Flex>

      {/* Add loading overlay */}
      {isFiltering && (
        <Center 
          position="absolute" 
          top="0" 
          left="0" 
          right="0" 
          bottom="0" 
          bg="whiteAlpha.700" 
          zIndex="overlay"
        >
          <Spinner size="xl" />
        </Center>
      )}

      {/* Main Content */}
      <Box 
        flex="1" 
        display="flex" 
        flexDirection="column" 
        overflow="auto"
        minWidth="100%"
        borderTop="1px"
        borderColor="gray.200"
        position="relative"
      >
        {isLoading ? (
          <Center h="200px">
            <Spinner size="xl" />
          </Center>
        ) : (
          <BillbackDisplay
            data={filteredData}
            tableConfig={memoizedTableConfig}
            handleEdit={handleEdit}
            accounts={billingAccounts}
            properties={billingProperties}
            employees={employees}
            handleDelete={handleDelete}
            entities={entities}
            propertyGroups={propertyGroups}
          />
        )}
      </Box>
    </Box>
  );
};
export default BillBack;
