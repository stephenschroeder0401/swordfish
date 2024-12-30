// @ts-nocheck
import React from "react";
import { Table, Thead, Tbody, Tr, Th, Td, Flex, Box, Input, Select, Button, IconButton, Icon, Text } from "@chakra-ui/react";
import { ChevronUpIcon, ChevronDownIcon, CloseIcon } from "@chakra-ui/icons";

//eslint-disable-next-line
const MemoizedTableRow = ({ rowKey, item, index, handleEdit, handleDelete, tableConfig, properties, accounts, employees, tableType, propertyGroups }) => {

  console.log('employeeId:', item.employeeId);
  
  // Function to get available billing accounts based on property selection
  const getAvailableBillingAccounts = () => {
    if (item.propertyId?.startsWith('group-')) {
      const groupId = item.propertyId.replace('group-', '');
      const selectedGroup = propertyGroups.find(group => group.id === groupId);
      if (selectedGroup) {
        // Filter accounts to only those in the group's billingAccounts array
        return accounts.filter(account => 
          selectedGroup.billingAccounts.includes(account.id)
        );
      }
    }
    return accounts; // Return all accounts if no group selected or group not found
  };

  return (
    <Tr key={rowKey} style={{ backgroundColor: item.isError ? '#ffebee' : 'inherit' }}>
      {tableConfig.map(({ column, canEdit }) => (
        <Td 
          key={column}
          width={
            column === 'notes' 
              ? '300px'
            : ['property', 'entity'].includes(column)
              ? '210px'
            : ['rate', 'billingRate'].includes(column)
              ? '120px'
            : ['total', 'billingTotal', 'mileageTotal'].includes(column)
              ? '130px'
            : ['hours', 'jobTotal', 'billedmiles'].includes(column)
              ? '80px'
            : 'auto'
          }
          height="auto"
          whiteSpace={column === 'notes' ? 'normal' : 'nowrap'}
          overflow="visible"
        >
          {column === 'delete' ? (
            <CloseIcon 
              color={'red.200'} 
              width={'16px'}
              onClick={(e) => handleDelete(e, rowKey)} 
              _hover={{
                color: 'red.700',
                transform: 'scale(1.2)',
              }}
            />
          ) : canEdit !== false ? (
            column === 'property' ? (
              <Select
                width="160px"
                minWidth="160px"
                backgroundColor='white'
                value={item.propertyId}
                onChange={(e) => handleEdit(e, rowKey, 'property', tableType)}
                size="sm"
                placeholder={item.property ? `NOT FOUND ${item.property}` : 'Select property'}
              >
                {propertyGroups && propertyGroups.length > 0 && (
                  <optgroup label="Property Groups">
                    {propertyGroups.map((group, idx) => (
                      <option key={`group-${idx}`} value={`group-${group.id}`}>
                        {group.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                
                <optgroup label="Properties">
                  {properties.map((property, idx) => (
                    <option key={idx} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </optgroup>
              </Select>
            ) : column === 'category' ? (
              <Select
                width="165px"
                minWidth="165px"
                backgroundColor='white'
                value={item.billingAccountId}
                onChange={(e) => handleEdit(e, rowKey, 'category', tableType)}
                size="sm"
                placeholder={item.category ? `NOT FOUND ${item.category}` : 'Select category'}
              >
                {getAvailableBillingAccounts().map((account, idx) => (
                  <option key={idx} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            ) : column === 'employee' ? (
              <Select
                width="160px"
                minWidth="160px"
                backgroundColor='white'
                value={item.employeeId}
                onChange={(e) => handleEdit(e, rowKey, 'employee', tableType)}
                size="sm"
                placeholder="Select employee"
              >
                {employees.map((employee, idx) => (
                  <option key={idx} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </Select>
            ) : column === 'billingRate' || column === 'billingTotal' || column === 'jobTotal' ? (
              <Text 
                width="80px"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {column === 'billingRate' && !item[column] ? item.rate : item[column]}
                {column === 'billingTotal' && (!item.billingRate || item.billingTotal === 0) ? item.total : item.billingTotal}
                {column === 'jobTotal' ? 
                  (
                    parseFloat((!item.billingTotal || item.billingTotal === 0) ? item.total : item.billingTotal) + 
                    parseFloat(item.mileageTotal || 0)
                  ).toFixed(2) 
                  : null}
              </Text>
            ) : (
              column === 'notes' ? (
                <textarea 
                  style={{
                    width: '100%',
                    backgroundColor: 'white',
                    padding: '8px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '4px',
                    minHeight: '60px',
                    height: 'auto',
                    resize: 'vertical'
                  }}
                  value={item[column]}
                  onChange={(e) => handleEdit(e, rowKey, column, tableType)}
                />
              ) : (
                <Input 
                  backgroundColor='white'
                  width="100%"
                  type={column === 'hours' || column === 'rate' || column === 'mileage' ? 'number' : (column === 'job_date' ? 'date' : 'text')}
                  value={item[column]}
                  onChange={(e) => handleEdit(e, rowKey, column, tableType)}
                  size="sm"
                />
              )
            )
          ) : (
            <Text 
              width={column === 'notes' ? "800px" : "80px"}
              whiteSpace={column === 'notes' ? "normal" : "nowrap"}
              overflow="visible"
            >
              {item[column]}
            </Text>
          )}
        </Td>
      ))}
    </Tr>
  );
};
 // Add this closing parenthesis

export default MemoizedTableRow;
