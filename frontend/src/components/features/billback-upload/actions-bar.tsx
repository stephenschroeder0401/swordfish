import React from 'react';
import { Flex, Button, Text, Box } from '@chakra-ui/react';
import { BillbackRow } from './types';
import CSVUpload from './csv-upload';

interface ActionsBarProps {
  billbackData: BillbackRow[];
  billingPeriod: string;
  isLoading: boolean;
  isUploading: boolean;
  hasUnsavedChanges: boolean;
  isValid: boolean;
  handleFileUpload: (file: File) => Promise<void>;
  handleSave: () => Promise<void>;
  handleExport: () => Promise<void>;
  handleInvoice: () => Promise<void>;
}

const ActionsBar: React.FC<ActionsBarProps> = ({
  billbackData,
  billingPeriod,
  isLoading,
  isUploading,
  hasUnsavedChanges,
  isValid,
  handleFileUpload,
  handleSave,
  handleExport,
  handleInvoice,
}) => {
  const entryCount = billbackData.length;
  const totalHours = billbackData.reduce((sum, row) => sum + row.hours, 0);
  const totalBilled = billbackData.reduce((sum, row) => sum + (row.billing_rate * row.hours), 0);

  return (
    <Flex
      px={4}
      py={2}
      borderBottom="1px"
      borderColor="gray.200"
      bg="white"
      align="center"
      justify="space-between"
    >
      <Flex align="center" gap={4}>
        <CSVUpload
          onFileUpload={handleFileUpload}
          isDisabled={!billingPeriod}
          isLoading={isUploading}
        />
      </Flex>

      <Flex align="center" gap={6}>
        <Box textAlign="center">
          <Text fontSize="sm" color="gray.600">Entries</Text>
          <Text fontWeight="bold">{entryCount}</Text>
        </Box>
        <Box textAlign="center">
          <Text fontSize="sm" color="gray.600">Total Hours</Text>
          <Text fontWeight="bold">{totalHours.toFixed(2)}</Text>
        </Box>
        <Box textAlign="center">
          <Text fontSize="sm" color="gray.600">Total Billed</Text>
          <Text fontWeight="bold">${totalBilled.toFixed(2)}</Text>
        </Box>
      </Flex>

      <Flex gap={2}>
        <Button
          size="sm"
          colorScheme="blue"
          variant="outline"
          onClick={handleExport}
          isDisabled={billbackData.length === 0 || isLoading}
          isLoading={isLoading}
        >
          Export CSV
        </Button>
        <Button
          size="sm"
          colorScheme="green"
          onClick={handleSave}
          isDisabled={!hasUnsavedChanges || !isValid || isLoading}
          isLoading={isLoading}
        >
          Save Progress
        </Button>
        <Button
          size="sm"
          colorScheme="purple"
          onClick={handleInvoice}
          isDisabled={billbackData.length === 0 || !isValid || isLoading}
          isLoading={isLoading}
        >
          Invoice Jobs
        </Button>
      </Flex>
    </Flex>
  );
};

export default ActionsBar; 
