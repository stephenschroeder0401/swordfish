import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
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
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { AddIcon, MinusIcon, ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
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

interface GroupedUnit {
  property: { name: string; id: string };
  units: Array<{
    id: string;
    unit_name: string;
    property_id: string;
    bedrooms: string | number;
    bathrooms: string | number;
    rent: string | number;
  }>;
  totalUnits: number;
  totalRent: number;
  percentageOfTotal: number;
}

export const PropertyUnitTab = () => {
  const [propertyUnits, setPropertyUnits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedProperties, setExpandedProperties] = useState<Record<string, boolean>>({});
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [groupedUnits, setGroupedUnits] = useState<Record<string, GroupedUnit>>({});
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

  const handleAddRow = (propertyId: string) => {
    const emptyRow = {
      id: uuidv4(),
      unit_name: '',
      property_id: propertyId,
      bedrooms: '',
      bathrooms: '',
      rent: '',
    };
    setPropertyUnits([...propertyUnits, emptyRow]);
  };

  const handleInputChange = useCallback((index: number, field: string, value: any) => {
    setPropertyUnits(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleDeleteRow = (index: number, id: string) => {
    console.log('Marking for deletion:', id);
    setDeletedIds(prev => {
      console.log('Previous deletedIds:', prev);
      const newIds = [...prev, id];
      console.log('New deletedIds:', newIds);
      return newIds;
    });
    setPropertyUnits(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      console.log('About to delete IDs:', deletedIds);
      if (deletedIds.length > 0) {
        for (const id of deletedIds) {
          console.log('Attempting to delete:', id);
          await deletePropertyUnit(id);
        }
      }

      // Then save the remaining/updated units
      const formattedUnits = propertyUnits.map(unit => ({
        id: unit.id,
        property_id: unit.property_id,
        unit_name: unit.unit_name,
        rent: parseFloat(unit.rent),
        bedrooms: parseInt(unit.bedrooms),
        bathrooms: parseInt(unit.bathrooms)
      }));

      if (formattedUnits.length > 0) {
        await upsertPropertyUnits(formattedUnits);
      }
      
      // Clear deleted IDs after successful save
      setDeletedIds([]);
      
      toast({
        title: 'Success',
        description: 'Changes saved successfully',
        status: 'success',
        duration: 3000,
      });
      
      // Reload the data
      await loadPropertyUnits();
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save changes',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateGroupedUnits = useMemo(() => {
    const grouped = {};
    let totalRevenue = 0;

    // First pass: calculate total revenue and group units
    properties.forEach(property => {
      const propertyUnitsFiltered = propertyUnits.filter(unit => unit.property_id === property.id);
      const propertyRent = propertyUnitsFiltered.reduce((sum, unit) => sum + (parseFloat(unit.rent) || 0), 0);
      totalRevenue += propertyRent;
      
      grouped[property.id] = {
        property,
        units: propertyUnitsFiltered,
        totalUnits: propertyUnitsFiltered.length,
        totalRent: propertyRent
      };
    });

    // Second pass: add percentage calculations
    Object.keys(grouped).forEach(propertyId => {
      grouped[propertyId].percentageOfTotal = totalRevenue > 0 
        ? (grouped[propertyId].totalRent / totalRevenue) * 100 
        : 0;
    });

    return grouped;
  }, [properties, propertyUnits]);

  const toggleExpanded = useCallback((propertyId: string) => {
    setExpandedProperties(prev => ({
      ...prev,
      [propertyId]: !prev[propertyId]
    }));
  }, []);

  return (
    <Box h="100%" display="flex" flexDirection="column" overflow="hidden">
      <Flex justify="flex-end" align="center" px={4} py={2}>
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

      <Box overflowY="auto" flex="1" pb={40}>
        <Table variant="simple" size="sm" width="100%">
          <Thead position="sticky" top={0} bg="white" zIndex={1}>
            <Tr>
              <Th width="50px"></Th>
              <Th width="300px">Property</Th>
              <Th width="200px">Units</Th>
              <Th width="200px">Total Rent</Th>
              <Th width="200px">% of Revenue</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            {Object.entries(groupedUnits)
              .sort(([, a], [, b]) => {
                if ((b as { totalUnits: number }).totalUnits !== (a as { totalUnits: number }).totalUnits) {
                  return (b as { totalUnits: number }).totalUnits - (a as { totalUnits: number }).totalUnits;
                }
                return (a as { property: { name: string } }).property.name.localeCompare((b as { property: { name: string } }).property.name);
              })
              .map(([propertyId, group]) => (
                <Fragment key={propertyId}>
                  <Tr css={{
                    backgroundColor: expandedProperties[propertyId] ? 'var(--chakra-colors-gray-50)' : undefined,
                    'input, .chakra-select__control': {
                      backgroundColor: 'white !important'
                    },
                    width: '100%'
                  }}>
                    <Td width="50px">
                      <IconButton
                        aria-label="Toggle expand"
                        icon={expandedProperties[propertyId] ? <ChevronDownIcon /> : <ChevronRightIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleExpanded(propertyId)}
                      />
                    </Td>
                    <Td width="300px">{(group as { property: { name: string } }).property.name}</Td>
                    <Td width="200px">{(group as { totalUnits: number }).totalUnits}</Td>
                    <Td width="200px">${(group as { totalRent: number }).totalRent.toLocaleString()}</Td>
                    <Td width="200px">{(group as { percentageOfTotal: number }).percentageOfTotal.toFixed(1)}%</Td>
                    <Td></Td>
                  </Tr>
                  {expandedProperties[propertyId] && (
                    <Tr>
                      <Td colSpan={7} p={0}>
                        <Box 
                          p={4} 
                          borderWidth="0 1px 1px 1px"
                          borderStyle="solid"
                          borderColor="green.100"
                          borderBottomRadius="md"
                          backgroundColor="white"
                          position="relative"
                        >
                          <VStack align="stretch" spacing={4}>
                            <HStack 
                              spacing={0} 
                              position="sticky"
                              top={0}
                              bg="white"
                              zIndex={1}
                              pb={2}
                              borderBottom="1px solid"
                              borderColor="gray.100"
                            >
                              <Box width="50px" ml={2}>
                                <IconButton
                                  aria-label="Add unit"
                                  icon={<AddIcon />}
                                  size="xs"
                                  colorScheme="green"
                                  onClick={() => handleAddRow(propertyId)}
                                />
                              </Box>
                              <Text 
                                width="25%"
                                fontFamily="heading"
                                textTransform="uppercase"
                                letterSpacing="wider"
                                fontSize="xs"
                              >
                                Unit Name
                              </Text>
                              <Text 
                                width="25%"
                                fontFamily="heading"
                                textTransform="uppercase"
                                letterSpacing="wider"
                                fontSize="xs"
                              >
                                Monthly Rent
                              </Text>
                              <Text 
                                width="25%"
                                fontFamily="heading"
                                textTransform="uppercase"
                                letterSpacing="wider"
                                fontSize="xs"
                              >
                                Bedrooms
                              </Text>
                              <Text 
                                width="25%"
                                fontFamily="heading"
                                textTransform="uppercase"
                                letterSpacing="wider"
                                fontSize="xs"
                              >
                                Bathrooms
                              </Text>
                            </HStack>
                            
                            {group?.units?.map((unit, index) => (
                              <HStack key={unit.id} spacing={4}>
                                <Box width="50px" ml={2}>
                                  <IconButton
                                    aria-label="Delete row"
                                    icon={<MinusIcon />}
                                    size="xs"
                                    colorScheme="red"
                                    onClick={() => handleDeleteRow(propertyUnits.indexOf(unit), unit.id)}
                                    variant="ghost"
                                  />
                                </Box>
                                <Box width="25%">
                                  <Input
                                    size="sm"
                                    value={unit.unit_name || ''}
                                    onChange={(e) => handleInputChange(propertyUnits.indexOf(unit), 'unit_name', e.target.value)}
                                  />
                                </Box>
                                <Box width="25%">
                                  <InputGroup size="sm">
                                    <InputLeftAddon>$</InputLeftAddon>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={unit.rent || ''}
                                      onChange={(e) => handleInputChange(propertyUnits.indexOf(unit), 'rent', parseFloat(e.target.value))}
                                    />
                                  </InputGroup>
                                </Box>
                                <Box width="25%">
                                  <Input
                                    size="sm"
                                    type="number"
                                    value={unit.bedrooms || ''}
                                    onChange={(e) => handleInputChange(propertyUnits.indexOf(unit), 'bedrooms', parseInt(e.target.value))}
                                  />
                                </Box>
                                <Box width="25%">
                                  <Input
                                    size="sm"
                                    type="number"
                                    value={unit.bathrooms || ''}
                                    onChange={(e) => handleInputChange(propertyUnits.indexOf(unit), 'bathrooms', parseInt(e.target.value))}
                                  />
                                </Box>
                              </HStack>
                            ))}
                          </VStack>
                        </Box>
                      </Td>
                    </Tr>
                  )}
                </Fragment>
              ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};
