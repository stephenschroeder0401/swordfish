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
  const requiredTimeroHeaders = ['Employee Name', 'Clocked In At', 'Clocked Out At', 'Job Name', 'Mileage', 'Notes'];
  const requiredManualHeaders = ['Date', 'Employee Name', 'Property', 'Category', 'Task', 'Minutes', 'Comments'];
  const requiredProgressHeaders = ['Employee', 'Date', 'Property', 'Category', 'Hours', 'Mileage', 'Notes'];

  // Check each format
  const isTimero = requiredTimeroHeaders.every(header => headers.includes(header));
  const isManual = requiredManualHeaders.every(header => headers.includes(header));
  const isProgress = requiredProgressHeaders.every(header => headers.includes(header));

  if (!isTimero && !isManual && !isProgress) {
    throw new Error('Invalid file format. Please use either Timero, Manual, or Progress template.');
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
    console.log('Starting to parse file:', file.name);  // Debug log
    
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

  const detectFileFormat = (row: any): 'timero' | 'manual' | 'progress' => {
    const headers = Object.keys(row);
    if (headers.includes('Clocked In At') && headers.includes('Clocked Out At')) {
      return 'timero';
    }
    if (headers.includes('Date') && headers.includes('Minutes')) {
      return 'manual';
    }
    if (headers.includes('Employee') && headers.includes('Hours')) {
      return 'progress';
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
          console.log('Processing row:', row);  // Debug log
          
          // Handle Timero format
          const [property, ...categoryParts] = row['Job Name'] ? row['Job Name'].split('/') : ['', ''];
          const category = categoryParts.join('/');
          
          // Parse the date/time with more flexible format
          const parseDateTime = (dateTimeStr: string) => {
            console.log('Parsing datetime:', dateTimeStr);  // Debug log
            if (!dateTimeStr) return null;  // Handle undefined/null
            
            try {
              // Check if format is MM-DD-YYYY HH:MM AM/PM
              if (dateTimeStr.includes('-')) {
                const [datePart, timePart, ampm] = dateTimeStr.split(' ');
                const [month, day, year] = datePart.split('-');
                const [hours, minutes] = timePart.split(':');
                
                let hour = parseInt(hours);
                if (ampm === 'PM' && hour !== 12) hour += 12;
                if (ampm === 'AM' && hour === 12) hour = 0;
                
                return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minutes}:00`);
              }
              // Handle M/D/YYYY HH:MM format
              else {
                const [datePart, timePart] = dateTimeStr.split(' ');
                const [month, day, year] = datePart.split('/');
                const [hours, minutes] = timePart.split(':');
                
                return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes}:00`);
              }
            } catch (error) {
              console.error('Date parsing error:', error);
              throw error;
            }
          };
          
          const clockedInAt = parseDateTime(row['Clocked In At']);
          const clockedOutAt = parseDateTime(row['Clocked Out At']);
          const duration = clockedInAt && clockedOutAt ? 
            (Number(clockedOutAt) - Number(clockedInAt)) / (1000 * 60 * 60) : 0;
          
          return {
            employee: row['Employee Name']?.trim() || '',
            date: clockedInAt ? clockedInAt.toISOString().split('T')[0] : '',
            property: property?.trim() || '',
            category: category?.trim() || '',
            clockedInAt: clockedInAt ? clockedInAt.toISOString() : null,
            clockedOutAt: clockedOutAt ? clockedOutAt.toISOString() : null,
            hours: duration.toFixed(2),
            mileage: row['Mileage'] || 0,
            notes: row['Notes'] || '',
            format: 'timero' as const
          };
        } else if (format === 'progress') {
          // Direct mapping for Progress format
          return {
            employee: row['Employee']?.trim() || '',
            date: row['Date']?.trim() || '',
            property: row['Property']?.trim() || '',
            category: row['Category']?.trim() || '',
            clockedInAt: null,
            clockedOutAt: null,
            hours: row['Hours'] || '0',
            mileage: row['Mileage'] || '0',
            notes: row['Notes'] || '',
            format: 'progress' as const
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
        _hover={{
          bg: "blue.50",
          borderColor: "blue.500",
          color: "blue.600",
          transform: "translateY(-1px)",
          transition: "all 0.2s ease-in-out"
        }}
      >
        Upload Timesheet
      </Button>
    </>
  );
};

export default CSVUpload;
