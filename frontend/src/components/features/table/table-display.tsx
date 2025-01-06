// @ts-nocheck
import React from "react";
import { Table, Thead, Tbody, Tr, Th, Td, Flex, Box } from "@chakra-ui/react";
import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { Edge } from "@/types/call-history-respose";

const TableDisplay = ({
  data,
  handleSort,
  sortField,
  sortDirection,
  tableConfig
}: {
  data: any;
  handleSort: any;
  sortField: any;
  sortDirection: any;
  tableConfig: any;
}) =>{ 

  return (
    <Box minWidth="2000px" overflowX="auto" overflowY="auto" maxH="calc(100vh - 250px)" zIndex={2}>
      <Table variant="simple" size="sm">
        <Thead position="sticky" top={0} zIndex={1} bg="white">
          <Tr>
            {tableConfig.map(({ label, column, canSort }: { label: string, column: string, canSort: boolean }) => (
              <Th 
                key={column} 
                cursor={canSort ? "pointer" : "default"} 
                onClick={() => canSort && handleSort(column)}
                width={tableConfig.find(config => config.column === column)?.width}
              >
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
          {data.map((item: any, index: number) => (
            <Tr key={index}>
              {tableConfig.map(({ column, format }: { column: string, format?: (value: any) => string }) => (
                <Td key={column}>
                  {format ? format(item[column]) : (
                    column.includes("time") && item.node[column]
                      ? new Date(item[column]).toLocaleString()
                      : item[column]
                  )}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Box mb="155px" />
    </Box>
  );
};

export default TableDisplay;
