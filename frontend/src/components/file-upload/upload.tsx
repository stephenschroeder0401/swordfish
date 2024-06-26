// components/CSVUpload.js
import Papa from 'papaparse';
import React, { useState, useRef} from 'react';
import { Button, Input, useToast, Icon, Flex, Text } from '@chakra-ui/react';
import { FaUpload } from 'react-icons/fa';


interface CSVUploadProps {
  onDataProcessed: (data: any) => void;
  setLoading: (loading: boolean) => void;  // New function prop to control loading state
  disabled?: boolean;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
}

const CSVUpload: React.FC<CSVUploadProps> = ({ onDataProcessed, setLoading, selectedFile, setSelectedFile, disabled = false}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setSelectedFile(file);  // Directly use the setSelectedFile function from props
    if (file) {
      setLoading(true); // Set loading to true right when file selection is made
      parseCSV(file);
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      complete: (result) => {
        console.log('Parsed: ', result);
        const transformedData = transformData(result.data);
        onDataProcessed(transformedData);
        toast({
          title: "File Uploaded",
          description: `File ${file.name} uploaded`,
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "bottom-right"
        });
        setLoading(false); // Set loading to false when parsing is complete
      },
      header: true,
    });
  };

  const transformData = (csvData: any[]) => {
    console.log("Transforming data");
    return csvData.map((row) => {
      const [property, category] = row['Job Name'] ? row['Job Name'].split('/') : ['', ''];

      // Parse the clock-in and clock-out times
      const clockedInAt = new Date(row['Clocked In At']);
      const clockedOutAt = new Date(row['Clocked Out At']);

      const formattedDate = clockedInAt.getFullYear() + '-' +
        ('0' + (clockedInAt.getMonth() + 1)).slice(-2) + '-' +
        ('0' + clockedInAt.getDate()).slice(-2);

      // Calculate the duration in hours
      const duration = (Number(clockedOutAt) - Number(clockedInAt)) / (1000 * 60 * 60);
      const mileage = row['Mileage'] ? Number(row['Mileage']) : 0;

      return {
        employee: row['Employee Name'].trim(), // Trim whitespace
        date: formattedDate.trim(), // Trim is not necessarily needed here since this is constructed, but included for consistency
        property: property.trim(), // Already trimmed above
        category: category?.trim(), // Already trimmed above
        clockedInAt: clockedInAt.toISOString(), // Convert to ISO string
        clockedOutAt: clockedOutAt.toISOString(), // Convert to ISO string
        hours: duration.toFixed(2), // This results in a string, no whitespace to trim
        rate: 0, // Implement this function based on your logic
        total: 0,
        mileage: mileage,
        notes: row['Notes'] // Assuming 'total' maps to 'Mileage', adjust as needed
        // Add any additional transformations here
      };
    });
  };

  return (
    <Flex direction="column" width="14vw" alignItems="flex-start">
    <Button
      leftIcon={<Icon as={FaUpload} />}
      colorScheme="gray"
      size='md'
      onClick={() => fileInputRef.current?.click()}
      isDisabled={disabled}
    >
      {selectedFile ? 'File Selected' : 'Upload CSV'}
    </Button>
    {selectedFile && <Text color="gray" mt={2} fontSize="sm">{selectedFile.name}</Text>}
    <Input
      ref={fileInputRef}
      type="file"
      accept=".csv"
      onChange={handleFileChange}
      style={{ display: 'none' }}
      disabled={disabled}
    />
  </Flex>

  );
};

export default CSVUpload;
