import { useState, useEffect, Suspense, lazy } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../../components/Sidebar";
import { Box, Flex } from "@chakra-ui/react";
import deloitte_theme from "../../theme";
import SkeletonComponent from "../../components/SkeletonComponent";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import { useSubmittedFormsQuery } from "../../redux/apiSlices/formApi";
import { setSubmittedFormDetails } from "../../redux/FormSlice";

import { MdDashboardCustomize } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";

const Dashboard = lazy(() => import("./Dashboard"));
const SubmissionDetails = lazy(() => import("./SubmissionDetails"));

function Main() {
  const userDetails = useSelector((state) => state.login);
  const dispatch = useDispatch();

  const [openChangePasswordModal, setOpenChangePasswordModal] = useState(false);
  useEffect(() => {
    if (!userDetails.is_password_reset) setOpenChangePasswordModal(true);
  }, [userDetails.is_password_reset]);

  // Fetch and map submitted forms for the SDA state while keeping the
  // discom/industry-only scope intact for the dashboard and submission views.
  const [mappedSubmittedForms, setMappedSubmittedForms] = useState([]);
  const { data: submittedForms = [] } = useSubmittedFormsQuery();
  useEffect(() => {
    if (submittedForms.length > 0 && userDetails.role_code) {
      const allowedEntityTypes = ["DISCOM", "INDUSTRY"];
      const forms = submittedForms.filter((f) => {
        const matchesState = f.state_code === userDetails.state;
        const matchesEntityType = allowedEntityTypes.includes(f.entity_type);
        return matchesState && matchesEntityType;
      });

      setMappedSubmittedForms(forms);
      dispatch(setSubmittedFormDetails(forms));
    }
  }, [submittedForms, userDetails.role_code, userDetails.state, dispatch]);

  const [activeSection, setActiveSection] = useState("dashboard");
  const sections = [
    {
      id: "dashboard",
      label: "Dashboard",
      component: (
        <Dashboard
          setActiveSection={setActiveSection}
          mappedSubmittedForms={mappedSubmittedForms}
        />
      ),
      icon: MdDashboardCustomize,
    },
    {
      id: "submission-details",
      label: "Submission Details",
      component: (
        <SubmissionDetails mappedSubmittedForms={mappedSubmittedForms} />
      ),
      icon: IoDocumentTextOutline,
    },
  ];
  const currentSection = sections.find((sec) => sec.id === activeSection);

  return (
    <Flex bg="gray.50" w="full" h="75vh" overflow="hidden">
      <Sidebar
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <Box as="main" p={deloitte_theme.paddingX} w="100%" overflowY={"auto"}>
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
