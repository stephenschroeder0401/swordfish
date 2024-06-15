// @ts-nocheck
import React from "react";
import { Table, Thead, Tbody, Tr, Th, Td, Flex, Box, Input, Select, Button, IconButton, Icon } from "@chakra-ui/react";
import { ChevronUpIcon, ChevronDownIcon, CloseIcon } from "@chakra-ui/icons";

interface TableConfigItem {
    column: string;
    label: string;
    canSort: boolean;
    canEdit?: boolean; // Making canEdit optional, but canSort is always required
  }
  

interface BillbackDisplayProps {
  data: any[]; // Consider using a more specific type based on your data structure
  handleSort: (column: string) => void;
  sortField: string;
  sortDirection: string;
  tableConfig: TableConfigItem[];
  handleEdit?: (event: React.ChangeEvent<HTMLInputElement>, index: number, column: string, tableType: string) => void; // Optional, implement this based on your needs
  tableType: string;
  addRow: () => void;
  accounts: any[];
  properties: any[];  
  employees: any[]; 
  handleDelete: (e: any, index: number) => void;
}



const BillbackDisplay: React.FC<BillbackDisplayProps> = ({
  data,
  handleSort,
  sortField,
  sortDirection,
  tableConfig,
  handleEdit,
  tableType,
  accounts,
  properties,
  employees,
  handleDelete,
}) => {

  return (
    <Box overflowY="auto" maxH="calc(100vh - 250px)" zIndex={2}>
      <Table variant="simple" size="sm">
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
            <Tr key={index} style={{ backgroundColor: item['isError'] ? '#ffebee' : 'inherit' }}>
              {tableConfig.map(({ column, canEdit }) => (
                <Td key={column}>
                  {column === 'delete' ? (
                    <CloseIcon color={'lightblue'} width={'2vw'} onClick={(e) => handleDelete(e, index)} _hover={{
                      color: 'darkblue',
                      transform: 'scale(1.2)',
                    }}/>
                  ) : (canEdit !== false) ? (
                    column === 'property' ? (
                      <Select
                        width="10vw"
                        backgroundColor='white'
                        value={item['propertyId']}
                        onChange={(e) => handleEdit && handleEdit(e, index, 'property', tableType)}
                        size="sm"
                        placeholder={item['property'] ? `NOT FOUND ${item['property']}` : 'Select property'}
                      >
                        {properties.map((property, idx) => (
                          <option key={idx} value={property.id}>
                            {property.name}
                          </option>
                        ))}
                      </Select>
                    ) : column === 'category' ? (
                      <Select
                        backgroundColor='white'
                        value={item['billingAccountId']}
                        onChange={(e) => handleEdit && handleEdit(e, index, 'category', tableType)}
                        size="sm"
                        width={'10vw'}
                        placeholder={item['category'] ? `NOT FOUND ${item['category']}` : 'Select category'}
                      >
                        {accounts.map((account, idx) => (
                          <option key={idx} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                      </Select>
                    ) : column === 'employee' ? (
                      <Select
                        backgroundColor='white'
                        value={item['employeeId']}
                        onChange={(e) => handleEdit && handleEdit(e, index, 'employee', tableType)}
                        size="sm"
                        width='9.5vw'
                        placeholder="Select employee"
                      >
                        {employees.map((employee, idx) => (
                          <option key={idx} value={employee.id}>
                            {employee.name}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        backgroundColor='white'
                        width={column === 'job_date' ? '7.5vw': '3.5vw'}
                        type={column === 'hours' || column === 'rate' ? 'number' : (column === 'job_date' ? 'date' : 'text')}
                        value={item[column]}
                        onChange={(e) => handleEdit && handleEdit(e, index, column, tableType)}
                        size="sm"
                      />
                    )
                  ) : (
                    column.includes("time") && item[column]
                      ? new Date(item[column]).toLocaleString()
                      : item[column]
                  )}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default BillbackDisplay;
