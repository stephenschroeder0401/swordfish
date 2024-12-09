import { useState, useEffect } from 'react';
import {
  Box,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { supabase } from '@/lib/data-access/supabase-client';
import { PropertyGroupsPanel } from '../property-groups-panel';
import { fetchAllPropertiesNoPagination } from '@/lib/data-access/properties';
import { fetchAllBillingAccounts } from '@/lib/data-access/';

interface Property {
  id: string;
  name: string;
  code: string;
}

interface AllocationsTabProps {
  entities: any[];
}

export const AllocationsTab = ({ entities }: AllocationsTabProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [billingAccounts, setBillingAccounts] = useState([]);
  const toast = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [propertiesData, billingAccountsData] = await Promise.all([
          fetchAllPropertiesNoPagination(),
          fetchAllBillingAccounts(0, 1000)
        ]);
        
        setProperties(propertiesData);
        setBillingAccounts(billingAccountsData.data || []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error loading data',
          status: 'error',
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  return (
    <Box>
      <Tabs>
        <TabList>
          <Tab>Property Groups</Tab>
          <Tab>Employee Time</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <PropertyGroupsPanel 
              properties={properties} 
              billingAccounts={billingAccounts}
            />
          </TabPanel>
          <TabPanel>
            {/* Employee Time content will go here */}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};
