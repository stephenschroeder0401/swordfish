import React, { useState, useCallback, useMemo } from 'react';
import { Box, useDisclosure, Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import { v4 as uuidv4 } from 'uuid';
import { 
  BillbackRow, 
  ValidationErrors, 
  SelectedCorrections,
  Employee,
  Property,
  Entity,
  BillingAccount 
} from './types';
import { detectFileFormat, calculateTotals, filterBillbackData } from './utils';
import BillbackHeader from './billback-header';
import FiltersBar from './filters-bar';
import ActionsBar from './actions-bar';
import DataTable from './data-table';
import CorrectionsModal from './corrections-modal';
import ChatAssistant from './chat-assistant';

interface BillbackUploadProps {
  employees: Employee[];
  billingProperties: Property[];
  entities: Entity[];
  billingAccounts: BillingAccount[];
  onSave: (data: BillbackRow[]) => Promise<void>;
  onExport: (data: BillbackRow[]) => Promise<void>;
  onInvoice: (data: BillbackRow[]) => Promise<void>;
  onChatMessage: (message: string) => Promise<string>;
}

const BillbackUpload: React.FC<BillbackUploadProps> = ({
  employees,
  billingProperties,
  entities,
  billingAccounts,
  onSave,
  onExport,
  onInvoice,
  onChatMessage,
}) => {
  // State
  const [billbackData, setBillbackData] = useState<BillbackRow[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<string>('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [selectedCorrections, setSelectedCorrections] = useState<SelectedCorrections>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Chakra UI hooks
  const { isOpen: isCorrectionsModalOpen, onOpen: onCorrectionsModalOpen, onClose: onCorrectionsModalClose } = useDisclosure();

  // Memoized data
  const { billableData, unbillableData } = useMemo(() => {
    const filteredData = filterBillbackData(
      billbackData,
      employeeFilter,
      propertyFilter,
      entityFilter,
      categoryFilter
    );

    return {
      billableData: filteredData.filter(row => {
        const category = billingAccounts.find(acc => acc.id === row.categoryId);
        return category?.isbilledback;
      }),
      unbillableData: filteredData.filter(row => {
        const category = billingAccounts.find(acc => acc.id === row.categoryId);
        return !category?.isbilledback;
      })
    };
  }, [billbackData, employeeFilter, propertyFilter, entityFilter, categoryFilter, billingAccounts]);

  // Handlers
  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const fileFormat = await detectFileFormat(file);
      // Process file based on format and update billbackData
      // This is a placeholder - actual implementation would depend on file processing logic
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleFilterChange = useCallback((type: string, value: string) => {
    switch (type) {
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
  }, []);

  const handleAddRow = useCallback(() => {
    const newRow: BillbackRow = {
      rowId: uuidv4(),
      employeeId: '',
      job_date: new Date().toISOString().split('T')[0],
      hours: 0,
      rate: 0,
      billing_rate: 0,
      mileage: 0,
      propertyId: '',
      entityId: '',
      categoryId: '',
      notes: '',
      jobTotal: 0,
      billingTotal: 0,
    };
    setBillbackData(prev => [...prev, newRow]);
    setHasUnsavedChanges(true);
  }, []);

  const handleUpdateRow = useCallback((rowId: string, field: string, value: any) => {
    setBillbackData(prev => prev.map(row => {
      if (row.rowId === rowId) {
        return { ...row, [field]: value };
      }
      return row;
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleDeleteRow = useCallback((rowId: string) => {
    setBillbackData(prev => prev.filter(row => row.rowId !== rowId));
    setHasUnsavedChanges(true);
  }, []);

  const handleCorrection = useCallback((rowId: string, field: string, value: string) => {
    setSelectedCorrections(prev => ({
      ...prev,
      [rowId]: {
        ...(prev[rowId] || {}),
        [field]: value
      }
    }));
  }, []);

  const handleApplyCorrections = useCallback(() => {
    // Apply corrections to billbackData
    // This is a placeholder - actual implementation would depend on correction logic
    setValidationErrors({});
    setSelectedCorrections({});
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      await onSave(billbackData);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [billbackData, onSave]);

  const handleExport = useCallback(async () => {
    setIsLoading(true);
    try {
      await onExport(billbackData);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [billbackData, onExport]);

  const handleInvoice = useCallback(async () => {
    setIsLoading(true);
    try {
      await onInvoice(billbackData);
    } catch (error) {
      console.error('Error invoicing jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [billbackData, onInvoice]);

  return (
    <Box height="100vh" display="flex" flexDirection="column">
      <BillbackHeader />
      
      <FiltersBar
        employees={employees}
        billingProperties={billingProperties}
        entities={entities}
        billingAccounts={billingAccounts}
        employeeFilter={employeeFilter}
        propertyFilter={propertyFilter}
        entityFilter={entityFilter}
        categoryFilter={categoryFilter}
        handleFilterChange={handleFilterChange}
        addRow={handleAddRow}
        showCorrectionsIndicator={Object.keys(validationErrors).length > 0}
        setActiveTab={onCorrectionsModalOpen}
      />

      <ActionsBar
        billbackData={activeTab === 0 ? billableData : unbillableData}
        billingPeriod={billingPeriod}
        isLoading={isLoading}
        isUploading={isUploading}
        hasUnsavedChanges={hasUnsavedChanges}
        isValid={Object.keys(validationErrors).length === 0}
        handleFileUpload={handleFileUpload}
        handleSave={handleSave}
        handleExport={handleExport}
        handleInvoice={handleInvoice}
      />

      <Box flex="1" overflowY="auto">
        <Tabs 
          index={activeTab} 
          onChange={setActiveTab}
          colorScheme="blue"
          bg="white"
        >
          <TabList px={4} borderBottomColor="gray.200">
            <Tab 
              fontWeight="medium" 
              color="gray.600"
              _selected={{ 
                color: "blue.500", 
                borderColor: "blue.500",
                fontWeight: "semibold"
              }}
            >
              Billable Time ({billableData.length})
            </Tab>
            <Tab 
              fontWeight="medium"
              color="gray.600"
              _selected={{ 
                color: "blue.500", 
                borderColor: "blue.500",
                fontWeight: "semibold"
              }}
            >
              Unbillable Time ({unbillableData.length})
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={4}>
              <DataTable
                data={billableData}
                employees={employees}
                properties={billingProperties}
                entities={entities}
                billingAccounts={billingAccounts.filter(acc => acc.isbilledback)}
                onUpdateRow={handleUpdateRow}
                onDeleteRow={handleDeleteRow}
                validationErrors={validationErrors}
              />
            </TabPanel>
            <TabPanel p={4}>
              <DataTable
                data={unbillableData}
                employees={employees}
                properties={billingProperties}
                entities={entities}
                billingAccounts={billingAccounts.filter(acc => !acc.isbilledback)}
                onUpdateRow={handleUpdateRow}
                onDeleteRow={handleDeleteRow}
                validationErrors={validationErrors}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      <CorrectionsModal
        isOpen={isCorrectionsModalOpen}
        onClose={onCorrectionsModalClose}
        validationErrors={validationErrors}
        selectedCorrections={selectedCorrections}
        handleCorrection={handleCorrection}
        applyCorrections={handleApplyCorrections}
      />

      <ChatAssistant onSendMessage={onChatMessage} />
    </Box>
  );
};

export default BillbackUpload; 
