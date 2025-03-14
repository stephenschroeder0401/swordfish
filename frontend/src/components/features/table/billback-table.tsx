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
  openClearDialog,
  entities = [], 
  propertyGroups = [] 
}) => {
  return (
    <Box 
      position="relative"
      overflowX="auto"
      overflowY="auto"
      maxH="calc(100vh - 250px)"
    >
      <Table mb={10} variant="simple" size="sm">
        <Thead 
          position="sticky" 
          top={0} 
          bg="white" 
          zIndex={4}
          sx={{
            '&::after': {
              content: '""',
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '1px',
              backgroundColor: '#E2E8F0',
              zIndex: 5
            }
          }}
        >
          <Tr>
            {tableConfig.map(({ label, column, width, renderHeader }) => (
              <Th 
                key={column} 
                width={width}
                position={column === 'delete' ? 'sticky' : column === 'notes' ? 'sticky' : 'static'}
                left={column === 'delete' ? 0 : 'auto'}
                right={column === 'notes' ? 0 : 'auto'}
                bg="white"
                zIndex={column === 'delete' || column === 'notes' ? 4 : 1}
                borderRight={column === 'delete' ? '2px solid #E2E8F0' : 'none'}
                borderLeft={column === 'notes' ? '2px solid #E2E8F0' : 'none'}
                top={0}
              >
                {renderHeader ? renderHeader() : label}
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
