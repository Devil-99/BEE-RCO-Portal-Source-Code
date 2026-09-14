import { useState, useEffect, Suspense, lazy } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../../components/Sidebar";
import { Box, Flex } from "@chakra-ui/react";
import deloitte_theme from "../../theme";
import SkeletonComponent from "../../components/SkeletonComponent";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import { MdDashboardCustomize } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";

const Dashboard = lazy(() => import("./Dashboard"));
const SubmissionDetails = lazy(() => import("./SubmissionDetails"));

function Main() {
  const userDetails = useSelector((state) => state.login);
  const dispatch = useDispatch();

  const [openChangePasswordModal, setOpenChangePasswordModal] =
    useState(false);

  useEffect(() => {
    if (!userDetails.is_password_reset) {
      setOpenChangePasswordModal(true);
    }
  }, [userDetails.is_password_reset]);

  const [activeSection, setActiveSection] = useState("dashboard");
  const sections = [
    {
      id: "dashboard",
      label: "Dashboard",
      component: <Dashboard setActiveSection={setActiveSection} />,
      icon: MdDashboardCustomize,
    },
    {
      id: "submissionDetails",
      label: "Submission Details",
      component: (
        <SubmissionDetails/>
      ),
      icon: IoDocumentTextOutline,
    },
  ];

  const currentSection = sections.find(
    (sec) => sec.id === activeSection
  );

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

      <ChangePasswordModal
        isOpen={openChangePasswordModal}
        onClose={() => setOpenChangePasswordModal(false)}
      />
    </Flex>
  );
}

export default Main;