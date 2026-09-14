import { useState, Suspense, lazy } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Sidebar from '../../../components/Sidebar';
import deloitte_theme from '../../../theme';
import SkeletonComponent from '../../../components/SkeletonComponent';

import { FiPieChart } from 'react-icons/fi';
import { FaUsers } from "react-icons/fa";
import { FaWpforms } from "react-icons/fa";

const FormDashboard = lazy(() => import('../formDashboard/FormDashboard'));
const Users = lazy(() => import('../userManagement/Main'));
const PaymentAnalytics = lazy(() => import('../paymentAnalytics/PaymentAnalytics'));

const adminSections = [
  { id: 'forms', label: 'Dashboard', component: <FormDashboard />, icon: FaWpforms },
  { id: 'users', label: 'Users', component: <Users />, icon: FaUsers },
  { id: 'paymentAnalytics', label: 'Payment Analytics', component: <PaymentAnalytics />, icon: FiPieChart },
];

function Main() {
  const [activeSection, setActiveSection] = useState('forms');
  const currentSection = adminSections.find(sec => sec.id === activeSection);

  return (
    <Flex bg="gray.100" w="full" h="76vh" overflow="hidden">
      <Sidebar
        sections={adminSections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <Box
        as="main"
        p={deloitte_theme.paddingX}
        w="100%"
        overflowY={"auto"}
      >
        <Suspense fallback={<SkeletonComponent />}>
          {currentSection?.component}
        </Suspense>
      </Box>
    </Flex>
  );
}

export default Main