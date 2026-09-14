import { useState, useEffect, Suspense, lazy } from 'react'
import { useSelector } from 'react-redux'
import Sidebar from '../../components/Sidebar';
import deloitte_theme from '../../theme';
import SkeletonComponent from '../../components/SkeletonComponent';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import { Box, Flex } from '@chakra-ui/react';

import { MdDashboardCustomize, MdPeople } from "react-icons/md";

const Dashboard = lazy(() => import('./Dashboard'));
const UserManagement = lazy(() => import('./UserManagement'));

const sections = [
    { id: 'dashboard', label: 'Dashboard', component: <Dashboard />, icon: MdDashboardCustomize },
    { id: 'usermanagement', label: 'User Management', component: <UserManagement />, icon: MdPeople },
]

function Main() {
    const userDetails = useSelector((state) => state.login);
    const [openChangePasswordModal, setOpenChangePasswordModal] = useState(false);
    useEffect(() => {
        if (!userDetails.is_password_reset)
            setOpenChangePasswordModal(true);
    }, [userDetails]);

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