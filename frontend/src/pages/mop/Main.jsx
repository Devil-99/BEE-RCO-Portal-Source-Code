import { useState, useEffect, Suspense, lazy } from 'react'
import { useSelector } from 'react-redux'
import Sidebar from '../../components/Sidebar';
import { Box, Flex } from '@chakra-ui/react';
import deloitte_theme from '../../theme';
import SkeletonComponent from '../../components/SkeletonComponent';
import ChangePasswordModal from '../../components/ChangePasswordModal';

import { MdDashboardCustomize } from "react-icons/md";
import Certificates from "./Certificates.jsx";
import {IoDocumentTextOutline} from "react-icons/io5";
const Dashboard = lazy(() => import('./Dashboard'));

const sections = [
    { id: 'dashboard', label: 'Dashboard', component: <Dashboard />, icon: MdDashboardCustomize },
    { id: 'certificates', label: 'Certificates', component: <Certificates />, icon: IoDocumentTextOutline },
]

function Main() {
    const userDetails = useSelector((state) => state.login);

    // const [openChangePasswordModal, setOpenChangePasswordModal] = useState(false);
    // useEffect(() => {
    //     if (!userDetails.is_password_reset)
    //         setOpenChangePasswordModal(true);
    // }, [userDetails]);

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
                    {activeSection === 'dashboard' ? (
                        <Dashboard />
                    ) : (
                        currentSection?.component
                    )}
                </Suspense>
            </Box>
            {/* <ChangePasswordModal isOpen={openChangePasswordModal} onClose={() => setOpenChangePasswordModal(false)} /> */}
        </Flex>
    )
}

export default Main