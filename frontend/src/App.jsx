import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import { setToastInstance } from "./components/toastService";
import { useSelector } from "react-redux";
import { useGetCommonDataQuery } from "./redux/apiSlices/commonApi";

// Pages
import FormPage from "./pages/userAuthentication/FormPage";
import PageHeader from "./components/PageHeader";
import Navbar from "./components/Navbar";
import PaymentDashboard from "./pages/dashboards/PaymentDasboard";
import ErrorPage from "./pages/ErrorPage";
import OldPendingPage from "./pages/trackstatus/OldPendingPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StateForm from "./pages/admin/StateForm";
import PatRegForm from "./pages/admin/PatRegForm";

import OrganizationManager from "./pages/admin/OrganizationOptionForm";
import FormFieldsManager from "./pages/admin/FormFieldsManager";
import FinancialYearManager from "./pages/admin/FinancialYearManager";
import CppNew from "./pages/forms/cpp/CppNew";

import AEARegistration from "./pages/userAuthentication/AEARegistration";

import SLDCDashboard from "./pages/sldc/Main";
import DiscomNew from "./pages/forms/discom/DiscomNew";
import AEADashboard from "./pages/aea/Main";
import FirmDashboard from "./pages/firm/Main";
import CorporateDashboard from "./pages/corporate/Main";
import SeniorAdminDashboard from "./pages/admin/seniorAdmin/Main";
import SuperAdminDashboard from "./pages/admin/superAdmin/Main"

import AboutBEE from "./pages/AboutBEE";
import AboutRCO from "./pages/AboutRCO";
import SessionModal from "./components/SessionModal";
import { useSessionTimer } from "./Hooks/useSessionTimmerHook";
import SLRMain from "./pages/slr/Main";
import SDADashboard from "./pages/sda/Main";
import MopMain from "./pages/mop/Main";
import PaymentSuccessPage from "./pages/trackstatus/PaymentSuccessPage";
import PaymentPage from "./pages/trackstatus/PaymentPage";
import DocumentRejectedPage from "./pages/trackstatus/DocumentRejectedPage";
import PaymentFailurePage from "./pages/trackstatus/PaymentFailurePage";

import CreateTicket from "./pages/HelpDesk/CreateTicket";
import MyTickets from "./pages/HelpDesk/MyTickets";
import HelpdeskLayout from "./pages/HelpDesk/HelpdeskLayout";
import HelpdeskHome from "./pages/HelpDesk/HelpdeskHome";
import NeedAssistance from "./pages/HelpDesk/NeedAssistance";

import DowntimePage from "./pages/DowntimePage";
import NewsPopup from "./pages/NewsPopup";

const DOWNTIME_MODE = false; // Set to false to disable downtime page

const DefaultLayout = () => {
  // Show the news popup only during the scheduled window (inclusive)
  const now = new Date()
  const popupStart = new Date(2026, 2, 16) // March 16, 2026
  const popupEnd = new Date(2026, 2, 22, 23, 59, 59, 999) // March 22, 2026 end of day
  const showNewsPopup = now >= popupStart && now <= popupEnd

  return (
    <div className="flex flex-col w-screen h-screen">
      <PageHeader />
      {
        !DOWNTIME_MODE &&
        <Navbar />
      }
      {showNewsPopup && <NewsPopup />}
      <SessionModal />
      <div className="overflow-y-auto h-[100%] w-[100%]">
        {DOWNTIME_MODE ?
          <DowntimePage
            message="We are currently experiencing an issue with the File server"
            expectedDowntime="4-5 hours"
          /> : <Outlet />}
      </div>
    </div>
  )
}

const LandingPageRoute = () => {
  const location = useLocation();

  if (DOWNTIME_MODE && location.pathname === "/") {
    return <DowntimePage
      message="We are currently experiencing an issue with the NFS server"
      expectedDowntime="4-5 hours"
    />;
  }

  return <FormPage />;
};

const AppInitializer = ({ children }) => {
  const toast = useToast();
  useEffect(() => {
    setToastInstance(toast);
  }, [toast]);

  return children;
};

const ProtectedRoute = ({ children, roles }) => {
  const { session_id, role_code } = useSelector((state) => state.login);

  if (!session_id) {
    return (
      <ErrorPage
        statusCode={403}
        customMessage="Access Denied! Please log in."
        initialTimer={3}
      />
    );
  }

  if (roles && !roles.includes(role_code)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { data, isLoading, isError } = useGetCommonDataQuery(undefined, {
    skip: DOWNTIME_MODE,
  });
  useSessionTimer();

  return (
    <AppInitializer>
      <Router>
        <Routes>
          <Route element={<DefaultLayout />}>
            {/* Public routes */}
            <Route path="/" element={<LandingPageRoute />} />
            <Route path="/formpage" element={<FormPage />} />
            <Route path="/about-bee" element={<AboutBEE />} />
            <Route path="/about-rco" element={<AboutRCO />} />
            <Route path="/status-pending" element={<OldPendingPage />} />
            <Route path="/payment-dashboard" element={<PaymentPage />} />
            <Route path="/document-rejected" element={<DocumentRejectedPage />} />
            <Route path="/payment-success/:order_id" element={<PaymentSuccessPage />} />
            <Route path="/payment-failure/:order_id" element={<PaymentFailurePage />} />

            {/* Role-protected routes */}
            <Route
              path="/mop-dashboard"
              element={
                <ProtectedRoute roles={["MOP", "ADM"]}>
                  <MopMain />
                </ProtectedRoute>
              }
            />
            <Route
              path="/slr-dashboard"
              element={
                <ProtectedRoute roles={["SLR", "USR", "ADM"]}>
                  <SLRMain />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sldc-dashboard"
              element={
                <ProtectedRoute roles={["SLDC", "ADM"]}>
                  <SLDCDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sda-dashboard"
              element={
                <ProtectedRoute roles={["SDA", "ADM"]}>
                  <SDADashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/aea-dashboard"
              element={
                <ProtectedRoute roles={["AEA", "ADM"]}>
                  <AEADashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/firm-dashboard"
              element={
                <ProtectedRoute roles={["FIRM", "ADM"]}>
                  <FirmDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/corporate-dashboard"
              element={
                <ProtectedRoute roles={["CORP", "ADM"]}>
                  <CorporateDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/senior-admin-dashboard"
              element={
                <ProtectedRoute roles={["SNA", "ADM"]}>
                  <SeniorAdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/super-admin-dashboard"
              element={
                <ProtectedRoute roles={["SPA", "ADM"]}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin only */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute roles={["ADM"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/state-form"
              element={
                <ProtectedRoute roles={["ADM"]}>
                  <StateForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pat-reg-form"
              element={
                <ProtectedRoute roles={["ADM"]}>
                  <PatRegForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/org-options"
              element={
                <ProtectedRoute roles={["ADM"]}>
                  <OrganizationManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/discom-form"
              element={
                <ProtectedRoute>
                  <DiscomNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/form-fields"
              element={
                <ProtectedRoute roles={["ADM"]}>
                  <FormFieldsManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cpp-form"
              element={
                <ProtectedRoute>
                  <CppNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fy-manager"
              element={
                <ProtectedRoute roles={["ADM"]}>
                  <FinancialYearManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/aea-registration"
              element={
                <ProtectedRoute roles={["ADM"]}>
                  <AEARegistration />
                </ProtectedRoute>
              }
            />

            {/* ================= HELP DESK MODULE ================= */}

            <Route
              path="/helpdesk"
              element={
                <ProtectedRoute>
                  <HelpdeskLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CreateTicket />} />
              <Route path="overview" element={<HelpdeskHome />} />
              <Route path="my-tickets" element={<MyTickets />} />

              <Route path="need-assistance" element={<NeedAssistance />} />
            </Route>

          </Route>

          {/* Catch-all for undefined routes */}
          <Route path="*" element={<ErrorPage statusCode={404} />} />
        </Routes>
      </Router>
    </AppInitializer>
  );
}

export default App;