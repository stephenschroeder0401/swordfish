// @ts-nocheck
import React, { useMemo, useCallback } from "react";
import { Table, Thead, Tbody, Tr, Th, Td, Flex, Box, Input, Select, Button, IconButton, Icon, Text } from "@chakra-ui/react";
import { ChevronUpIcon, ChevronDownIcon, CloseIcon, MinusIcon } from "@chakra-ui/icons";

//eslint-disable-next-line
const MemoizedTableRow = React.memo(({ rowKey, item, handleEdit, handleDelete, tableConfig, properties, accounts, employees, propertyGroups }) => {
  // Memoize expensive calculations
  const availableBillingAccounts = useMemo(() => {
    if (item.propertyId?.startsWith('group-')) {
      const groupId = item.propertyId.replace('group-', '');
      const selectedGroup = propertyGroups.find(group => group.id === groupId);
      if (selectedGroup) {
        return accounts.filter(account => 
          selectedGroup.billingAccounts.includes(account.id)
        );
      }
    }
    return accounts;
  }, [item.propertyId, propertyGroups, accounts]);

  // Memoize handlers
  const handleFieldEdit = useCallback((e, field) => {
    const value = e.target.value;

    // Handle special cases for dropdowns
    if (field === 'employee') {
      const selectedEmployee = employees.find(emp => emp.id === value);
      handleEdit({
        target: {
          value,
          employeeName: selectedEmployee?.name
        }
      }, rowKey, field);
    } else {
      // For all other fields, maintain the event-like structure
      handleEdit({
        target: {
          value
        }
      }, rowKey, field);
    }
  }, [rowKey, handleEdit, employees]);

  const handleRowDelete = useCallback((e) => {
    handleDelete(e, rowKey);
  }, [rowKey, handleDelete]);

  return (
    <Tr style={{ backgroundColor: item.isError ? '#ffebee' : 'inherit' }}>
      {tableConfig.map(({ column, canEdit }) => (
        <Td 
          key={column}
          position={column === 'delete' ? 'sticky' : column === 'notes' ? 'sticky' : 'static'}
          left={column === 'delete' ? 0 : 'auto'}
          right={column === 'notes' ? 0 : 'auto'}
          bg={item.isError ? '#ffebee' : 'white'}
          zIndex={column === 'delete' || column === 'notes' ? 3 : 1}
          borderRight={column === 'delete' ? '2px solid #E2E8F0' : 'none'}
          borderLeft={column === 'notes' ? '2px solid #E2E8F0' : 'none'}
          width={
            column === 'notes' 
              ? '300px'
            : column === 'property'
              ? '350px'
            : column === 'entity'
              ? '150px'
            : column === 'rate'
              ? '200px'
            : column === 'billingRate'
              ? '160px'
            : column === 'billingTotal'
              ? '160px'
            : column === 'mileageTotal'
              ? '160px'
            : column === 'total'
              ? '160px'
            : ['hours', 'jobTotal', 'billedmiles'].includes(column)
              ? '120px'
            : column === 'delete'
              ? '35px'
            : 'auto'
          }
          minWidth={column === 'notes' ? '200px' : 'auto'}
          height="auto"
          whiteSpace={column === 'notes' ? 'normal' : 'nowrap'}
          overflow="visible"
        >
          {console.log('Column name:', column)}
          {column === 'delete' ? (
            <IconButton
              aria-label="Delete row"
              icon={<MinusIcon />}
              size="sm"
              colorScheme="red"
              onClick={(e) => handleRowDelete(e)}
              variant="ghost"
            />
          ) : canEdit !== false ? (
            column === 'property' ? (
              <Select
                backgroundColor={!item.propertyId || (!propertyGroups.some(g => `group-${g.id}` === item.propertyId) && 
                  !properties.some(p => p.id === item.propertyId)) ? 'red.50' : 'white'}
                value={item.propertyId || ''}
                onChange={(e) => handleFieldEdit(e, 'property')}
                size="sm"
                width="100%"
                style={{
                  minWidth: '270px',
                  maxWidth: 'none'
                }}
                placeholder={item.property ? `NOT FOUND: ${item.property}` : 'Select Property'}
              >
                <optgroup label="Property Groups">
                  {propertyGroups.map((group) => (
                    <option key={`group-${group.id}`} value={`group-${group.id}`}>
                      {group.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Properties">
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </optgroup>
              </Select>
            ) : column === 'entity' ? (
              <Text
                width="150px"
                minWidth="150px"
                maxWidth="none"
                overflow="visible"
                whiteSpace="normal"
              >
                {item[column]}
              </Text>
            ) : column === 'category' ? (
              <Select
                minWidth="210px"
                backgroundColor='white'
                value={item.billingAccountId || ''}
                onChange={(e) => handleFieldEdit(e, 'category')}
                size="sm"
                placeholder={item.category ? `NOT FOUND ${item.category}` : 'Select category'}
              >
                {availableBillingAccounts.map((account, idx) => (
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
                value={item.employeeId || ''}
                onChange={(e) => handleFieldEdit(e, 'employee')}
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
                  onChange={(e) => handleFieldEdit(e, column)}
                />
              ) : column === 'rate' ? (
                <Text>{item[column]}</Text>
              ) : (
                <Input 
                  backgroundColor='white'
                  width="100%"
                  minWidth="50px"
                  type={column === 'hours' || column === 'mileage' ? 'number' : (column === 'job_date' ? 'date' : 'text')}
                  value={item[column] === 0 ? '' : item[column]}
                  onChange={(e) => handleFieldEdit(e, column)}
                  size="sm"
                  onWheel={(e) => e.target.blur()}
                  _hover={{ border: 'none' }}
                  _focus={{ border: 'none', boxShadow: 'none' }}
                  border="none"
                />
              )
            )
          ) : (
            <Text 
              overflow="visible"
              whiteSpace="normal"
            >
              {item[column]}
            </Text>
          )}
        </Td>
      ))}
    </Tr>
  );
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.item) === JSON.stringify(nextProps.item);
});

export default MemoizedTableRow;
