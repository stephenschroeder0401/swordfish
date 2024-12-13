// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Table, Thead, Tbody, Tr, Th, Td, Flex, Box, Select, Icon, Text } from "@chakra-ui/react";
import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import MemoizedTableRow from "./memoized-table-row";

const BillbackDisplay = ({ data, handleSort, sortField, sortDirection, tableConfig, handleEdit, tableType, accounts = [],
   properties = [], employees = [], handleDelete, entities = [], propertyGroups = [] }) => {

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("");
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {

    const newFilteredData = data.filter(item => {
        const matchesEmployee = !selectedEmployee || item.employeeId === selectedEmployee;
        const matchesCategory = !selectedCategory || item.billingAccountId === selectedCategory;
        const matchesProperty = !selectedProperty || item.propertyId === selectedProperty;
        const matchesEntity = !selectedEntity || item.entity === selectedEntity;
        return matchesEmployee && matchesCategory && matchesProperty && matchesEntity;
    });

    setFilteredData(newFilteredData);

}, [data, selectedEmployee, selectedCategory, selectedProperty, selectedEntity]); // Ensure useEffect triggers on changes to these states


const clearFilters = () => {
  setSelectedEmployee("");
  setSelectedCategory("");
  setSelectedProperty("");
  setSelectedEntity("");
};


  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
  };

  return (
    <Box minWidth="1500px" overflowX="auto" overflowY="auto" maxH="calc(100vh - 250px)" zIndex={2}>
      <Box position="sticky" top="0" bg="white" zIndex="sticky" py={2}>
        <Flex ml={4} mb={4} align="center" wrap="wrap" padding={'7px'} gap={4} bg="gray.50" width="100%">
          <Flex align="center" bg="white">
            <Select
              placeholder="Filter employee"
              value={selectedEmployee}
              onChange={handleFilterChange(setSelectedEmployee)}
              width="200px"
            >
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </Select>
          </Flex>
          <Flex align="center">
            <Select
              placeholder="Filter category"
              value={selectedCategory}
              onChange={handleFilterChange(setSelectedCategory)}
              width="200px"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </Flex>
          <Flex align="center">
            <Select
              placeholder="Filter property"
              value={selectedProperty}
              onChange={handleFilterChange(setSelectedProperty)}
              width="200px"
            >
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
          </Flex>
          {entities && entities.length > 0 && (
            <Flex align="center">
              <Select
                placeholder="Filter entity"
                value={selectedEntity}
                onChange={handleFilterChange(setSelectedEntity)}
                width="200px"
              >
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.name}>
                    {entity.name}
                  </option>
                ))}
              </Select>
            </Flex>
          )}
          <Flex align="center">
          <Text color={'red.400'} _hover={{
              color: 'red.700',
              transform: 'scale(1.1)',
              cursor: 'pointer'
            }}
            onClick={clearFilters}>
       REMOVE FILTERS
      </Text>
      </Flex>
        </Flex>
      </Box>
      <Table mb={10} variant="simple" size="sm">
        <Thead position="sticky" top="50px" bg="white" zIndex="sticky">
          <Tr>
            {tableConfig.map(({ label, column, canSort }) => (
              <Th key={column} cursor={canSort ? "pointer" : "default"} onClick={() => canSort && handleSortClick(column)}>
                <Flex align="center">
                  {label}
                  {sortField === column && (
                    sortDirection === "AscNullsFirst" ? <ChevronUpIcon ml={2} /> : <ChevronDownIcon ml={2} />
                  )}
                </Flex>
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {filteredData.map((item, index) => (
            
            <MemoizedTableRow
              key={item.rowId}
              rowKey={item.rowId}
              item={item}
              index={index}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              tableConfig={tableConfig}
              properties={properties}
              accounts={accounts}
              employees={employees}
              tableType={tableType}
              propertyGroups={propertyGroups}
            />
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default BillbackDisplay;
