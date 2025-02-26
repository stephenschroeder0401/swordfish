import React from 'react';
import {
  Flex,
  Button,
  Select,
  Divider,
  Text,
  Box,
  IconButton,
} from '@chakra-ui/react';
import { AddIcon, CloseIcon } from '@chakra-ui/icons';
import { Employee, Property, Entity, BillingAccount } from './types';

interface FiltersBarProps {
  employees: Employee[];
  billingProperties: Property[];
  entities: Entity[];
  billingAccounts: BillingAccount[];
  employeeFilter: string;
  propertyFilter: string;
  entityFilter: string;
  categoryFilter: string;
  handleFilterChange: (type: string, value: string) => void;
  addRow: () => void;
  showCorrectionsIndicator: boolean;
  setActiveTab: (tab: string) => void;
}

const FiltersBar: React.FC<FiltersBarProps> = ({
  employees,
  billingProperties,
  entities,
  billingAccounts,
  employeeFilter,
  propertyFilter,
  entityFilter,
  categoryFilter,
  handleFilterChange,
  addRow,
  showCorrectionsIndicator,
  setActiveTab,
}) => {
  return (
    <Flex
      px={4}
      py={2}
      borderBottom="1px"
      borderColor="gray.200"
      bg="gray.100"
      align="center"
      justify="space-between"
    >
      <Flex align="center" gap={4}>
        <Button
          leftIcon={<AddIcon />}
          size="sm"
          colorScheme="green"
          variant="outline"
          onClick={addRow}
          bg="white"
          _hover={{
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          Add Row
        </Button>

        <Divider orientation="vertical" height="24px" borderColor="gray.300" />

        <Flex gap={2}>
          <Flex align="center" gap={2}>
            <Select
              placeholder="All Employees"
              size="sm"
              width="200px"
              onChange={(e) => handleFilterChange('employee', e.target.value)}
              value={employeeFilter}
              bg="white"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </Select>
            {employeeFilter && (
              <IconButton
                aria-label="Clear employee filter"
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={() => handleFilterChange('employee', '')}
              />
            )}
          </Flex>

          <Flex align="center" gap={2}>
            <Select
              placeholder="All Properties"
              size="sm"
              width="200px"
              onChange={(e) => handleFilterChange('property', e.target.value)}
              value={propertyFilter}
              bg="white"
            >
              {billingProperties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name}
                </option>
              ))}
            </Select>
            {propertyFilter && (
              <IconButton
                aria-label="Clear property filter"
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={() => handleFilterChange('property', '')}
              />
            )}
          </Flex>

          <Flex align="center" gap={2}>
            <Select
              placeholder="All Entities"
              size="sm"
              width="200px"
              onChange={(e) => handleFilterChange('entity', e.target.value)}
              value={entityFilter}
              bg="white"
            >
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </Select>
            {entityFilter && (
              <IconButton
                aria-label="Clear entity filter"
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={() => handleFilterChange('entity', '')}
              />
            )}
          </Flex>

          <Flex align="center" gap={2}>
            <Select
              placeholder="All Categories"
              size="sm"
              width="200px"
              onChange={(e) => handleFilterChange('category', e.target.value)}
              value={categoryFilter}
              bg="white"
            >
              {billingAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
            {categoryFilter && (
              <IconButton
                aria-label="Clear category filter"
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={() => handleFilterChange('category', '')}
              />
            )}
          </Flex>
        </Flex>
      </Flex>

      {showCorrectionsIndicator && (
        <Button
          colorScheme="red"
          variant="outline"
          size="sm"
          onClick={() => setActiveTab('corrections')}
          leftIcon={<CloseIcon />}
          bg="white"
          _hover={{
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          View Corrections
        </Button>
      )}
    </Flex>
  );
};

export default FiltersBar; 
