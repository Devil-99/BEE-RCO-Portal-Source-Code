import { useState, Suspense, lazy } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Sidebar from '../../components/Sidebar';
import deloitte_theme from '../../theme';
import SkeletonComponent from '../../components/SkeletonComponent';

import { FiGrid, FiBriefcase, FiMap, FiGlobe, FiUserCheck, FiFileText, FiClock, FiTarget, FiPieChart } from 'react-icons/fi';
import {FaWpforms, FaMoneyBillWave, FaUsers, FaUserTie, FaUserShield, FaChartLine} from "react-icons/fa";
import { GrOrganization } from "react-icons/gr";
import { FaProjectDiagram } from "react-icons/fa";
import {MdManageAccounts} from "react-icons/md";

const FormDashboard = lazy(() => import('./formDashboard/FormDashboard'));
const EntityManagement = lazy(() => import('./EntityManagement'));
const Main = lazy(() => import('./userManagement/Main'));
const SectorTypeManager = lazy(() => import('./SectorTypeManager'));
const StateForm = lazy(() => import('./StateForm'));
const OrgOptions = lazy(() => import('./OrganizationOptionForm'));
const PatRegForm = lazy(() => import('./PatRegForm'));
const FormFieldsManager = lazy(() => import('./FormFieldsManager'));
const FinancialYearManager = lazy(() => import('./FinancialYearManager'));
const RCOTargetsForm = lazy(() => import('./RCOTargetsForm'));
const PaymentAnalytics = lazy(() => import('./paymentAnalytics/PaymentAnalytics'));
const AEAForm = lazy(() => import('./AEAForm'));
const AuditFirmForm = lazy(() => import('./auditFirm/AuditFirmForm'));
const RBACForm = lazy(() => import('./RBAC/Main'));
const EnergyManagerForm = lazy(() => import('./EnergyManagerForm'));
const WorkflowsTab = lazy(() => import('./workflow/workflowsTab'));
const BuyoutManagement = lazy(() => import('./BuyoutManagement'));
const PaymentCategoryManagement = lazy(() => import('./PaymentCategoryManagement'));


const adminSections = [
  { id: "forms", label: "Dashboard", component: <FormDashboard />, icon: FaWpforms },

  { id: "entities", label: "Entities", component: <EntityManagement />, icon: FiGrid },

  { id: "buyout", label: "Buyout", component: <BuyoutManagement />, icon: FaMoneyBillWave },

  { id: "paymentAnalytics", label: "Payment Analytics", component: <PaymentAnalytics />, icon: FaChartLine },

  { id: "users", label: "Users", component: <Main />, icon: FaUsers },

  { id: "energyManager", label: "Energy Manager", component: <EnergyManagerForm />, icon: FaUserTie },

  { id: "aea", label: "Energy Auditor", component: <AEAForm />, icon: FaUserShield },

  { id: "auditFirm", label: "Audit Firm", component: <AuditFirmForm />, icon: GrOrganization },
  
  { id: "paymentCategory", label: "Payment Categories", component: <PaymentCategoryManagement />, icon: FiFileText },

  { id: "timeline", label: "Timeline", component: <FinancialYearManager />, icon: FiClock },

  { id: "rcoTargets", label: "RCO Targets", component: <RCOTargetsForm />, icon: FiTarget },

  { id: "patReg", label: "PAT Registration", component: <PatRegForm />, icon: FiUserCheck },

  { id: "sectorType", label: "Sector Type", component: <SectorTypeManager />, icon: FiBriefcase },

  { id: "state", label: "State", component: <StateForm />, icon: FiMap },

  { id: "orgOptions", label: "Organisation Options", component: <OrgOptions />, icon: FiGlobe },

  { id: "workflows", label: "Workflows", component: <WorkflowsTab />, icon: FaProjectDiagram },

  { id: "rbac", label: "Access Control", component: <RBACForm />, icon: MdManageAccounts },
];
const AdminDashboard = () => {
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
};

export default AdminDashboard;