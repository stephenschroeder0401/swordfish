import React, { useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Select,
  IconButton,
  Box,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { DeleteIcon, WarningIcon } from '@chakra-ui/icons';
import { BillbackRow, Employee, Property, Entity, BillingAccount } from './types';

interface DataTableProps {
  data: BillbackRow[];
  employees: Employee[];
  properties: Property[];
  entities: Entity[];
  billingAccounts: BillingAccount[];
  onUpdateRow: (rowId: string, field: string, value: any) => void;
  onDeleteRow: (rowId: string) => void;
  validationErrors: Record<string, Record<string, string>>;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  employees,
  properties,
  entities,
  billingAccounts,
  onUpdateRow,
  onDeleteRow,
  validationErrors,
}) => {
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);

  const handleCellClick = (rowId: string, field: string) => {
    setEditingCell({ rowId, field });
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    }
  };

  const renderCell = (row: BillbackRow, field: string) => {
    const isEditing = editingCell?.rowId === row.rowId && editingCell?.field === field;
    const error = validationErrors[row.rowId]?.[field];

    const cellContent = () => {
      if (isEditing) {
        switch (field) {
          case 'employeeId':
            return (
              <Select
                size="sm"
                value={row[field]}
                onChange={(e) => onUpdateRow(row.rowId, field, e.target.value)}
                onBlur={handleCellBlur}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </Select>
            );
          case 'propertyId':
            return (
              <Select
                size="sm"
                value={row[field]}
                onChange={(e) => onUpdateRow(row.rowId, field, e.target.value)}
                onBlur={handleCellBlur}
              >
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
              </Select>
            );
          case 'entityId':
            return (
              <Select
                size="sm"
                value={row[field]}
                onChange={(e) => onUpdateRow(row.rowId, field, e.target.value)}
                onBlur={handleCellBlur}
              >
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </Select>
            );
          case 'categoryId':
            return (
              <Select
                size="sm"
                value={row[field]}
                onChange={(e) => onUpdateRow(row.rowId, field, e.target.value)}
                onBlur={handleCellBlur}
              >
                {billingAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            );
          case 'hours':
          case 'rate':
          case 'billing_rate':
          case 'mileage':
            return (
              <Input
                size="sm"
                type="number"
                value={row[field]}
                onChange={(e) => onUpdateRow(row.rowId, field, parseFloat(e.target.value))}
                onBlur={handleCellBlur}
                onKeyPress={handleKeyPress}
              />
            );
          default:
            return (
              <Input
                size="sm"
                value={row[field]}
                onChange={(e) => onUpdateRow(row.rowId, field, e.target.value)}
                onBlur={handleCellBlur}
                onKeyPress={handleKeyPress}
              />
            );
        }
      }

      // Display mode
      switch (field) {
        case 'employeeId':
          return employees.find((emp) => emp.id === row[field])?.name;
        case 'propertyId':
          return properties.find((prop) => prop.id === row[field])?.name;
        case 'entityId':
          return entities.find((entity) => entity.id === row[field])?.name;
        case 'categoryId':
          return billingAccounts.find((account) => account.id === row[field])?.name;
        case 'hours':
        case 'rate':
        case 'billing_rate':
          return row[field]?.toFixed(2);
        case 'mileage':
          return row[field] ? row[field].toFixed(2) : '-';
        default:
          return row[field];
      }
    };

    return (
      <Td
        onClick={() => handleCellClick(row.rowId, field)}
        position="relative"
        cursor="pointer"
        _hover={{ bg: 'gray.50' }}
      >
        <Box position="relative">
          {cellContent()}
          {error && (
            <Tooltip label={error} placement="top">
              <WarningIcon
                color="red.500"
                position="absolute"
                top="50%"
                right={2}
                transform="translateY(-50%)"
              />
            </Tooltip>
          )}
        </Box>
      </Td>
    );
  };

  return (
    <Box overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Date</Th>
            <Th>Employee</Th>
            <Th>Property</Th>
            <Th>Entity</Th>
            <Th>Category</Th>
            <Th isNumeric>Hours</Th>
            <Th isNumeric>Rate</Th>
            <Th isNumeric>Billing Rate</Th>
            <Th isNumeric>Mileage</Th>
            <Th>Notes</Th>
            <Th width="50px"></Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((row) => (
            <Tr key={row.rowId}>
              {renderCell(row, 'job_date')}
              {renderCell(row, 'employeeId')}
              {renderCell(row, 'propertyId')}
              {renderCell(row, 'entityId')}
              {renderCell(row, 'categoryId')}
              {renderCell(row, 'hours')}
              {renderCell(row, 'rate')}
              {renderCell(row, 'billing_rate')}
              {renderCell(row, 'mileage')}
              {renderCell(row, 'notes')}
              <Td>
                <IconButton
                  aria-label="Delete row"
                  icon={<DeleteIcon />}
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => onDeleteRow(row.rowId)}
                />
              </Td>
            </Tr>
          ))}
          {data.length === 0 && (
            <Tr>
              <Td colSpan={11} textAlign="center" py={8}>
                <Text color="gray.500">No data available</Text>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </Box>
  );
};

export default DataTable; 