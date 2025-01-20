// @ts-nocheck
import React from "react";
import { Table, Thead, Tbody, Tr, Th, Box, Flex } from "@chakra-ui/react";
import MemoizedTableRow from "./memoized-table-row";

const BillbackDisplay = React.memo(({ 
  data, 
  tableConfig, 
  handleEdit, 
  accounts = [],
  properties = [], 
  employees = [], 
  handleDelete, 
  entities = [], 
  propertyGroups = [] 
}) => {
  return (
    <Box minWidth="2000px" overflowX="auto" overflowY="auto" maxH="calc(100vh - 250px)" zIndex={2} position="relative">
      <Table mb={10} variant="simple" size="sm">
        <Thead position="sticky" top="0" bg="white" zIndex="sticky">
          <Tr>
            {tableConfig.map(({ label, column, width }) => (
              <Th 
                key={column} 
                width={width}
                position={column === 'notes' ? 'sticky' : 'static'}
                right={column === 'notes' ? 0 : 'auto'}
                bg="white"
                zIndex={column === 'notes' ? 3 : 1}
                borderRight={column === 'notes' ? '2px solid #E2E8F0' : 'none'}
              >
                <Flex align="center">
                  {label}
                </Flex>
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {data?.map((item, index) => (
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
              propertyGroups={propertyGroups}
            />
          ))}
        </Tbody>
      </Table>
    </Box>
  );
});

BillbackDisplay.displayName = 'BillbackDisplay';

export default BillbackDisplay;
