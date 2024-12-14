import Link from 'next/link';
import { useRouter } from 'next/router';
import { Flex, Box, Text, Select, Divider } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { fetchAllBillingPeriods } from '@/lib/data-access';
import { useBillingPeriod } from '../contexts/BillingPeriodContext';
import { useAuth } from '@/hooks/useAuth';
import { 
  FiUploadCloud, 
  FiFileText, 
  FiPieChart, 
  FiSettings,
  FiClock 
} from 'react-icons/fi';

const NavBar = () => {
  const router = useRouter();
  const currentPath = router.pathname;
  const { billingPeriod, setBillingPeriod } = useBillingPeriod();
  const [billingPeriods, setBillingPeriods] = useState([]);
  const { user, isLoading: authLoading } = useAuth();

  const isActive = (path: string) => currentPath === path;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;
        
        const periods = await fetchAllBillingPeriods();
        const sortedPeriods = periods.sort((a, b) => new Date(b.enddate).getTime() - new Date(a.enddate).getTime());
        setBillingPeriods(sortedPeriods);
        if (sortedPeriods.length > 0 && !billingPeriod) {
          setBillingPeriod(sortedPeriods[0].id);
        }
      } catch (error) {
        console.error("Error fetching billing periods", error);
      }
    };

    fetchData();
  }, [setBillingPeriod, billingPeriod, user]);

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
      width="150px"
    >
      <Box width="100%" p="2.5">
        <Text m="1" fontSize="sm" fontWeight="bold" color={'black'} display="flex" alignItems="center">
          Billing Period:
        </Text>
        <Select size="sm" bg='white' value={billingPeriod} onChange={handleBillingPeriodChange}>
          {billingPeriods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.enddate}
            </option>
          ))}
        </Select>
      </Box>
      <Divider mt={2} borderColor="gray.300" />
      <Box width="100%" bg={isActive('/billback-upload') ? 'gray.100' : 'transparent'} py="2" px="1" borderRadius="md">
        <Link href="/billback-upload" passHref>
          <Text m="1" fontSize="sm" cursor="pointer" color={isActive('/billback-upload') ? 'green.700' : 'black'} display="flex" alignItems="center">
            <FiClock style={{ marginRight: '4px' }} />
            Timesheet
          </Text>
        </Link>
      </Box>
      
      <Box width="100%" bg={isActive('/invoices-dashboard') ? 'gray.100' : 'transparent'} py="2" px="1" borderRadius="md">
        <Link href="/invoices-dashboard" passHref>
          <Text m="1" fontSize="sm" cursor="pointer" color={isActive('/invoices-dashboard') ? 'green.700' : 'black'} display="flex" alignItems="center">
            <FiFileText style={{ marginRight: '4px' }} />
            Invoices
          </Text>
        </Link>
      </Box>
      
      <Box width="100%" bg={isActive('/analytics') ? 'gray.100' : 'transparent'} py="2" px="1" borderRadius="md">
        <Link href="/analytics" passHref>
          <Text m="1" fontSize="sm" cursor="pointer" color={isActive('/analytics') ? 'green.700' : 'black'} display="flex" alignItems="center">
            <FiPieChart style={{ marginRight: '4px' }} />
            Analytics
          </Text>
        </Link>
      </Box>
      
      <Box width="100%" bg={isActive('/admin-panel') ? 'gray.100' : 'transparent'} py="2" px="1" borderRadius="md">
        <Link href="/admin-panel" passHref>
          <Text m="1" fontSize="sm" cursor="pointer" color={isActive('/admin-panel') ? 'green.700' : 'black'} display="flex" alignItems="center">
            <FiSettings style={{ marginRight: '4px' }} />
            Admin
          </Text>
        </Link>
      </Box>
    </Flex>
  );
};

export default NavBar;
