// components/CSVUpload.js
import Papa from 'papaparse';
import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, useToast, Icon, Flex, Text } from '@chakra-ui/react';
import { FaUpload } from 'react-icons/fa';
import { AttachmentIcon } from "@chakra-ui/icons";

interface CSVUploadProps {
  onDataProcessed: (data: any) => void;
  setLoading: (loading: boolean) => void;  // New function prop to control loading state
  disabled?: boolean;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  style?: any;
}

const validateHeaders = (headers: string[]) => {
  const timeroFormat = ['Employee Name', 'Clocked In At', 'Clocked Out At', 'Job Name', 'Mileage', 'Notes'];
  const manualFormat = ['Date', 'Employee Name', 'Property', 'Category', 'Task', 'Minutes', 'Comments'];

  const isTimero = timeroFormat.every(header => headers.includes(header));
  const isManual = manualFormat.every(header => headers.includes(header));

  if (!isTimero && !isManual) {
    throw new Error('Invalid file format. Please use either Timero or Manual template.');
  }

  return true;
};

const CSVUpload: React.FC<CSVUploadProps> = ({ onDataProcessed, setLoading, selectedFile, setSelectedFile, disabled = false, style }) => {

  useEffect(() => {
    if(!selectedFile) {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the file input value
      }
    }
  });

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
        try {
          // Log the raw data for debugging
          console.log('Raw CSV data:', result.data[0]);
          
          // Validate headers before processing
          validateHeaders(Object.keys(result.data[0]));
          
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
        } catch (error) {
          // Log the full error
          console.error("CSV Upload Error:", {
            error,
            stack: error.stack,
            data: result.data[0]
          });

          toast({
            title: "Upload Error",
            // Include more error details in the toast
            description: `Error: ${error.message}\n\nHeaders found: ${Object.keys(result.data[0]).join(', ')}`,
            status: "error",
            duration: 6000, // Increased duration to read longer message
            isClosable: true,
            position: "bottom-right"
          });
        } finally {
          setLoading(false);
        }
      },
      header: true,
      error: (error) => {
        console.error("Papa Parse Error:", error);
        toast({
          title: "CSV Parsing Error",
          description: error.message,
          status: "error",
          duration: 4000,
          isClosable: true,
          position: "bottom-right"
        });
        setLoading(false);
      }
    });
  };

  const detectFileFormat = (row: any): 'timero' | 'manual' => {
    const headers = Object.keys(row);
    if (headers.includes('Clocked In At') && headers.includes('Clocked Out At')) {
      return 'timero';
    }
    if (headers.includes('Date') && headers.includes('Minutes')) {
      return 'manual';
    }
    throw new Error('Unrecognized file format');
  };

  const transformData = (csvData: any[]) => {
    if (!csvData.length) return [];
    
    const format = detectFileFormat(csvData[0]);
    
    return csvData
      .filter((row) => Object.values(row).some((value) => {
        return value && typeof value === 'string' ? value.trim() !== '' : Boolean(value);
      }))
      .map((row) => {
        if (format === 'timero') {
          // Handle Timero format
          const [property, ...categoryParts] = row['Job Name'] ? row['Job Name'].split('/') : ['', ''];
          const category = categoryParts.join('/');
          
          const clockedInAt = new Date(row['Clocked In At']);
          const clockedOutAt = new Date(row['Clocked Out At']);
          const duration = (Number(clockedOutAt) - Number(clockedInAt)) / (1000 * 60 * 60);
          
          return {
            employee: row['Employee Name']?.trim() || '',
            date: clockedInAt.toISOString().split('T')[0],
            property: property?.trim() || '',
            category: category?.trim() || '',
            clockedInAt: clockedInAt.toISOString(),
            clockedOutAt: clockedOutAt.toISOString(),
            hours: duration.toFixed(2),
            mileage: row['Mileage'] || 0,
            notes: row['Notes'] || '',
            format: 'timero' as const
          };
        } else {
          console.log("ROW!! :", row);
          // Updated Manual format handling
          const minutes = Number(row['Minutes']) || 0;
          const hours = (minutes / 60).toFixed(2);
          
          // Format the date
          const formatDate = (dateStr: string) => {
            if (!dateStr) return '';
            try {
              const [month, day, year] = dateStr.split('/');
              return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            } catch (error) {
              console.error('Date parsing error:', error);
              return '';
            }
          };
          
          return {
            employee: row['Employee Name']?.trim() || '',
            date: formatDate(row['Date']?.trim() || ''),
            property: row['Property']?.trim() || '',
            category: row['Category']?.trim() || '',
            clockedInAt: null,
            clockedOutAt: null,
            hours: hours,
            mileage: 0,
            notes: row['Comments'] || row['Task'] || '',
            format: 'manual' as const
          };
        }
      });
  };
  

  return (
    <>
      <input
        type="file"
        id="file-upload"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      
      <Button
        leftIcon={<AttachmentIcon />}
        size="sm"
        variant="outline"
        colorScheme="gray"
        onClick={() => document.getElementById('file-upload').click()}
        isDisabled={disabled}
        style={style}
      >
        Upload Timesheet
      </Button>
    </>
  );
};

export default CSVUpload;
