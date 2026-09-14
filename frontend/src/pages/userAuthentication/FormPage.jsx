import { useState, Suspense, lazy } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Button, Flex, SkeletonCircle } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import deloitte_theme from "../../theme";
import { FaBuilding } from "react-icons/fa";
import { FaFacebookF, FaInstagram, FaTwitter, FaUserPlus, FaYoutube } from "react-icons/fa";
import { IoShareSocialSharp } from "react-icons/io5";

const LoginForm = lazy(() => import("./LoginForm"));
const SignupForm = lazy(() => import("./SignupForm"));
const AEARegistration = lazy(() => import("./AEARegistration"));
const FirmRegistration = lazy(() => import("./FirmRegistration"));
const AuditFirmListModal = lazy(() => import("./AuditFirmListModal"));
const ForgotPassword = lazy(() => import("./ForgotPassword"));

import { NewsComponent } from "../../components/NewsComponent";
import BackgroundCarousel from "../../components/BackgroundCarousel";
import DowntimePage from "../DowntimePage";
import CircularIcon from "../../components/CircularIcon";

const DOWNTIME_MODE = false; // Set to false to disable downtime page


const FormPage = () => {
  const [searchParams] = useSearchParams();
  const [firmListOpen, setFirmListOpen] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showSocials, setShowSocials] = useState(false);
  const type = searchParams.get("type");

  const renderForm = () => {
    switch (type) {
      case "login":
        return <LoginForm />;
      case "register":
        return <SignupForm />;
      case "registerAEA":
        return <AEARegistration />;
      case "registerFirm":
        if (DOWNTIME_MODE) {
          return <DowntimePage
            title="Registration Form Unavailable"
            message="Payment Integration in Progress"
            expectedDowntime=""
          />;
        } else {
          return <FirmRegistration />;
        }
      case "forgotPassword":
        return <ForgotPassword />;
      default:
        return (
          <NewsComponent />
        );
    }
  };

  return (
    <>
      <div className="relative w-full min-h-[calc(100vh-10rem)] flex flex-row items-start justify-end">

        {/* Background Carousel */}
        <BackgroundCarousel />

        <Flex justifyContent="center" alignItems="center" rounded="md" className="w-1/3 mr-5 mt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={type || "static"}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <Suspense fallback={<SkeletonCircle />}>
                {renderForm()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </Flex>

        {/* Left Side Hovering icons */}
        <Flex direction='column' gap={deloitte_theme.gap} position='absolute' left={5} bottom={8} zIndex={20} >
          {/* Empaneled Audit Firms */}
          <Flex alignItems="center" gap={deloitte_theme.gap}>
            <button
              onClick={() => setFirmListOpen(true)}
              onMouseEnter={() => setShowText(true)}
              onMouseLeave={() => setShowText(false)}
              className="flex items-center justify-center bg-transparent shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <CircularIcon bg={firmListOpen ? "#4d179a" : "#7f22fe"} p={14}>
                <FaBuilding className="w-6 h-6 text-white" />
              </CircularIcon>
            </button>
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{
                x: showText ? 0 : -15,
                opacity: showText ? 1 : 0,
                width: showText ? "350px" : "0px",
              }}
              transition={{ duration: 0.3 }}
              className="overflowX-hidden whitespace-nowrap"
            >
              <span
                className="text-xs font-medium rounded-md"
                style={{
                  backgroundColor: deloitte_theme.primary,
                  padding: deloitte_theme.paddingY,
                  color: deloitte_theme.ternary,
                }}
              >
                Click here to view BEE Empaneled Audit Firms for FY 2025-26
              </span>
            </motion.div>
          </Flex>

          <Flex
            alignItems="center"
            gap={deloitte_theme.gap}
            onMouseEnter={() => setShowSocials(true)}
            onMouseLeave={() => setShowSocials(false)}
          >
            <CircularIcon p={12} bg="#00a6f4">
              <IoShareSocialSharp className="w-7 h-7 text-white" />
            </CircularIcon>
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{
                x: showSocials ? 0 : -15,
                opacity: showSocials ? 1 : 0,
                width: showSocials ? "200px" : "0px",
              }}
              transition={{ duration: 0.3 }}
              className="overflowX-hidden whitespace-nowrap"
            >
              <Flex gap={deloitte_theme.paddingY}>
                <a
                  href="https://www.facebook.com/beeindiadigital"
                  title="Facebook"
                  className="flex items-center hover:scale-110 transition-all duration-300"
                >
                  <CircularIcon bg="#4267B2">
                    <FaFacebookF className="text-white w-6 h-6" />
                  </CircularIcon>
                </a>
                <a
                  href="https://www.instagram.com/beeindiadigital"
                  title="Instagram"
                  className="flex items-center hover:scale-110 transition-all duration-300"
                >
                  <CircularIcon bg="#E1306C">
                    <FaInstagram className="text-white w-6 h-6" />
                  </CircularIcon>
                </a>
                <a
                  href="https://twitter.com/beeindiadigital"
                  title="Twitter"
                  className="flex items-center hover:scale-110 transition-all duration-300"
                >
                  <CircularIcon bg="#1DA1F2">
                    <FaTwitter className="text-white w-6 h-6" />
                  </CircularIcon>
                </a>
                <a
                  href=" https://www.youtube.com/bureauofenergyefficiency"
                  title="Youtube"
                  className="flex items-center hover:scale-110 transition-all duration-300"
                >
                  <CircularIcon bg="#FF0000">
                    <FaYoutube className="text-white w-6 h-6" />
                  </CircularIcon>
                </a>
              </Flex>
            </motion.div>
          </Flex>
        </Flex>

        {
          firmListOpen &&
          <Suspense fallback={<SkeletonCircle />}>
            <AuditFirmListModal
              isOpen={firmListOpen}
              onClose={() => setFirmListOpen(false)}
            />
          </Suspense>
        }

      </div>

      {/* FOOTER */}
      <Box
        as="footer"
        position="fixed"
        bottom="0"
        w="full"
        py={0.5}
        px={deloitte_theme.paddingX}
        zIndex={2}
        sx={deloitte_theme.glass}
      >
        <div className="flex justify-between items-center text-white text-xs">
          <div>Best viewed in Microsoft Edge v130 or higher</div>

          <div> Developed and Maintained by Deloitte India.</div>

          <div>Minimum Recommended Resolution 1366 x 768</div>
        </div>
      </Box>

    </>
  );
};

export default FormPage;