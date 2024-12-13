import { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import BillingAccountTab from '@/components/features/configuration/billing-account-tab';
import EmployeesTab from '@/components/features/configuration/employees-tab';
import PropertiesTab from '@/components/features/configuration/properties';
import EntitiesTab from '@/components/features/configuration/entities-tab';
import BillingPeriodTab from '@/components/features/configuration/billing-period-tab';
import { fetchAllEntities } from '@/lib/data-access/entities';

interface TabProps {
  entities: any[]; // Replace 'any[]' with your actual entity type
}

const DataManagementTab: React.FC<TabProps> = ({ entities }) => {
  return (
    <Tabs
      variant="line"
      display="flex"
      flexDirection="column"
      h="100%"
      sx={{
        '.chakra-tabs__tab[aria-selected=true]': {
          color: 'green.700',
          borderColor: 'green.700',
        },
        '.chakra-tabs__tab:hover': {
          color: 'green.600',
        },
      }}
    >
      <TabList height="5vh">
        <Tab py={1} fontSize="sm">Hourly Billing</Tab>
        <Tab py={1} fontSize="sm">Employees</Tab>
        <Tab py={1} fontSize="sm">Properties</Tab>
        <Tab py={1} fontSize="sm">Entities</Tab>
        <Tab py={1} fontSize="sm">Billing Periods</Tab>
      </TabList>
      <TabPanels flex="1" overflow="hidden">
        <TabPanel h="100%" overflowY="auto" padding={0}>
          <BillingAccountTab />
        </TabPanel>
        <TabPanel h="100%" overflowY="auto" padding={0}>
          <EmployeesTab />
        </TabPanel>
        <TabPanel h="100%" overflowY="auto" padding={0}>
          <PropertiesTab entities={entities} />
        </TabPanel>
        <TabPanel h="100%" overflowY="auto" padding={0}>
          <EntitiesTab />
        </TabPanel>
        <TabPanel h="100%" overflowY="auto" padding={0}>
          <BillingPeriodTab />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default DataManagementTab;
