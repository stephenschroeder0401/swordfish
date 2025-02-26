import React, { useRef } from 'react';
import { Button } from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';

interface CSVUploadProps {
  onFileUpload: (file: File) => Promise<void>;
  isDisabled: boolean;
  isLoading: boolean;
}

const CSVUpload: React.FC<CSVUploadProps> = ({
  onFileUpload,
  isDisabled,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await onFileUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        ref={fileInputRef}
      />
      <Button
        leftIcon={<AttachmentIcon />}
        onClick={() => fileInputRef.current?.click()}
        isDisabled={isDisabled}
        isLoading={isLoading}
        loadingText="Uploading"
        size="sm"
        variant="outline"
        colorScheme="blue"
        bg="white"
        _hover={{
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        Upload CSV
      </Button>
    </>
  );
};

export default CSVUpload; 