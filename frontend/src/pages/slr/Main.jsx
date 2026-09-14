import { useEffect, useState, Suspense, lazy, useMemo } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Sidebar from '../../components/Sidebar';
import SkeletonComponent from '../../components/SkeletonComponent';
import deloitte_theme from '../../theme';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import { useSelector } from 'react-redux';
import { FaUserCog, FaMoneyBillWave } from "react-icons/fa";
import { MdDashboardCustomize } from "react-icons/md";

const SubmissionDetails = lazy(() => import('./SubmissionDetails'));
const Dashboard = lazy(() => import('./Dashboard'));
const UserManagement = lazy(() => import('./UserManagement'));
const FormDBuyout = lazy(() => import('./FormDBuyout'));


function Main() {
    const userDetails = useSelector((state) => state.login)

    const [openChangePasswordModal, setOpenChangePasswordModal] = useState(false);

    useEffect(() => {
        if (!userDetails.is_password_reset)
            setOpenChangePasswordModal(true);
    }, [userDetails]);

    const sections = useMemo(() => {
        const baseSections = [
            { id: 'dashboard', label: 'Dashboard', component: <Dashboard />, icon: MdDashboardCustomize },
            { id: 'user-management', label: 'User Management', component: <UserManagement />, icon: FaUserCog },
        ];

        if (userDetails.role_code === 'SLR') {
            baseSections.push({
                id: 'buyout',
                label: 'Compliance & Buyout',
                component: <FormDBuyout />,
                icon: FaMoneyBillWave
            });
        }

        return baseSections;
    }, [userDetails.role_code]);

    const [activeSection, setActiveSection] = useState('dashboard');
    const currentSection = sections.find(sec => sec.id === activeSection);

    return (
        <Flex bg="gray.50" w="full" h="75vh" overflow="hidden">
            <Sidebar
                sections={sections}
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
            <ChangePasswordModal isOpen={openChangePasswordModal} onClose={() => setOpenChangePasswordModal(false)} />
        </Flex>
    )
}

export default Main