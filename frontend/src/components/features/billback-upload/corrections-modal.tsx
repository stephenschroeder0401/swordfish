import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  Button,
  Flex,
  Box,
  Badge,
  Divider,
  useToast
} from '@chakra-ui/react';
import { ValidationErrors, SelectedCorrections } from './types';

interface CorrectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationErrors: ValidationErrors;
  selectedCorrections: SelectedCorrections;
  handleCorrection: (rowId: string, field: string, value: string) => void;
  applyCorrections: () => void;
}

const CorrectionsModal: React.FC<CorrectionsModalProps> = ({
  isOpen,
  onClose,
  validationErrors,
  selectedCorrections,
  handleCorrection,
  applyCorrections,
}) => {
  const toast = useToast();

  const handleApplyCorrections = () => {
    applyCorrections();
    toast({
      title: "Corrections Applied",
      description: "Your corrections have been applied successfully.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Required Corrections
          <Badge ml={2} colorScheme="red">
            {Object.keys(validationErrors).length} Issues
          </Badge>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {Object.entries(validationErrors).map(([rowId, errors]) => (
              <Box 
                key={rowId}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                borderColor="red.200"
                bg="red.50"
              >
                <Text fontWeight="bold" mb={2}>
                  Row ID: {rowId}
                </Text>
                <Divider mb={3} />
                {Object.entries(errors).map(([field, error]: [string, string]) => (
                  <Box key={field} mb={3}>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text color="red.600">
                        {field}: {error}
                      </Text>
                      <Button
                        size="sm"
                        colorScheme={selectedCorrections[rowId]?.[field] ? "green" : "gray"}
                        variant="outline"
                        onClick={() => handleCorrection(rowId, field, "corrected")}
                      >
                        {selectedCorrections[rowId]?.[field] ? "Corrected" : "Mark as Corrected"}
                      </Button>
                    </Flex>
                  </Box>
                ))}
              </Box>
            ))}
          </VStack>

          <Flex justify="flex-end" mt={6}>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleApplyCorrections}
              isDisabled={Object.keys(selectedCorrections).length === 0}
            >
              Apply All Corrections
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CorrectionsModal; 
