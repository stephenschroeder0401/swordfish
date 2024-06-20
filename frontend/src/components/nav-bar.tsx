import Link from 'next/link';
import { useRouter } from 'next/router';
import { Flex, Box, Text, Select, Divider } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { fetchAllBillingPeriods } from '@/app/utils/supabase-client';
import { useBillingPeriod } from '../contexts/BillingPeriodContext';

const NavBar = () => {
  const router = useRouter();
  const currentPath = router.pathname;
  const { billingPeriod, setBillingPeriod } = useBillingPeriod();
  const [billingPeriods, setBillingPeriods] = useState([]);

  const isActive = (path: string) => currentPath === path;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const periods = await fetchAllBillingPeriods();
        // Assuming periods are fetched as an array of { id, enddate } objects
        const sortedPeriods = periods.sort((a, b) => new Date(b.enddate) - new Date(a.enddate));
        setBillingPeriods(sortedPeriods);
        // Set the most recent period as the active one
        if (sortedPeriods.length > 0 && !billingPeriod) {
          setBillingPeriod(sortedPeriods[0].id);
        }
      } catch (error) {
        console.error("Error fetching billing periods", error);
      }
    };

    fetchData();
  }, [setBillingPeriod, billingPeriod]);

  const handleBillingPeriodChange = (event) => {
    setBillingPeriod(event.target.value);
  };

  return (
    <Flex
      bg="gray.50"
      borderRight="1px"
      borderColor="gray.200"
      flexDirection="column"
      alignItems="flex-start"
      position="sticky"
      top="60px"
      height="calc(100vh - 60px)"
    >
      <Box width="100%" p="2">
        <Text m="2" color={'black'}>
          Billing Period:
        </Text>
        <Select bg='white' value={billingPeriod} onChange={handleBillingPeriodChange}>
          {billingPeriods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.enddate}
            </option>
          ))}
        </Select>
      </Box>
      <Divider mt={2} borderColor="gray.300" />
      <Box width="100%" bg={isActive('/billback-upload') ? 'gray.100' : 'transparent'} p="2" borderRadius="md">
        <Link href="/billback-upload" passHref>
          <Text m="2" cursor="pointer" color={isActive('/billback-upload') ? 'green.700' : 'black'}>
            Upload Billback
          </Text>
        </Link>
      </Box>
      <Box width="100%" bg={isActive('/invoices-dashboard') ? 'gray.100' : 'transparent'} p="2" borderRadius="md">
        <Link href="/invoices-dashboard" passHref>
          <Text m="2" cursor="pointer" color={isActive('/invoices-dashboard') ? 'green.700' : 'black'}>
            Invoices
          </Text>
        </Link>
      </Box>
      <Box width="100%" bg={isActive('/admin-panel') ? 'gray.100' : 'transparent'} p="2" borderRadius="md">
        <Link href="/admin-panel" passHref>
          <Text m="2" cursor="pointer" color={isActive('/admin-panel') ? 'green.700' : 'black'}>
            Admin
          </Text>
        </Link>
      </Box>
    </Flex>
  );
};

export default NavBar;
