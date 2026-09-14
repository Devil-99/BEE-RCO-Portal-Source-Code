import { useRef, useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  HStack,
  Button,
  useToast,
  Text,
  ModalFooter,
} from "@chakra-ui/react";

const OtpVerification = ({
  isOpen,
  onClose,
  onVerifyOtp,
  contactInfo = "",
}) => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const toast = useToast();
  const inputsRef = useRef([]);

  // Handle input change
  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (!val) return;
    let newOtp = [...otp];
    newOtp[idx] = val[0];
    setOtp(newOtp);

    // Move to next input
    if (idx < 5 && val) {
      inputsRef.current[idx + 1]?.focus();
    }

    // Auto-submit if all filled
    if (newOtp.every((d) => d.length === 1)) {
      handleSubmit(newOtp.join(""));
    }
  };

  // Handle backspace
  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  // Submit OTP
  const handleSubmit = async (otpValue) => {
    setIsVerifying(true);
    try {
      const result = await onVerifyOtp(otpValue);
      if (result === true) {
        toast({
          title: "OTP Verified",
          description: "OTP verification successful.",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        setTimeout(onClose, 1000);
      } else {
        throw new Error("Invalid OTP");
      }
    } catch (err) {
      toast({
        title: "OTP Verification Failed",
        description: "Invalid OTP. Please try again.",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      setOtp(Array(6).fill(""));
      inputsRef.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // Reset OTP on modal open/close
  useEffect(() => {
    if (isOpen) {
      setOtp(Array(6).fill(""));
      setTimeout(() => inputsRef.current[0]?.focus(), 200);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Enter OTP</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb={4} fontSize="sm" color="gray.600">
            Enter the 6-digit OTP sent to <b>{contactInfo}</b>
          </Text>
          <HStack justify="center" mb={4}>
            {otp.map((digit, idx) => (
              <Input
                key={idx}
                ref={(el) => (inputsRef.current[idx] = el)}
                maxLength={1}
                size="lg"
                width="2.5rem"
                textAlign="center"
                fontSize="2xl"
                value={digit}
                onChange={(e) => handleChange(e, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                disabled={isVerifying}
                autoFocus={idx === 0}
                type="tel"
              />
            ))}
          </HStack>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            width="100%"
            isLoading={isVerifying}
            onClick={() => handleSubmit(otp.join(""))}
            isDisabled={otp.some((d) => d.length !== 1)}
          >
            Verify OTP
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default OtpVerification;