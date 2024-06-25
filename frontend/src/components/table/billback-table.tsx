// @ts-nocheck
import React from "react";
import { Table, Thead, Tbody, Tr, Th, Td, Flex, Box, Input, Select, Button, IconButton, Icon, Text } from "@chakra-ui/react";
import { ChevronUpIcon, ChevronDownIcon, CloseIcon } from "@chakra-ui/icons";
import MemoizedTableRow from "./memoized-table-row";  // Adjust the path if necessary


const BillbackDisplay = ({ data, handleSort, sortField, sortDirection, tableConfig, handleEdit, tableType, accounts, properties, employees, handleDelete }) => {
  return (
    <Box minWidth="1500px" overflowX="auto" overflowY="auto" maxH="calc(100vh - 250px)" zIndex={2}>
      <Table mb={10} variant="simple" size="sm">
        <Thead position="sticky" top="0" bg="white" zIndex="sticky">
          <Tr>
            {tableConfig.map(({ label, column, canSort }) => (
              <Th key={column} cursor={canSort ? "pointer" : "default"} onClick={() => canSort && handleSort(column)}>
                <Flex align="center">
                  {label}
                  {canSort && sortField === column && (
                    sortDirection === "AscNullsFirst" ? <ChevronUpIcon ml={2} /> : <ChevronDownIcon ml={2} />
                  )}
                </Flex>
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {data.map((item, index) => (
            <MemoizedTableRow
              key={index}
              item={item}
              index={index}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              tableConfig={tableConfig}
              properties={properties}
              accounts={accounts}
              employees={employees}
              tableType={tableType}
            />
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default BillbackDisplay;
