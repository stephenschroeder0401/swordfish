import { useState, useEffect } from 'react';
import { Box, Center, Flex, Heading, Spinner, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import DataManagementTab from '@/components/features/configuration/tabs/data-management-tab';
import { AllocationsTab } from '@/components/features/configuration/tabs/allocations-tab';
import { useAuth } from '@/hooks/useAuth';
import { fetchAllEntities } from '@/lib/data-access/entities';

const AdminPanel = () => {
  const { isLoading: authLoading } = useAuth();
  const [entities, setEntities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEntities = async () => {
      try {
        const entityData = await fetchAllEntities();
        setEntities(entityData);
      } catch (error) {
        console.error('Error fetching entities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEntities();
  }, []);

  if (authLoading || isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box h="100vh" display="flex" flexDirection="column" overflow="hidden">
      <Flex 
        bg="white" 
        borderBottom="1px" 
        borderColor="gray.200" 
        p={4}
        h="7vh"
        alignItems="center"
        pb="3vh"
      >
        <Heading as="h1" size="lg">
          Configuration
        </Heading>
      </Flex>

      <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
        <Tabs 
          variant="enclosed" 
          display="flex"
          flexDirection="column"
          h="100%"
          sx={{
            '.chakra-tabs__tab[aria-selected=true]': {
              color: 'green.700',
              borderColor: 'green.700',
              borderBottomColor: 'transparent'
            },
            '.chakra-tabs__tab:hover': {
              color: 'green.600'
            },
            '.chakra-tabs__tab-panel': {
              padding: 0
            }
          }}
        >
          <TabList height="5vh">
            <Tab py={1} fontSize="lg">Data Management</Tab>
            <Tab py={1} fontSize="lg">Allocations</Tab>
          </TabList>
          <TabPanels flex="1" overflow="hidden">
            <TabPanel h="100%" p={0}>
              <DataManagementTab entities={entities} />
            </TabPanel>
            <TabPanel h="100%" p={0}>
              <AllocationsTab entities={entities} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default AdminPanel;
