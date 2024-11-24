import { useState } from 'react';
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

interface AllocationsTabProps {
  entities: any[];
}

export const AllocationsTab = ({ entities }: AllocationsTabProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  return (
    <Box>
      <Tabs>
        <TabList>
          <Tab>Property Groups</Tab>
          <Tab>Employee Time</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <PropertyGroupsPanel properties={entities} />
          </TabPanel>
          <TabPanel>
            {/* Employee Time content will go here */}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};
