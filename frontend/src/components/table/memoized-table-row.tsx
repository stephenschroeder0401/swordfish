// @ts-nocheck
import React from "react";
import { Table, Thead, Tbody, Tr, Th, Td, Flex, Box, Input, Select, Button, IconButton, Icon, Text } from "@chakra-ui/react";
import { ChevronUpIcon, ChevronDownIcon, CloseIcon } from "@chakra-ui/icons";

//eslint-disable-next-line
const MemoizedTableRow = ({ item, index, handleEdit, handleDelete, tableConfig, properties, accounts, employees, tableType }) => {
  return (
    <Tr key={index} style={{ backgroundColor: item.isError ? '#ffebee' : 'inherit' }}>
      {tableConfig.map(({ column, canEdit }) => (
        <Td key={column}>
          {column === 'delete' ? (
            <CloseIcon color={'red.200'} width={'2vw'} onClick={(e) => handleDelete(e, index)} _hover={{
              color: 'red.700',
              transform: 'scale(1.2)',
            }}/>
          ) : canEdit !== false ? (
            column === 'property' ? (
              <Select
                width="10vw"
                minWidth={'160px'}
                backgroundColor='white'
                value={item.propertyId}
                onChange={(e) => handleEdit(e, index, 'property', tableType)}
                size="sm"
                placeholder={item.property ? `NOT FOUND ${item.property}` : 'Select property'}
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
                value={item.billingAccountId}
                onChange={(e) => handleEdit(e, index, 'category', tableType)}
                size="sm"
                width={'10vw'}
                minWidth={'165px'}
                placeholder={item.category ? `NOT FOUND ${item.category}` : 'Select category'}
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
                value={item.employeeId}
                onChange={(e) => handleEdit(e, index, 'employee', tableType)}
                size="sm"
                width='9.5vw'
                minWidth={'160px'}
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
                width={column === 'job_date' ? '7vw' : '5.5vw'}
                minWidth={column === 'job_date' ? '130px' : '65px'}
                type={column === 'hours' || column === 'rate' ? 'number' : (column === 'job_date' ? 'date' : 'text')}
                value={item[column]}
                onChange={(e) => handleEdit(e, index, column, tableType)}
                size="sm"
              />
            )
          ) : (
            <Text minWidth={"160px"}>{item[column]}</Text>
          )}
        </Td>
      ))}
    </Tr>
  );
};
 // Add this closing parenthesis

export default MemoizedTableRow;
