import { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  chakra,
  CircularProgress, CircularProgressLabel
} from "@chakra-ui/react";
import { WarningTwoIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import deloitte_theme from "../theme";
import { STATUS_MESSAGES } from "../constants/constant";
// Framer Motion compatible Chakra component
const MotionBox = chakra(motion.div);

const ErrorPage = ({ statusCode = 404, customMessage = null, initialTimer = 5 }) => {
  const navigate = useNavigate();

  const message =
    customMessage || STATUS_MESSAGES[statusCode] || "404 Not Found !";

  const [timer, setTimer] = useState(initialTimer);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <MotionBox
      margin={"auto"}
      p={8}
      bg={deloitte_theme.primary}
      boxShadow="lg"
      borderRadius="2xl"
      maxW="lg"
      w="100%"
      textAlign="center"
      position={"relative"}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        position="absolute"
        top="5"
        right="5"
      >
        <CircularProgress thickness="1rem" value={100 / initialTimer * timer} color='gray.400'>
          <CircularProgressLabel>{timer}</CircularProgressLabel>
        </CircularProgress>
      </Box>
      <VStack spacing={5}>
        <WarningTwoIcon w={10} h={10} color={deloitte_theme.textWarning} />
        <Heading fontSize="3xl" color={deloitte_theme.textWarning}>
          {statusCode}
        </Heading>
        <Text fontSize="lg" color={deloitte_theme.textPrimary}>
          {message}
        </Text>
        <Text fontSize="sm" color={deloitte_theme.textSecondary}>
          You will be redirected shortly or click below.
        </Text>
        <Button bgColor={deloitte_theme.buttonPrimary} onClick={() => navigate("/")}>
          Go Back Home
        </Button>
      </VStack>
    </MotionBox>
  );
};

export default ErrorPage;
