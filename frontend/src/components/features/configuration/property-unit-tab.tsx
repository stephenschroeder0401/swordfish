import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Input,
  Select,
  useToast,
  Spinner,
  InputGroup,
  InputLeftAddon,
} from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import {
  getPropertyUnits,
  createPropertyUnit,
  updatePropertyUnit,
  deletePropertyUnit,
  upsertPropertyUnits,
} from '@/lib/data-access/property-units';
import { v4 as uuidv4 } from 'uuid';
import { fetchAllPropertiesNoPagination } from '@/lib/data-access';

/* eslint-disable react-hooks/exhaustive-deps */

export const PropertyUnitTab = () => {
  const [propertyUnits, setPropertyUnits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadPropertyUnits();
    loadProperties();
  }, []);

  const loadPropertyUnits = async () => {
    try {
      const data = await getPropertyUnits();
      setPropertyUnits(data);
    } catch (error) {
      toast({
        title: 'Error loading property units',
        description: error.message,
        status: 'error',
      });
    }
  };

  const loadProperties = async () => {
    try {
      const data = await fetchAllPropertiesNoPagination();
      console.log("got properties: ", data);
      setProperties(data || []);
    } catch (error) {
      toast({
        title: 'Error loading properties',
        description: error.message,
        status: 'error',
      });
    }
  };

  const handleAddRow = () => {
    const emptyRow = {
      id: uuidv4(),
      unit_name: '',
      property_id: '',
      bedrooms: '',
      bathrooms: '',
      rent: '',
    };
    setPropertyUnits([emptyRow, ...propertyUnits]);
  };

  const handleInputChange = (index, field, value) => {
    const updatedUnits = [...propertyUnits];
    updatedUnits[index][field] = value;
    setPropertyUnits(updatedUnits);
  };

  const handleDeleteRow = async (index, id) => {
    if (id && !id.includes('-')) {  // Check if it's a real DB record
      try {
        await deletePropertyUnit(id);
        toast({
          title: 'Success',
          description: 'Property unit deleted successfully',
          status: 'success',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
        });
        return;
      }
    }
    setPropertyUnits(propertyUnits.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      // Validate all rows
      const invalidRows = propertyUnits.filter(unit => 
        !unit.unit_name?.trim() || 
        !unit.property_id || 
        !unit.bedrooms || 
        !unit.bathrooms || 
        !unit.rent
      );

      if (invalidRows.length > 0) {
        toast({
          title: 'Validation Error',
          description: 'All fields are required',
          status: 'error',
        });
        return;
      }

      // Just upsert everything at once
      await upsertPropertyUnits(propertyUnits);
      
      toast({
        title: 'Success',
        description: 'Changes saved successfully',
        status: 'success',
      });
      
      loadPropertyUnits();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box h="100%" display="flex" flexDirection="column" overflow="hidden">
      <Flex justify="space-between" align="center" px={4} py={2}>
        <IconButton
          aria-label="Add row"
          icon={<AddIcon />}
          size="xs"
          colorScheme="green"
          onClick={handleAddRow}
        />
        <Button
          size="sm"
          color="white"
          background="green.600"
          onClick={handleSaveChanges}
          isLoading={isLoading}
        >
          Save Changes
        </Button>
      </Flex>

      <Box overflowY="auto" flex="1">
        <Table variant="simple" size="sm">
          <Thead position="sticky" top={0} bg="white" zIndex={1}>
            <Tr>
              <Th width="50px"></Th>
              <Th>Property</Th>
              <Th>Unit Name</Th>
              <Th>Rent</Th>
              <Th>Bedrooms</Th>
              <Th>Bathrooms</Th>
            </Tr>
          </Thead>
          <Tbody>
            {propertyUnits.map((unit, index) => (
              <Tr key={unit.id}>
                <Td>
                  <IconButton
                    aria-label="Delete row"
                    icon={<MinusIcon />}
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDeleteRow(index, unit.id)}
                    variant="ghost"
                  />
                </Td>
                <Td>
                  <Select
                    size="sm"
                    value={unit.property_id || ''}
                    onChange={(e) => handleInputChange(index, 'property_id', e.target.value)}
                  >
                    <option value="">Select Property</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </Select>
                </Td>
                <Td>
                  <Input
                    size="sm"
                    value={unit.unit_name || ''}
                    onChange={(e) => handleInputChange(index, 'unit_name', e.target.value)}
                  />
                </Td>
                <Td>
                  <InputGroup size="sm">
                    <InputLeftAddon>$</InputLeftAddon>
                    <Input
                      type="number"
                      step="0.01"
                      value={unit.rent || ''}
                      onChange={(e) => handleInputChange(index, 'rent', parseFloat(e.target.value))}
                    />
                  </InputGroup>
                </Td>
                <Td>
                  <Input
                    size="sm"
                    type="number"
                    value={unit.bedrooms || ''}
                    onChange={(e) => handleInputChange(index, 'bedrooms', parseInt(e.target.value))}
                  />
                </Td>
                <Td>
                  <Input
                    size="sm"
                    type="number"
                    value={unit.bathrooms || ''}
                    onChange={(e) => handleInputChange(index, 'bathrooms', parseInt(e.target.value))}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};
