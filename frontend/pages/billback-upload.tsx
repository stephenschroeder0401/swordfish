// @ts-nocheck
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { 
  Select, 
  useToast, 
  Box, 
  Button, 
  Container, 
  Flex, 
  Heading, 
  Image, 
  Card, 
  FormControl, 
  FormLabel, 
  SimpleGrid, 
  IconButton, 
  Center, 
  Text, 
  Tooltip, 
  Spinner, 
  Input,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Progress,
  Circle,
  VStack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  ModalFooter,
  Divider,
  ModalHeader,
  ModalCloseButton,
} from "@chakra-ui/react";
import { 
  AddIcon, 
  CheckIcon,
  AttachmentIcon, 
  CalendarIcon, 
  RepeatIcon, 
  CloseIcon, 
  ArrowForwardIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import BillbackDisplay from "@/components/features/table/billback-table";
import { v4 as uuidv4 } from 'uuid';
import { useBillingPeriod } from "@/contexts/BillingPeriodContext"; 
import { saveJobs, upsertBillbackUpload, fetchBillbackUpload } from "@/lib/data-access/supabase-client";
import { fetchAllEmployees, fetchAllProperties, fetchAllPropertiesNoPagination,
   fetchAllBillingPeriods, fetchAllBillingAccountsNoPagination, fetchAllEntities,
   fetchAllPropertyGroups
} from "@/lib/data-access";
import { FaExclamationTriangle } from 'react-icons/fa';
import { useRouter } from 'next/router';
import CSVUpload from "@/components/ui/file-upload/upload";
import Papa from 'papaparse';
// import OpenAI from 'openai';  // Comment out OpenAI import

// Add a new type for clarity
type FileFormat = 'timero' | 'manual' | 'progress';

// Update format detection function
const detectFileFormat = (firstRow: any): FileFormat => {
  // Check object keys instead of trying to join array
  const headers = Object.keys(firstRow);
  
  if (headers.includes('Clocked In At') && headers.includes('Clocked Out At')) {
    return 'timero';
  }
  if (headers.includes('Minutes') && headers.includes('Task')) {
    return 'manual';
  }
  if (headers.includes('Hours') && headers.includes('Employee')) {
    return 'progress';
  }
  
  // If data is already transformed (from upload.tsx)
  if (firstRow.format === 'timero' || firstRow.format === 'manual' || firstRow.format === 'progress') {
    return firstRow.format;
  }
  
  throw new Error('Unrecognized file format');
};

// Move this outside and above the BillBack component
interface AddRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rowData: any) => void;
  employees: any[];
  billingProperties: any[];  // Changed from properties to billingProperties
  billingAccounts: any[];
  calculateTotals: (hours: number, laborRate: number, billingRate: number, mileage: number) => any;
}

const AddRowModal: React.FC<AddRowModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employees,
  billingProperties,  // Changed from properties to billingProperties
  billingAccounts,
  calculateTotals,
}) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    propertyId: '',
    billingAccountId: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    mileage: '',
    notes: '',
    entity: '',
    entityId: ''
  });

  const handleFieldChange = (field: string, value: string) => {
    if (field === 'propertyId') {
      const property = billingProperties.find(prop => prop.id === value);
      setFormData(prev => ({
        ...prev,
        [field]: value,
        property: property?.name || '',
        entityId: property?.entityid || '',
        entity: property?.entityName || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add New Row</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <SimpleGrid columns={2} spacing={4}>
            <FormControl isRequired>
              <FormLabel>Employee</FormLabel>
              <Select
                value={formData.employeeId}
                onChange={(e) => handleFieldChange('employeeId', e.target.value)}
              >
                <option value="">Select Employee</option>
                {employees?.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Date</FormLabel>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Property</FormLabel>
              <Select
                value={formData.propertyId}
                onChange={(e) => handleFieldChange('propertyId', e.target.value)}
              >
                <option value="">Select Property</option>
                {billingProperties?.map(prop => (  // Changed from properties to billingProperties
                  <option key={prop.id} value={prop.id}>{prop.name}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Category</FormLabel>
              <Select
                value={formData.billingAccountId}
                onChange={(e) => handleFieldChange('billingAccountId', e.target.value)}
              >
                <option value="">Select Category</option>
                {billingAccounts?.map(account => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Hours</FormLabel>
              <Input
                type="number"
                step="0.01"
                value={formData.hours}
                onChange={(e) => handleFieldChange('hours', e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Mileage</FormLabel>
              <Input
                type="number"
                step="0.01"
                value={formData.mileage}
                onChange={(e) => handleFieldChange('mileage', e.target.value)}
              />
            </FormControl>

            <FormControl gridColumn="span 2">
              <FormLabel>Notes</FormLabel>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
              />
            </FormControl>
          </SimpleGrid>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="green"
            mr={3}
            onClick={() => onSubmit(formData)}
            isDisabled={
              !formData.employeeId ||
              !formData.propertyId ||
              !formData.billingAccountId ||
              !formData.hours
            }
          >
            Add Row
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
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
  const [chatInput, setChatInput] = useState('');
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isTimeroSyncing, setIsTimeroSyncing] = useState(false);
  const [isCalendarImporting, setIsCalendarImporting] = useState(false);
  const [showTimeroModal, setShowTimeroModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStage, setSyncStage] = useState('');
  
  // New state for corrections
  const [activeTab, setActiveTab] = useState(0);
  const [validationErrors, setValidationErrors] = useState({
    employees: new Set<string>(),
    properties: new Set<string>(),
    billingAccounts: new Set<string>()
  });
  const [selectedCorrections, setSelectedCorrections] = useState({
    employees: {},
    properties: {},
    billingAccounts: {}
  });
  const [showCorrectionsIndicator, setShowCorrectionsIndicator] = useState(false);
  const [isCorrectionsModalOpen, setIsCorrectionsModalOpen] = useState(false);
  const [isApplyingCorrections, setIsApplyingCorrections] = useState(false);

  // Near your other state declarations
  const { entryCount, totalHours, totalBilled } = useMemo(() => {
    // First, filter to get only billable items (same logic as in billableData calculation)
    const billableItems = billbackData.filter(item => {
      // Skip removed items
      if (item.removed) return false;
      // Skip items with errors
      if (item.isError) return false;
      // Only include billable categories
      const category = billingAccounts.find(acc => acc.id === item.billingAccountId);
      return category?.isbilledback === true; // Explicitly check for true
    });
    
    return {
      entryCount: billableItems.length,
      totalHours: billableItems.reduce((sum, item) => sum + (parseFloat(item.hours) || 0), 0),
      // Include the job total (which includes both billing total and mileage)
      totalBilled: billableItems.reduce((sum, item) => {
        // Use jobTotal which includes both billing total and mileage
        return sum + (parseFloat(item.jobTotal) || 0);
      }, 0),
    };
  }, [billbackData, billingAccounts]);

  // Update ref whenever billbackData changes
  useEffect(() => {
    billbackDataRef.current = billbackData;
  }, [billbackData]);

  const calculateTotals = (hours, laborRate, billingRate, mileage) => {
    // Ensure hours is a number, defaulting to 0 if undefined, null, or NaN
    const numericHours = hours === undefined || hours === null || hours === '' ? 0 : Number(hours) || 0;
    
    // Labor total always uses labor rate
    const laborTotal = (numericHours * laborRate).toFixed(2);
    
    // Billing total uses billing rate if available, otherwise uses labor total
    const billingTotal = billingRate ? 
      (numericHours * billingRate).toFixed(2) : 
      laborTotal;
    
    // Ensure mileage is a number, defaulting to 0 if undefined, null, or NaN
    const numericMileage = mileage === undefined || mileage === null || mileage === '' ? 0 : Number(mileage) || 0;
    const mileageTotal = (numericMileage * mileageRate).toFixed(2);
    
    // Job total is billing total + mileage
    const jobTotal = (parseFloat(billingTotal) + parseFloat(mileageTotal)).toFixed(2);
    
    return { laborTotal, billingTotal, mileageTotal, jobTotal };
  };

  useEffect(() => {
    const checkIsValid = () => {
      // Consider a row valid if:
      // 1. It has no isError flag
      // 2. It has all required fields (employee, property, billing account)
      // 3. Hours can be 0 or any valid number (not required to be > 0)
      const allValid = billbackData.every(row => 
        !row.isError && 
        row.employeeId && 
        row.propertyId && 
        row.billingAccountId
      );
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
    if (billingPeriod && billingAccounts.length && billingProperties.length && employees.length) {
        const fetchBillbackData = async () => {
            setIsLoading(true);
            try {
                const data = await fetchBillbackUpload(billingPeriod);
                
                if (!data || data.upload_data.length < 1) {
                    setBillbackData([]);
                } else {
                    const uploadData = data?.upload_data || [];
                    
                    // Format the date properly when processing existing data
                    const processedData = uploadData.map(job => {
                        // Format the date if needed
                        let jobDate = job.date || job.job_date || '';
                        
                        // If the date is not empty and not already in YYYY-MM-DD format, try to format it
                        if (jobDate && !/^\d{4}-\d{2}-\d{2}$/.test(jobDate)) {
                            try {
                                const date = new Date(jobDate);
                                if (!isNaN(date.getTime())) {
                                    jobDate = date.toISOString().split('T')[0];
                                }
                            } catch (e) {
                                console.error("Error formatting date during data load:", e);
                                // Keep the original date if there's an error
                            }
                        }
                        
                        // Pass through the job data with formatted date
                        const formattedJob = {
                            ...job,
                            date: jobDate,
                            job_date: jobDate
                        };
                        
                        if (job.isManual) {
                            return processManualJob(formattedJob);
                        } else {
                            return processTimeroJob(formattedJob);
                        }
                    });

                    setBillbackData(processedData);
                    const hasErrors = processedData.some(row => row.isError);
                    setIsValid(!hasErrors);
                }
            } catch (error) {
                console.error("Error:", error);
                setBillbackData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBillbackData();
    }
}, [billingPeriod, billingAccounts, billingProperties, employees, propertyGroups]);

  // Add new state for the modal
  const [isAddRowModalOpen, setIsAddRowModalOpen] = useState(false);

  const addRow = () => {
    setIsAddRowModalOpen(true);
  };

  const handleAddRowSubmit = (rowData) => {
    const { laborTotal, billingTotal, mileageTotal, jobTotal } = calculateTotals(
      rowData.hours === '' ? 0 : rowData.hours || 0,
      employees.find(emp => emp.id === rowData.employeeId)?.rate || 0,
      billingAccounts.find(acc => acc.id === rowData.billingAccountId)?.rate || 0,
      rowData.billedmiles === '' ? 0 : rowData.billedmiles || 0
    );

    const newRow = {
      ...rowData,
      total: laborTotal,
      billingTotal,
      mileageTotal,
      jobTotal,
      format: 'manual' as FileFormat,
      isError: false
    };

    setBillbackData(prevData => [...prevData, newRow]);
    setIsAddRowModalOpen(false);
    setHasUnsavedChanges(true);
  };

  const handleClearData = () => {
    setBillbackData(prevData => {
      return prevData.map(item => {
        if (
          // If on billable tab, only mark billable items as removed
          (activeTab === 0 && billingAccounts.find(acc => acc.id === item.billingAccountId)?.isbilledback && !item.isError && !item.removed) ||
          // If on unbillable tab, only mark unbillable items as removed
          (activeTab === 1 && !billingAccounts.find(acc => acc.id === item.billingAccountId)?.isbilledback && !item.isError && !item.removed) ||
          // If on corrections tab, only mark items with errors as removed
          (activeTab === 2 && item.isError && !item.removed) ||
          // If on removed tab, only affect already removed items
          (activeTab === 3 && item.removed)
        ) {
          return { ...item, removed: true };
        }
        return item;
      });
    });
    
    setHasUnsavedChanges(true);
  };

  // Function to completely remove all data
  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
      setBillbackData([]);
      setHasUnsavedChanges(true);
      toast({
        title: "All data cleared",
        description: "All time entries have been deleted",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    }
  };

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

        // Ensure job has a properly formatted date before processing
        if (job.date && !/^\d{4}-\d{2}-\d{2}$/.test(job.date)) {
          try {
            const date = new Date(job.date);
            if (!isNaN(date.getTime())) {
              job.date = date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error("Error formatting date in handleDataProcessed:", e);
            // Keep the original date if there's an error
          }
        }

        // Process based on format
        const processedJob = fileFormat === 'timero' ? 
          processTimeroJob(job) : 
          processManualJob(job);

        // Explicitly check for required fields after processing
        processedJob.isError = (
          !processedJob.employeeId ||           // Must have employee
          !processedJob.propertyId ||           // Must have property
          !processedJob.billingAccountId        // Must have category
          // Note: Zero hours is valid, so we don't check for !processedJob.hours
        );

        return processedJob;
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
    // Format the date properly to ensure it's in YYYY-MM-DD format
    let formattedDate = job.date || job.job_date || '';
    
    // If the date is not empty and not already in YYYY-MM-DD format, try to format it
    if (formattedDate && !/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      try {
        const date = new Date(formattedDate);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split('T')[0];
        }
      } catch (e) {
        console.error("Error formatting date:", e);
        // Keep the original date if there's an error
      }
    }

    // First check if the property name matches a property group
    const propertyGroup = propertyGroups.find(group => 
        group.name?.toLowerCase() === job.property?.toLowerCase()
    );
    
    const billingAccount = billingAccounts.find((account) => 
        account.name?.toLowerCase() === job.category?.toLowerCase() && 
        (account.is_deleted === false || account.is_deleted === null)
    );
    
    // Only look for individual property if no matching group found
    const billingProperty = !propertyGroup ? billingProperties.find((property) => 
        property.name?.toLowerCase() === job.property?.toLowerCase()
    ) : null;
    
    const employee = employees.find((employee) => 
        employee.name?.toLowerCase() === job.employee?.toLowerCase()
    );

    // Track validation errors - Update to handle all cases
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      
      // Employee validation
      if (!employee && job.employee) {
        newErrors.employees.add(job.employee);
      }

      // Property validation
      if (!propertyGroup && !billingProperty && job.property) {
        newErrors.properties.add(job.property);
      }

      // Billing account validation - Updated logic with debugging
      const needsBillingCorrection = (!billingAccount || (propertyGroup && !propertyGroup.billingAccounts.includes(billingAccount?.id))) && job.category;
      console.log("Billing validation:", {
          category: job.category,
          needsCorrection: needsBillingCorrection,
          reason: !billingAccount ? "Missing billing account" : 
                 (propertyGroup && !propertyGroup.billingAccounts.includes(billingAccount?.id)) ? "Invalid for property group" : 
                 "Valid"
      });

      if (needsBillingCorrection) {
        newErrors.billingAccounts.add(job.category);
      }

      // Update corrections indicator
      const hasErrors = (
        newErrors.employees.size > 0 || 
        newErrors.properties.size > 0 || 
        newErrors.billingAccounts.size > 0
      );
      setShowCorrectionsIndicator(hasErrors);

      return newErrors;
    });
    
    const rate = employee ? (Number(employee.rate) || 0) : 0;
    const billingRate = billingAccount ? (Number(billingAccount.rate) || 0) : 0;
    
    const mileage = (() => {
        if (!job) return 0;
        const mileageValue = job.mileage || job.billedmiles || job.Mileage || '0';
        const parsedMileage = Number(mileageValue);
        return isNaN(parsedMileage) ? 0 : parsedMileage;
    })();

    const { laborTotal, billingTotal, mileageTotal, jobTotal } = calculateTotals(
        job.hours === '' ? 0 : job.hours || 0, 
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

    // Update error checking to be more comprehensive
    const hasError = (
        !employee?.id || // Missing employee
        (!propertyGroup && !billingProperty) || // Missing property
        !billingAccount?.id || // Missing billing account
        (propertyGroup && !isValidBillingAccount) // Invalid billing account for property group
        // Removed !job.hours check - zero hours is valid
        // Removed isNaN(Number(job.hours)) check - we handle this elsewhere
    );

    return {
        rowId: job.rowId || uuidv4(),
        employeeId: employee?.id,
        employee: employee?.name || job.employee,
        job_date: formattedDate,
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
        billedmiles: mileage,
        mileageTotal,
        jobTotal,
        notes: job.notes,
        isError: hasError,
        isManual: false,
        originalEmployee: job.employee,
        originalProperty: job.property,
        originalCategory: job.category,
        removed: job.removed || false
    };
  };

  const processManualJob = (job) => {
    console.log("processing manual job ", job);
    // Format the date properly to ensure it's in YYYY-MM-DD format
    let formattedDate = job.date || job.job_date || '';
    
    // If the date is not empty and not already in YYYY-MM-DD format, try to format it
    if (formattedDate && !/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      try {
        const date = new Date(formattedDate);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split('T')[0];
        }
      } catch (e) {
        console.error("Error formatting date:", e);
        // Keep the original date if there's an error
      }
    }

    const hours = (() => {
      if (!job.hours && job.hours !== 0) return 0;
      const parsedHours = Number(job.hours);
      return isNaN(parsedHours) ? 0 : parsedHours;
    })();
    
    const propertyGroup = propertyGroups.find(group => 
        group.name?.toLowerCase() === job.property?.toLowerCase()
    );
    
    const billingAccount = billingAccounts.find((account) => 
        account.name?.toLowerCase() === job.category?.toLowerCase() && 
        (account.is_deleted === false || account.is_deleted === null)
    );
    
    const billingProperty = !propertyGroup ? billingProperties.find((property) => 
        property.name?.toLowerCase() === job.property?.toLowerCase()
    ) : null;
    
    const employee = employees.find((employee) => 
        employee.name?.toLowerCase() === job.employee?.toLowerCase()
    );

    // Track validation errors - Update to handle all cases
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      
      // Employee validation
      if (!employee && job.employee) {
        newErrors.employees.add(job.employee);
      }

      // Property validation
      if (!propertyGroup && !billingProperty && job.property) {
        newErrors.properties.add(job.property);
      }

      // Billing account validation - Updated logic with debugging
      const needsBillingCorrection = (!billingAccount || (propertyGroup && !propertyGroup.billingAccounts.includes(billingAccount?.id))) && job.category;
      console.log("Billing validation:", {
          category: job.category,
          needsCorrection: needsBillingCorrection,
          reason: !billingAccount ? "Missing billing account" : 
                 (propertyGroup && !propertyGroup.billingAccounts.includes(billingAccount?.id)) ? "Invalid for property group" : 
                 "Valid"
      });

      if (needsBillingCorrection) {
        newErrors.billingAccounts.add(job.category);
      }

      // Update corrections indicator
      const hasErrors = (
        newErrors.employees.size > 0 || 
        newErrors.properties.size > 0 || 
        newErrors.billingAccounts.size > 0
      );
      setShowCorrectionsIndicator(hasErrors);

      return newErrors;
    });
    
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

    // Update error checking to match processTimeroJob
    const hasError = (
        !employee?.id || // Missing employee
        (!propertyGroup && !billingProperty) || // Missing property
        !billingAccount?.id || // Missing billing account
        (propertyGroup && !isValidBillingAccount) // Invalid billing account for property group
        // Removed !hours check - zero hours is valid
        // Removed isNaN(Number(hours)) check - we handle this elsewhere
    );

    return {
        rowId: job.rowId || uuidv4(),
        employeeId: employee?.id,
        employee: employee?.name || job.employee,
        job_date: formattedDate,
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
        isError: hasError,
        isManual: true,
        originalEmployee: job.employee,
        originalProperty: job.property,
        originalCategory: job.category,
        removed: job.removed || false // Preserve the removed property
    };
  };

  const handleDelete = useCallback((e, key) => {
    setBillbackData(prevData => {
      // First check if the item is already in the Removed tab
      const itemToDelete = prevData.find(item => item.rowId === key);
      
      // If the item is already marked as removed, completely remove it from the array
      if (itemToDelete && itemToDelete.removed) {
        const filteredData = prevData.filter(item => item.rowId !== key);
        console.log(`Permanently deleted row ${key}. New count: ${filteredData.length}`);
        return filteredData;
      } 
      
      // Otherwise just mark it as removed
      const newData = prevData.map(item => {
        if (item.rowId === key) {
          return { ...item, removed: true };
        }
        return item;
      });
      console.log(`Marked row ${key} as removed. New count: ${newData.length}`);
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
            updatedRow.hours === '' ? 0 : updatedRow.hours || 0,
            selectedEmployee.rate,
            updatedRow.billingRate || 0,
            updatedRow.billedmiles === '' ? 0 : updatedRow.billedmiles || 0
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
        // Convert blank or invalid values to 0 for calculations, but preserve empty string in the UI
        const numericValue = e.target.value === '' ? 0 : Number(e.target.value) || 0;
        updatedRow[field] = e.target.value === '' ? '' : numericValue;
        
        // Always recalculate totals, even when value is empty (which will use 0)
        const { laborTotal, billingTotal, mileageTotal, jobTotal } = calculateTotals(
          field === 'hours' ? numericValue : (updatedRow.hours === '' ? 0 : updatedRow.hours || 0),
          updatedRow.rate || 0,
          updatedRow.billingRate || 0,
          field === 'billedmiles' ? numericValue : (updatedRow.billedmiles === '' ? 0 : updatedRow.billedmiles || 0)
        );
        updatedRow.total = laborTotal;
        updatedRow.billingTotal = billingTotal;
        updatedRow.mileageTotal = mileageTotal;
        updatedRow.jobTotal = jobTotal;
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
                updatedRow.hours === '' ? 0 : updatedRow.hours || 0,
                updatedRow.rate || 0,
                0,
                updatedRow.billedmiles === '' ? 0 : updatedRow.billedmiles || 0
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
        // Special handling for hours field
        if (field === 'hours') {
          // Convert blank or invalid hours to 0 for calculations, but preserve empty string in the UI
          const hoursValue = e.target.value;
          if (hoursValue === '' || isNaN(Number(hoursValue))) {
            updatedRow.hours = hoursValue === '' ? '' : 0;
          } else {
            updatedRow.hours = Number(hoursValue);
          }
          
          // Recalculate totals when hours change
          const { laborTotal, billingTotal, mileageTotal, jobTotal } = calculateTotals(
            hoursValue === '' ? 0 : updatedRow.hours || 0,
            updatedRow.rate || 0,
            updatedRow.billingRate || 0,
            updatedRow.billedmiles === '' ? 0 : updatedRow.billedmiles || 0
          );
          updatedRow.total = laborTotal;
          updatedRow.billingTotal = billingTotal;
          updatedRow.mileageTotal = mileageTotal;
          updatedRow.jobTotal = jobTotal;
        } else {
          updatedRow[field] = e.target.value;
        }
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
        // Note: hours can be 0 or empty, so we don't check for it here
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
      // First save progress
      await handleSaveProgress(false); // Pass false to not show the toast for intermediate save

      // Only process jobs from the billable tab
      const jobsToSave = billableData.filter(item => {
        // Skip removed items
        if (item.removed) return false;
        
        // Skip items with missing required IDs
        if (!item.employeeId || !item.propertyId || !item.billingAccountId) return false;
        
        return true;
      });

      // Then save jobs
      await saveJobs(jobsToSave, billingPeriod, propertyGroups);
      toast({
        title: `Successfully invoiced ${jobsToSave.length} jobs`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error invoicing jobs:", error);
      toast({
        title: "Error invoicing jobs",
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

  // Memoized filtered data
  const { billableData, unbillableData, correctablesData, removedData } = useMemo(() => {
    const filteredData = billbackData.filter(row => {
      const matchesEmployee = !employeeFilter || row.employeeId === employeeFilter;
      const matchesProperty = !propertyFilter || row.propertyId === propertyFilter;
      const matchesEntity = !entityFilter || row.entityId === entityFilter;
      const matchesCategory = !categoryFilter || row.billingAccountId === categoryFilter;
      return matchesEmployee && matchesProperty && matchesEntity && matchesCategory;
    });

    const activeRows = filteredData.filter(row => !row.removed);
    const errorRows = activeRows.filter(row => row.isError);
    const nonErrorRows = activeRows.filter(row => !row.isError);

    return {
      billableData: nonErrorRows.filter(row => {
        const category = billingAccounts.find(acc => acc.id === row.billingAccountId);
        return category?.isbilledback === true; // Explicitly check for true
      }),
      unbillableData: nonErrorRows.filter(row => {
        const category = billingAccounts.find(acc => acc.id === row.billingAccountId);
        return category?.isbilledback !== true; // Explicitly check not true
      }),
      correctablesData: errorRows,
      removedData: filteredData.filter(row => row.removed)
    };
  }, [billbackData, employeeFilter, propertyFilter, entityFilter, categoryFilter, billingAccounts]);

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
      const total = parseFloat(item.billingTotal) || 0;
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

  const openClearDialog = () => {
    // Implement the logic to open the clear dialog
    console.log("Clear dialog opened");
  };

  const handleExport = () => {
    // Transform billbackData to CSV-friendly format
    const exportData = billbackData.map(row => ({
      'Employee': row.employee,
      'Date': row.job_date,
      'Property': row.property,
      'Category': row.category,
      'Hours': row.hours,
      'Mileage': row.billedmiles,
      'Notes': row.notes,
      'Labor Total': row.total,
      'Billing Total': row.billingTotal,
      'Mileage Total': row.mileageTotal,
      'Job Total': row.jobTotal
    }));

    // Convert to CSV
    const csv = Papa.unparse(exportData);

    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `billback_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Comment out OpenAI client initialization
  // const openai = new OpenAI({
  //   apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  //   dangerouslyAllowBrowser: true
  // });

  // Comment out handleChatCommand function
  // const handleChatCommand = async (userInput: string) => {
  //   setIsChatProcessing(true);
  //   try {
  //     const appActions = {
  //       handleDelete: handleDelete,
  //       handleEdit: handleEdit,
  //       setBillbackData: setBillbackData,
  //       addRow: addRow,
  //       handleClearData: handleClearData,
  //       setHasUnsavedChanges: setHasUnsavedChanges,
  //       calculateTotals: calculateTotals,
  //     };

  //     const appState = {
  //       billbackData,
  //       employees,
  //       billingAccounts,
  //       propertyGroups,
  //       billingProperties,
  //       hasUnsavedChanges,
  //       isValid
  //     };

  //     console.log("Current billbackData:", billbackData);

  //     const completion = await openai.chat.completions.create({
  //       model: "gpt-3.5-turbo-0125",
  //       messages: [
  //         {
  //           role: "system",
  //           content: `You are an AI assistant with direct access to the billback application's functions.
  //           The billbackData array contains objects with these properties: rowId, employee (name string), employeeId, etc.
            
  //           Example of a row: ${JSON.stringify(billbackData[0])}
            
  //           Return a function that will be executed. For example:
  //           (state, actions) => {
  //             const rowsToDelete = state.billbackData.filter(row => row.employee === "Daniel Fransen");
  //             console.log("Found rows:", rowsToDelete.length);
  //             rowsToDelete.forEach(row => actions.handleDelete(null, row.rowId));
  //           }`
  //         },
  //         {
  //           role: "user",
  //           content: userInput
  //         }
  //       ]
  //     });

  //     const functionString = completion.choices[0].message.content;
  //     console.log("Generated function:", functionString);

  //     const func = new Function('return ' + functionString)();
  //     await func(appState, appActions);

  //     toast({
  //       title: "Action Completed",
  //       description: "The requested changes have been made",
  //       status: "success",
  //       duration: 3000,
  //       isClosable: true,
  //     });

  //   } catch (error) {
  //     console.error('Error:', error);
  //     toast({
  //       title: "Error",
  //       description: error.message || "Failed to process command",
  //       status: "error",
  //       duration: 3000,
  //       isClosable: true,
  //     });
  //   } finally {
  //     setIsChatProcessing(false);
  //     setChatInput('');
  //   }
  // };

  const handleTimeroSync = async () => {
    setIsTimeroSyncing(true);
    setShowTimeroModal(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      handleDataProcessed(mockTimeroData);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync with Timero",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsTimeroSyncing(false);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowTimeroModal(false);
    }
  };

  const handleCalendarImport = async () => {
    setIsCalendarImporting(true);
    setShowCalendarModal(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      handleDataProcessed(mockCalendarData);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import calendar entries",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCalendarImporting(false);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowCalendarModal(false);
    }
  };

  const TimeroSyncModal = () => (
    <Modal 
      isOpen={showTimeroModal} 
      onClose={() => setShowTimeroModal(false)}
      isCentered
    >
      <ModalOverlay 
        bg="blackAlpha.200"
        backdropFilter="blur(8px)"
      />
      <ModalContent 
        bg="white"
        boxShadow="xl"
        borderRadius="xl"
        p={8}
        maxW="sm"
      >
        <ModalBody>
          <VStack spacing={6}>
            <Text 
              fontSize="xl" 
              fontWeight="semibold"
              letterSpacing="tight"
              color="gray.700"
            >
              {isTimeroSyncing ? "Syncing with Timero" : "Sync Complete"}
            </Text>
            
            {isTimeroSyncing ? (
              <Spinner 
                size="lg" 
                color="blue.500" 
                thickness="3px"
                speed="0.8s"
              />
            ) : (
              <Text 
                color="green.500" 
                fontWeight="medium"
                fontSize="md"
              >
                ✨ Successfully synced 3 entries
              </Text>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );

  const CalendarSyncModal = () => (
    <Modal 
      isOpen={showCalendarModal} 
      onClose={() => setShowCalendarModal(false)}
      isCentered
    >
      <ModalOverlay 
        bg="blackAlpha.200"
        backdropFilter="blur(8px)"
      />
      <ModalContent 
        bg="white"
        boxShadow="xl"
        borderRadius="xl"
        p={8}
        maxW="sm"
      >
        <ModalBody>
          <VStack spacing={6}>
            <Text 
              fontSize="xl" 
              fontWeight="semibold"
              letterSpacing="tight"
              color="gray.700"
            >
              {isCalendarImporting ? "Importing Calendar" : "Import Complete"}
            </Text>
            
            {isCalendarImporting ? (
              <Spinner 
                size="lg" 
                color="orange.500"
                thickness="3px"
                speed="0.8s"
              />
            ) : (
              <Text 
                color="green.500" 
                fontWeight="medium"
                fontSize="md"
              >
                ✨ Successfully imported 4 entries
              </Text>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );

  // Add this before the return statement, after the other useEffect hooks
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey && activeTab === 2 &&
          (validationErrors.employees.size > 0 ||
           validationErrors.properties.size > 0 ||
           validationErrors.billingAccounts.size > 0)) {
        document.getElementById('apply-corrections-button')?.click();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [activeTab, validationErrors]);

  // Add this near the top of the component, after the state declarations
  useEffect(() => {
    console.log("=== Validation Errors State Changed ===");
    console.log("Current validation errors:", {
        employees: Array.from(validationErrors.employees),
        properties: Array.from(validationErrors.properties),
        billingAccounts: Array.from(validationErrors.billingAccounts)
    });
}, [validationErrors]);

  const handleInvoiceJobs = async () => {
    // Only process jobs from the billable tab
    const jobsToInvoice = billableData.map(row => ({
      ...row,
      billing_period_id: billingPeriod,
      status: 'invoiced'
    }));

    try {
      await saveJobs(jobsToInvoice);
      toast({
        title: "Jobs Invoiced",
        description: `Successfully invoiced ${jobsToInvoice.length} jobs`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error invoicing jobs:", error);
      toast({
        title: "Error",
        description: "Failed to invoice jobs. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
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
        bg="gray.50"
      >
        <Flex gap={2} align="center">
          <CSVUpload
            style={{ 
              width: '180px',
              background: 'white',
              border: '2px solid #E2E8F0',
              borderRadius: '4px',
              transition: 'all 0.2s',
              _hover: {
                border: '2px solid #63B3ED',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                cursor: 'pointer'
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
            <Text as="span" fontWeight="bold">{totalHours.toFixed(2)}</Text> billed hours
          </Text>
          <Text color="gray.300">|</Text>
          <Text>
            <Text as="span" color="green.500">$<Text as="span" fontWeight="bold">{totalBilled.toFixed(2)}</Text></Text> billed total
          </Text>
        </Flex>

        <Flex gap={2}>
          <Button
            size="sm"
            colorScheme="blue"
            variant="outline"
            onClick={handleExport}
            isDisabled={billbackData.length === 0}
            bg="white"
            _hover={{
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            colorScheme="green"
            variant="outline"
            bg="white"
            onClick={() => handleSaveProgress(true)}
            isLoading={isLoading}
            isDisabled={!hasUnsavedChanges}
            _hover={{
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            Save Progress
          </Button>
          <Button
            size="sm"
            colorScheme="green"
            onClick={handleSubmit}
            isLoading={isUploading}
            isDisabled={correctablesData.length > 0}
            _hover={{
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            {correctablesData.length > 0 ? `${correctablesData.length} Errors to Fix` : 'Invoice Jobs'}
          </Button>
        </Flex>
      </Flex>

      {/* Divider */}
      <Box borderBottom="1px" borderColor="gray.200" />

      {/* Second row with filters */}
      <Flex 
        px={4} 
        py={2} 
        borderBottom="1px" 
        borderColor="gray.200" 
        bg="gray.100"
        align="center" 
        justify="space-between"
      >
        <Flex align="center">
          <Button
            leftIcon={<AddIcon />}
            size="sm"
            colorScheme="green"
            variant="outline"
            onClick={addRow}
            bg="white"
            _hover={{
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            Add Row
          </Button>

          <Divider orientation="vertical" mx={4} height="24px" borderColor="gray.300" />

          <Flex gap={2} align="center">
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
        </Flex>

        <Flex align="center" gap={3}>
          <Button
            leftIcon={<CloseIcon />}
            size="xs"
            colorScheme="red"
            variant="outline"
            onClick={handleClearAllData}
            bg="white"
            _hover={{
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            Clear All
          </Button>

          {/* Corrections Link */}
          {showCorrectionsIndicator && (
            <Text
              color="red.500"
              fontWeight="semibold"
              cursor="pointer"
              textDecoration="underline"
              onClick={() => {
                setActiveTab(2);
                setIsCorrectionsModalOpen(true);
              }}
              display="flex"
              alignItems="center"
              fontSize="sm"
              _hover={{ 
                color: "red.600",
                transform: "translateY(-1px)"
              }}
              transition="all 0.2s"
            >
              Corrections Required!
              <Box
                ml={2}
                bg="red.500"
                color="white"
                borderRadius="full"
                w="5"
                h="5"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="xs"
                fontWeight="bold"
              >
                !
              </Box>
            </Text>
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
          <Tabs 
            variant="line"
            display="flex"
            flexDirection="column"
            h="100%"
            index={activeTab}
            onChange={(index) => {
              setActiveTab(index);
              // Close corrections modal if it was open
              if (isCorrectionsModalOpen) {
                setIsCorrectionsModalOpen(false);
              }
            }}
            sx={{
              '.chakra-tabs__tab': {
                py: 1,
                fontSize: 'sm',
                fontWeight: 'semibold',
                _selected: {
                  fontWeight: 'bold',
                  color: 'green.700',
                  borderColor: 'green.700'
                },
                _hover: {
                  color: 'green.600'
                }
              }
            }}
          >
            <TabList height="5vh">
              <Tab>
                Billable Time ({billableData.length})
              </Tab>
              <Tab>
                Unbillable Time ({unbillableData.length})
              </Tab>
              <Tab 
                color="orange.500" 
                _selected={{ color: 'orange.700', borderColor: 'orange.700' }}
                _hover={{ color: 'orange.600' }}
              >
                Needs Correction ({correctablesData.length})
              </Tab>
              <Tab 
                color="red.400" 
                _selected={{ color: 'red.600', borderColor: 'red.600' }}
                _hover={{ color: 'red.500' }}
              >
                Removed ({removedData.length})
              </Tab>
            </TabList>

            <TabPanels flex="1" overflow="hidden">
              <TabPanel p={0}>
                <BillbackDisplay
                  data={billableData}
                  tableConfig={memoizedTableConfig}
                  handleEdit={handleEdit}
                  accounts={billingAccounts.filter(acc => acc.isbilledback)}
                  properties={billingProperties}
                  employees={employees}
                  handleDelete={handleDelete}
                  entities={entities}
                  propertyGroups={propertyGroups}
                  openClearDialog={openClearDialog}
                />
              </TabPanel>
              <TabPanel p={0}>
                <BillbackDisplay
                  data={unbillableData}
                  tableConfig={memoizedTableConfig}
                  handleEdit={handleEdit}
                  accounts={billingAccounts.filter(acc => !acc.isbilledback)}
                  properties={billingProperties}
                  employees={employees}
                  handleDelete={handleDelete}
                  entities={entities}
                  propertyGroups={propertyGroups}
                  openClearDialog={openClearDialog}
                />
              </TabPanel>
              <TabPanel p={0}>
                <BillbackDisplay
                  data={correctablesData}
                  tableConfig={memoizedTableConfig}
                  handleEdit={handleEdit}
                  accounts={billingAccounts}
                  properties={billingProperties}
                  employees={employees}
                  handleDelete={handleDelete}
                  entities={entities}
                  propertyGroups={propertyGroups}
                  openClearDialog={openClearDialog}
                />
              </TabPanel>
              <TabPanel p={0}>
                <BillbackDisplay
                  data={removedData}
                  tableConfig={memoizedTableConfig}
                  handleEdit={handleEdit}
                  accounts={billingAccounts}
                  properties={billingProperties}
                  employees={employees}
                  handleDelete={handleDelete}
                  entities={entities}
                  propertyGroups={propertyGroups}
                  openClearDialog={openClearDialog}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </Box>

      {/* Corrections Modal */}
      <Modal 
        isOpen={isCorrectionsModalOpen} 
        onClose={() => setIsCorrectionsModalOpen(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalOverlay 
          bg="blackAlpha.300"
          backdropFilter="blur(10px)"
        />
        <ModalContent 
          maxW="1000px"
          mx={4}
          maxH="85vh"
          display="flex"
          flexDirection="column"
        >
          {/* Modal Header */}
          <ModalHeader 
            p={6} 
            borderBottom="1px" 
            borderColor="gray.200"
            bg="white"
          >
            <Flex justify="space-between" align="center">
              <Heading size="md">Data Corrections Required</Heading>
              <IconButton
                icon={<CloseIcon />}
                aria-label="Close modal"
                variant="ghost"
                size="sm"
                onClick={() => setIsCorrectionsModalOpen(false)}
              />
            </Flex>
          </ModalHeader>

          {/* Modal Body */}
          <ModalBody 
            p={6} 
            overflowY="auto"
            flex="1"
          >
            <VStack spacing={8} align="stretch">
              {/* Summary Stats */}
              <Flex 
                justify="space-between" 
                bg="white" 
                p={4} 
                borderRadius="lg" 
                boxShadow="sm"
                borderWidth="1px"
                borderColor="gray.100"
                position="sticky"
                top={0}
                zIndex={1}
              >
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>Employee Corrections</Text>
                  <Text fontSize="2xl" fontWeight="bold" color={validationErrors.employees.size > 0 ? "red.500" : "green.500"}>
                    {validationErrors.employees.size}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>Property Corrections</Text>
                  <Text fontSize="2xl" fontWeight="bold" color={validationErrors.properties.size > 0 ? "red.500" : "green.500"}>
                    {validationErrors.properties.size}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>Category Corrections</Text>
                  <Text fontSize="2xl" fontWeight="bold" color={validationErrors.billingAccounts.size > 0 ? "red.500" : "green.500"}>
                    {validationErrors.billingAccounts.size}
                  </Text>
                </Box>
              </Flex>

              {/* Correction Sections */}
              <VStack spacing={6} align="stretch">
                {/* Employee Corrections */}
                {validationErrors.employees.size > 0 && (
                  <Box 
                    bg="white" 
                    borderRadius="lg" 
                    boxShadow="sm"
                    borderWidth="1px"
                    borderColor="gray.100"
                    overflow="hidden"
                  >
                    <Flex 
                      bg="blue.50" 
                      p={4} 
                      borderBottomWidth="1px" 
                      borderColor="gray.100"
                      align="center"
                    >
                      <Box flex="1">
                        <Heading size="sm" color="blue.700">Employee Corrections</Heading>
                        <Text fontSize="sm" color="blue.600" mt={1}>
                          Match unrecognized employees to existing records
                        </Text>
                      </Box>
                      <Text 
                        fontSize="sm" 
                        color="blue.600"
                        bg="blue.100"
                        px={2}
                        py={1}
                        borderRadius="md"
                      >
                        {validationErrors.employees.size} items
                      </Text>
                    </Flex>
                    <VStack spacing={0} align="stretch" divider={<Box borderBottomWidth="1px" borderColor="gray.100" />}>
                      {Array.from(validationErrors.employees).map(invalidEmployee => (
                        <Flex 
                          key={invalidEmployee} 
                          p={4} 
                          justify="space-between" 
                          align="center"
                          _hover={{ bg: "gray.50" }}
                          transition="background 0.2s"
                        >
                          <Box>
                            <Text fontWeight="medium" color="gray.700">{invalidEmployee}</Text>
                            <Text fontSize="sm" color="gray.500">Unrecognized employee</Text>
                          </Box>
                          <Select
                            placeholder="Select employee"
                            width="300px"
                            size="sm"
                            value={selectedCorrections.employees[invalidEmployee] || ''}
                            onChange={(e) => {
                              setSelectedCorrections(prev => ({
                                ...prev,
                                employees: {
                                  ...prev.employees,
                                  [invalidEmployee]: e.target.value
                                }
                              }));
                            }}
                            bg="white"
                            borderColor={selectedCorrections.employees[invalidEmployee] ? "green.200" : "gray.200"}
                            _hover={{ borderColor: "blue.300" }}
                          >
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name}
                              </option>
                            ))}
                          </Select>
                        </Flex>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Property Corrections */}
                {validationErrors.properties.size > 0 && (
                  <Box 
                    bg="white" 
                    borderRadius="lg" 
                    boxShadow="sm"
                    borderWidth="1px"
                    borderColor="gray.100"
                    overflow="hidden"
                  >
                    <Flex 
                      bg="purple.50" 
                      p={4} 
                      borderBottomWidth="1px" 
                      borderColor="gray.100"
                      align="center"
                    >
                      <Box flex="1">
                        <Heading size="sm" color="purple.700">Property Corrections</Heading>
                        <Text fontSize="sm" color="purple.600" mt={1}>
                          Match unrecognized properties to existing properties or groups
                        </Text>
                      </Box>
                      <Text 
                        fontSize="sm" 
                        color="purple.600"
                        bg="purple.100"
                        px={2}
                        py={1}
                        borderRadius="md"
                      >
                        {validationErrors.properties.size} items
                      </Text>
                    </Flex>
                    <VStack spacing={0} align="stretch" divider={<Box borderBottomWidth="1px" borderColor="gray.100" />}>
                      {Array.from(validationErrors.properties).map(invalidProperty => (
                        <Flex 
                          key={invalidProperty} 
                          p={4} 
                          justify="space-between" 
                          align="center"
                          _hover={{ bg: "gray.50" }}
                          transition="background 0.2s"
                        >
                          <Box>
                            <Text fontWeight="medium" color="gray.700">{invalidProperty}</Text>
                            <Text fontSize="sm" color="gray.500">Unrecognized property</Text>
                          </Box>
                          <Select
                            placeholder="Select property"
                            width="300px"
                            size="sm"
                            value={selectedCorrections.properties[invalidProperty] || ''}
                            onChange={(e) => {
                              setSelectedCorrections(prev => ({
                                ...prev,
                                properties: {
                                  ...prev.properties,
                                  [invalidProperty]: e.target.value
                                }
                              }));
                            }}
                            bg="white"
                            borderColor={selectedCorrections.properties[invalidProperty] ? "green.200" : "gray.200"}
                            _hover={{ borderColor: "purple.300" }}
                          >
                            <option value="">Select property...</option>
                            <optgroup label="Property Groups">
                              {propertyGroups.map(group => (
                                <option key={`group-${group.id}`} value={`group-${group.id}`}>
                                  {group.name}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Individual Properties">
                              {billingProperties.map(prop => (
                                <option key={prop.id} value={prop.id}>
                                  {prop.name}
                                </option>
                              ))}
                            </optgroup>
                          </Select>
                        </Flex>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Billing Account Corrections */}
                {validationErrors.billingAccounts.size > 0 && (
                  <Box 
                    bg="white" 
                    borderRadius="lg" 
                    boxShadow="sm"
                    borderWidth="1px"
                    borderColor="gray.100"
                    overflow="hidden"
                  >
                    <Flex 
                      bg="orange.50" 
                      p={4} 
                      borderBottomWidth="1px" 
                      borderColor="gray.100"
                      align="center"
                    >
                      <Box flex="1">
                        <Heading size="sm" color="orange.700">Billing Category Corrections</Heading>
                        <Text fontSize="sm" color="orange.600" mt={1}>
                          Match unrecognized billing categories to existing categories
                        </Text>
                      </Box>
                      <Text 
                        fontSize="sm" 
                        color="orange.600"
                        bg="orange.100"
                        px={2}
                        py={1}
                        borderRadius="md"
                      >
                        {validationErrors.billingAccounts.size} items
                      </Text>
                    </Flex>
                    <VStack spacing={0} align="stretch" divider={<Box borderBottomWidth="1px" borderColor="gray.100" />}>
                      {Array.from(validationErrors.billingAccounts).map((invalidAccount, index) => (
                          <Flex 
                              key={`billing-account-${index}`}
                              p={4} 
                              justify="space-between" 
                              align="center"
                              _hover={{ bg: "gray.50" }}
                              transition="background 0.2s"
                          >
                              <Box maxW="50%">
                                  <Text fontWeight="medium" color="gray.700">{invalidAccount}</Text>
                                  <Text fontSize="sm" color="gray.500">Unrecognized category</Text>
                              </Box>
                              <Select
                                  placeholder="Select category"
                                  width="300px"
                                  size="sm"
                                  value={selectedCorrections.billingAccounts[invalidAccount] || ''}
                                  onChange={(e) => {
                                      setSelectedCorrections(prev => ({
                                          ...prev,
                                          billingAccounts: {
                                              ...prev.billingAccounts,
                                              [invalidAccount]: e.target.value
                                          }
                                      }));
                                  }}
                                  bg="white"
                                  borderColor={selectedCorrections.billingAccounts[invalidAccount] ? "green.200" : "gray.200"}
                                  _hover={{ borderColor: "orange.300" }}
                              >
                                  {billingAccounts.map(account => (
                                      <option key={account.id} value={account.id}>
                                          {account.name}
                                      </option>
                                  ))}
                              </Select>
                          </Flex>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            </VStack>
          </ModalBody>

          {/* Modal Footer */}
          <ModalFooter
            p={6}
            bg="white"
            borderTop="1px"
            borderColor="gray.100"
            position="sticky"
            bottom={0}
            width="full"
            zIndex={1}
          >
            <Button
              colorScheme="green"
              size="md"
              isLoading={isApplyingCorrections}
              onClick={() => {
                setIsApplyingCorrections(true);
                console.log("Current validation errors:", {
                    employees: Array.from(validationErrors.employees),
                    properties: Array.from(validationErrors.properties),
                    billingAccounts: Array.from(validationErrors.billingAccounts)
                });

                // Apply corrections to all matching rows
                setBillbackData(prevData => {
                    return prevData.map(row => {
                        const newRow = { ...row };
                        let wasUpdated = false;

                        // Apply employee corrections
                        if (row.originalEmployee && selectedCorrections.employees[row.originalEmployee]) {
                            const correctedEmployee = employees.find(
                                emp => emp.id === selectedCorrections.employees[row.originalEmployee]
                            );
                            if (correctedEmployee) {
                                newRow.employeeId = correctedEmployee.id;
                                newRow.employee = correctedEmployee.name;
                                newRow.rate = correctedEmployee.rate;
                                wasUpdated = true;
                            }
                        }

                        // Apply property corrections
                        if (row.originalProperty && selectedCorrections.properties[row.originalProperty]) {
                            const selectedId = selectedCorrections.properties[row.originalProperty];
                            const isGroup = selectedId.startsWith('group-');
                            
                            if (isGroup) {
                                const groupId = selectedId.replace('group-', '');
                                const propertyGroup = propertyGroups.find(group => group.id === groupId);
                                if (propertyGroup) {
                                    newRow.propertyId = selectedId;
                                    newRow.property = propertyGroup.name;
                                    newRow.entityId = '';
                                    newRow.entity = '';
                                    wasUpdated = true;
                                }
                            } else {
                                const property = billingProperties.find(prop => prop.id === selectedId);
                                if (property) {
                                    newRow.propertyId = property.id;
                                    newRow.property = property.name;
                                    newRow.entityId = property.entityid;
                                    newRow.entity = property.entityName;
                                    wasUpdated = true;
                                }
                            }
                        }

                        // Apply billing account corrections
                        if (row.originalCategory && selectedCorrections.billingAccounts[row.originalCategory]) {
                            const correctedAccount = billingAccounts.find(
                                acc => acc.id === selectedCorrections.billingAccounts[row.originalCategory]
                            );
                            if (correctedAccount) {
                                newRow.billingAccountId = correctedAccount.id;
                                newRow.category = correctedAccount.name;
                                newRow.billingRate = correctedAccount.rate;
                                wasUpdated = true;
                            }
                        }

                        if (wasUpdated) {
                            // Recalculate totals only if updates were made
                            const { laborTotal, billingTotal, mileageTotal, jobTotal } = calculateTotals(
                                newRow.hours === '' ? 0 : newRow.hours || 0,
                                newRow.rate || 0,
                                newRow.billingRate || 0,
                                newRow.billedmiles === '' ? 0 : newRow.billedmiles || 0
                            );
                            
                            newRow.total = laborTotal;
                            newRow.billingTotal = billingTotal;
                            newRow.mileageTotal = mileageTotal;
                            newRow.jobTotal = jobTotal;

                            // Update error state with comprehensive check
                            const propertyGroup = newRow.propertyId?.startsWith('group-') ?
                                propertyGroups.find(group => `group-${group.id}` === newRow.propertyId) :
                                null;
                            const billingProperty = !propertyGroup ?
                                billingProperties.find(prop => prop.id === newRow.propertyId) :
                                null;
                            const isValidBillingAccount = propertyGroup ?
                                propertyGroup.billingAccounts.includes(newRow.billingAccountId) :
                                true;

                            newRow.isError = (
                                !newRow.employeeId || // Missing employee
                                (!propertyGroup && !billingProperty) || // Missing property
                                !newRow.billingAccountId || // Missing billing account
                                (propertyGroup && !isValidBillingAccount) // Invalid billing account for property group
                                // Removed !newRow.hours check - zero hours is valid
                                // Removed isNaN(Number(newRow.hours)) check - we handle this elsewhere
                            );
                        }

                        return newRow;
                    });
                });

                // Set hasUnsavedChanges to true since we've modified the data
                setHasUnsavedChanges(true);

                // Recheck for remaining errors after applying corrections
                setTimeout(() => {
                    setBillbackData(prevData => {
                        const newValidationErrors = {
                            employees: new Set<string>(),
                            properties: new Set<string>(),
                            billingAccounts: new Set<string>()
                        };

                        prevData.forEach(row => {
                            if (!row.employeeId && row.employee) {
                                newValidationErrors.employees.add(row.employee);
                            }
                            if (!row.propertyId && row.property) {
                                newValidationErrors.properties.add(row.property);
                            }
                            // Updated billing account validation check
                            const propertyGroup = row.propertyId?.startsWith('group-') ?
                                propertyGroups.find(group => `group-${group.id}` === row.propertyId) :
                                null;
                            if ((!row.billingAccountId || 
                                (propertyGroup && !propertyGroup.billingAccounts.includes(row.billingAccountId))) 
                                && row.category) {
                                newValidationErrors.billingAccounts.add(row.category);
                            }
                        });

                        console.log("Remaining validation errors after corrections:", {
                            employees: Array.from(newValidationErrors.employees),
                            properties: Array.from(newValidationErrors.properties),
                            billingAccounts: Array.from(newValidationErrors.billingAccounts)
                        });

                        setValidationErrors(newValidationErrors);
                        setShowCorrectionsIndicator(
                            newValidationErrors.employees.size > 0 ||
                            newValidationErrors.properties.size > 0 ||
                            newValidationErrors.billingAccounts.size > 0
                        );

                        return prevData;
                    });
                    
                    // Clear corrections and update UI
                    setSelectedCorrections({
                        employees: {},
                        properties: {},
                        billingAccounts: {}
                    });
                    setActiveTab(0);

                    // Show success toast
                    toast({
                        title: "Corrections Applied",
                        description: "All corrections have been applied successfully",
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                    });
                    setIsCorrectionsModalOpen(false);
                    setIsApplyingCorrections(false);
                }, 500); // Added a slight delay to ensure UI updates and loading state is visible
            }}
            ml="auto"
            px={6}
            py={4}
            height="auto"
            fontSize="sm"
            fontWeight="medium"
            bg="green.400"
            color="white"
            rightIcon={<CheckIcon boxSize={4} />}
            _hover={{
                bg: "green.500",
                transform: "translateY(-2px)",
                boxShadow: "lg"
            }}
            _active={{
                bg: "green.600",
                transform: "translateY(0)",
                boxShadow: "md"
            }}
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        >
            Apply Corrections
        </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {isChatExpanded ? (
        <Box
          position="fixed"
          bottom="4"
          right="4"
          width="400px"
          bg="gray.50"
          borderRadius="md"
          boxShadow="sm"
          p="4"
          zIndex="1000"
          border="2px solid"
          borderColor="green.200"
          transition="all 0.2s"
        >
          <Flex 
            align="center" 
            mb="4" 
            justify="space-between" 
            cursor="pointer"
            onClick={() => setIsChatExpanded(false)}
          >
            <Text 
              color="gray.700" 
              fontWeight="semibold" 
              fontSize="sm"
            >
              SwordFish Assist
            </Text>
            <IconButton
              aria-label="Collapse chat"
              icon={<ChevronRightIcon />}
              size="sm"
              variant="ghost"
              color="gray.500"
            />
          </Flex>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleChatCommand(chatInput);
          }}>
            <Flex direction="column">
              <Textarea
                placeholder="Type a command... (Press Shift + Enter to submit)"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                bg="white"
                color="gray.800"
                _placeholder={{ color: 'gray.400' }}
                mb="2"
                borderColor="gray.200"
                _hover={{ borderColor: 'gray.300' }}
                _focus={{ 
                  borderColor: 'green.300', 
                  boxShadow: '0 0 0 1px var(--chakra-colors-green-300)'
                }}
                rows={4}
                resize="none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.shiftKey) {
                    e.preventDefault();
                    handleChatCommand(chatInput);
                  }
                }}
              />
              <Button
                rightIcon={isChatProcessing ? <Spinner size="sm" /> : <ArrowForwardIcon />}
                bg="white"
                color="gray.700"
                border="1px solid"
                borderColor="gray.200"
                _hover={{ bg: 'gray.50' }}
                type="submit"
                isLoading={isChatProcessing}
                alignSelf="flex-end"
              >
                Send
              </Button>
            </Flex>
          </form>
        </Box>
      ) : (
        <Box
          position="fixed"
          bottom="20"
          right="0"
          zIndex="1000"
          cursor="pointer"
          onClick={() => setIsChatExpanded(true)}
        >
          <Flex
            bg="gray.50"
            border="2px solid"
            borderRight="none"
            borderColor="green.200"
            borderLeftRadius="md"
            py="3"
            px="2"
            align="center"
            transform="translateX(120px)"
            _hover={{ transform: "translateX(0)" }}
            transition="all 0.2s"
            width="150px"
          >
            <ChevronLeftIcon color="gray.600" boxSize="5" />
            <Text
              color="gray.700"
              fontWeight="semibold"
              fontSize="sm"
              ml="3"
              whiteSpace="nowrap"
            >
              SwordFish Assist
            </Text>
          </Flex>
        </Box>
      )}
      {/* Commented out for future implementation
      <TimeroSyncModal />
      <CalendarSyncModal />
      */}
      <AddRowModal
        isOpen={isAddRowModalOpen}
        onClose={() => setIsAddRowModalOpen(false)}
        onSubmit={handleAddRowSubmit}
        employees={employees}
        billingProperties={billingProperties}  // Changed from properties to billingProperties
        billingAccounts={billingAccounts}
        calculateTotals={calculateTotals}
      />
    </Box>
  );
};
export default BillBack;

const mockTimeroData = [
  {
    employee: "Jonathan Balding",
    date: "2024-09-22",
    property: "Lincoln Unit 1460-2",
    category: "1 R&M - General Labor",
    clockedInAt: "2024-09-22T08:00:00",
    clockedOutAt: "2024-09-22T08:31:00",
    hours: "0.52",
    mileage: "0.51",
    notes: "met pro router guy",
    format: "timero"
  },
  {
    employee: "Jonathan Balding",
    date: "2024-09-22",
    property: "1009 Colorado Ave Unit B",
    category: "1 R&M - HVAC & Plumbing",
    clockedInAt: "2024-09-22T09:00:00",
    clockedOutAt: "2024-09-22T10:22:00",
    hours: "1.37",
    mileage: "8.68",
    notes: "Installed new garbage disposal",
    format: "timero"
  },
  {
    employee: "Jonathan Balding",
    date: "2024-09-26",
    property: "3135 Perkins Unit A",
    category: "2 CapEx - Unit Turns",
    clockedInAt: "2024-09-26T13:00:00",
    clockedOutAt: "2024-09-26T15:35:00",
    hours: "2.58",
    mileage: "6.78",
    notes: "Repaired fallen fence",
    format: "timero"
  }
];

const mockCalendarData = [
  {
    employee: "Jonathan Balding",
    date: "2024-09-26",
    property: "3135 Perkins Unit A",
    category: "2 CapEx - Unit Turns",
    clockedInAt: null,
    clockedOutAt: null,
    hours: "5.87",
    mileage: "13.12",
    notes: "touchup paint, replaced things, elms out front and back with tordon",
    format: "progress"
  },
  {
    employee: "Jonathan Balding",
    date: "2024-09-24",
    property: "Courtyard - Whole Building",
    category: "1 R&M - General Labor",
    clockedInAt: null,
    clockedOutAt: null,
    hours: "1.23",
    mileage: "3.52",
    notes: "learned how to use camera system",
    format: "progress"
  },
  {
    employee: "Jonathan Balding",
    date: "2024-09-24",
    property: "3135 Perkins Unit A",
    category: "2 CapEx - Unit Turns",
    clockedInAt: null,
    clockedOutAt: null,
    hours: "6.78",
    mileage: "25.64",
    notes: "home depot run and started turn",
    format: "progress"
  },
  {
    employee: "Jonathan Balding",
    date: "2024-09-29",
    property: "*WSPM Internal",
    category: "WSPM Internal",
    clockedInAt: null,
    clockedOutAt: null,
    hours: "1.18",
    mileage: "0",
    notes: "weekly meeting",
    format: "progress"
  }
];
