import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FormControl,
  FormLabel,
  Input,
  Button,
  HStack,
  InputGroup,
  InputLeftAddon
} from "@chakra-ui/react";
import deloitte_theme from "../../theme";
import instance from "../../api_instance";
import { showToast } from "../../components/toastService";
import { motion } from "framer-motion";
import { isValidMobile, isValidEmail } from "../../utils/validation";
import { useAeaRegistrationMutation } from "../../redux/apiSlices/authApi";
import { useLazySearchAEAByIdQuery } from "../../redux/apiSlices/aeaDashboardApi";
import { useSendOtpMutation } from "../../redux/apiSlices/smsApi";
import SuccessModal from "./SuccessModal";

const AEARegistration = () => {
  const navigate = useNavigate();
  const [aeaRegistration, { isLoading: registrationLoader }] = useAeaRegistrationMutation();
  const [formData, setFormData] = useState({
    aea_id: "",
    full_name: "",
    email: "",
    mobile: "",
    otp: ""
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [response, setResponse] = useState({
    message: '',
    username: ''
  });

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    if (name === 'aea_id') {
      // Allow only numeric input and prefix with "AEA-"
      const numericValue = value.replace(/[^0-9]/g, '');  // Strip non-digits
      setFormData((prev) => ({ ...prev, [name]: 'AEA-' + numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  
  const [emailOtp, setEmailOtp] = useState("");
  const [showEmailVerificationField, setShowEmailVerificationField] = useState(false);
  const [showMobileVerificationField, setShowMobileVerificationField] = useState(false);

  const handleEmailOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 6) setEmailOtp(value);
  };

  const [sendOtp, { isLoading: sendingOtp }] = useSendOtpMutation();

  const handleSendVerification = async (type) => {
    if (type === "mobile") {
      const phoneNumber = formData.mobile;
      if (!isValidMobile(phoneNumber)) return;
      try {
        const data = await sendOtp({ number: phoneNumber, tsFlag: false }).unwrap();
        setShowMobileVerificationField(true);
      } catch (error) {
        console.error(error);
      }
    }

    if (type === "email") {
      setShowEmailVerificationField(true);

      showToast({
        title: "Verification Code Sent",
        description: "Code sent to your email.",
        status: "info",
      });
    }
  };

  const [serachAEA, { isLoading: searching }] = useLazySearchAEAByIdQuery();

  const handleSearch = async () => {
    if (!formData.aea_id) {
      showToast({
        title: "Auditor ID required",
        description: "Please enter Auditor ID before searching.",
        status: "warning",
      });
      return;
    }

    const data = await serachAEA(formData.aea_id).unwrap();

    const { full_name, email, mobile } = data;

    setFormData((prev) => ({
      ...prev,
      full_name: full_name || "",
      email: email || "",
      mobile: mobile || "",
    }));
  };

  const handleValidation = (formData) => {
    if (!formData.aea_id || !formData.full_name || !formData.email || !formData.mobile) {
      showToast({
        title: "Validation Error",
        description: "All fields are required.",
        status: "warning",
      });
      return false;
    }
    if (!isValidEmail(formData.email)) return false;
    if (!isValidMobile(formData.mobile)) return false;

    if (!formData.otp || formData.otp.length !== 6) {
      showToast({
        title: "Validation Error",
        description: "Please enter a valid 6 digit OTP.",
        status: "warning",
      });
      return false;
    }
    return true
  }

  const handleRegister = async () => {
    if (!handleValidation(formData)) return;

    try {
      const data = await aeaRegistration(formData).unwrap();
      setResponse({
        message: data.message,
        username: data.username
      })
      setShowSuccessModal(true);
      setFormData({
        aea_id: "",
        full_name: "",
        email: "",
        mobile: "",
      });
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div
        className="text-center"
        style={{
          paddingTop: deloitte_theme.paddingY,
          paddingBottom: deloitte_theme.paddingY,
        }}
      >
        <p
          className="text-2xl font-semibold text-gray-800 tracking-wide"
          style={{
            paddingTop: deloitte_theme.paddingY,
            paddingBottom: deloitte_theme.paddingY,
          }}
        >
          AEA Registration
        </p>
        <div
          className="w-40 h-1 mx-auto rounded-full"
          style={{ backgroundColor: deloitte_theme.secondary }}
        ></div>
      </div>

      <div
        className="h-[62vh] overflow-y-auto inset-shadow-sm flex flex-col"
        style={{
          padding: deloitte_theme.paddingX,
          gap: deloitte_theme.gap,
        }}
      >
        {/* Auditor ID with Search */}
        <FormControl>
          <FormLabel className="text-sm text-gray-700">Energy Auditor ID</FormLabel>
          <HStack>
            <InputGroup>
              <InputLeftAddon children="AEA-" />
              <Input
                name="aea_id"
                placeholder="Enter Auditor Number"
                value={formData.aea_id.replace(/^AEA-/, '')}  // Display only the numeric part
                onChange={onChangeHandler}
                size="md"
                borderColor="gray.300"
              />
            </InputGroup>
            <Button
              onClick={handleSearch}
              color="black"
              border="1px solid"
              borderColor={deloitte_theme.buttonPrimary}
              backgroundColor={deloitte_theme.white}
              _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary, color: "white" }}
              height="2.5rem"
              fontSize="sm"
              isLoading={searching}
            >
              Search
            </Button>
          </HStack>
        </FormControl>

        <FormControl>
          <FormLabel className="text-sm text-gray-700">Full Name</FormLabel>
          <Input
            name="full_name"
            placeholder="Enter Full Name"
            value={formData.full_name}
            onChange={onChangeHandler}
            size="md"
            borderColor="gray.300"
          />
        </FormControl>

        <FormControl>
          <FormLabel className="text-sm text-gray-700">Email</FormLabel>
          <Input
            name="email"
            placeholder="Enter Email"
            type="email"
            value={formData.email}
            onChange={onChangeHandler}
            size="md"
            borderColor="gray.300"
          />
        </FormControl>

        {/* OTP Bypass */}
        {/* <div className="flex items-start gap-4 w-full">
          <motion.div
            animate={{ width: showEmailVerificationField ? "35%" : "100%" }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0"
          >
            <Button
              width="100%"
              onClick={() => handleSendVerification("email")}
              color="black"
              border="1px solid"
              borderColor={!showEmailVerificationField && deloitte_theme.buttonWarning}
              backgroundColor={deloitte_theme.white}
              height="2.5rem"
              fontSize="sm"
            >
              {showEmailVerificationField ? "Resend" : "Verify"}
            </Button>
          </motion.div>

          {showEmailVerificationField && (
            <motion.div
              animate={{ width: "65%", opacity: 1 }}
              initial={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FormControl>
                <Input
                  name="emailOtp"
                  placeholder="Enter Code Sent to Email"
                  value={emailOtp}
                  onChange={handleEmailOtpChange}
                  pattern="\d{6}"
                  inputMode="numeric"
                  maxLength={6}
                  size="md"
                  borderColor="gray.300"
                />
              </FormControl>
            </motion.div>
          )}
        </div> */}

        <FormControl>
          <FormLabel className="text-sm text-gray-700">Mobile</FormLabel>
          <Input
            name="mobile"
            placeholder="Enter Mobile Number"
            value={formData.mobile}
            onChange={onChangeHandler}
            size="md"
            borderColor="gray.300"
          />
        </FormControl>
        {/* OTP Bypass  */}
        <div className="flex items-start gap-4 w-full">
          <motion.div
            animate={{ width: showMobileVerificationField ? "35%" : "100%" }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0"
          >
            <Button
              width="100%"
              onClick={() => handleSendVerification("mobile")}
              color="black"
              border="1px solid"
              borderColor={!showMobileVerificationField && deloitte_theme.buttonWarning}
              backgroundColor={deloitte_theme.white}
              height="2.5rem"
              fontSize="sm"
            >
              {showMobileVerificationField ? "Resend" : "Verify"}
            </Button>
          </motion.div>

          {showMobileVerificationField && (
            <motion.div
              animate={{ width: "65%", opacity: 1 }}
              initial={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FormControl>
                <Input
                  name="otp"
                  placeholder="Enter Code Sent to Mobile"
                  value={formData.otp}
                  onChange={onChangeHandler}
                  pattern="\d{6}"
                  inputMode="numeric"
                  maxLength={6}
                  size="md"
                  borderColor="gray.300"
                />
              </FormControl>
            </motion.div>
          )}
        </div>

        {
          showMobileVerificationField &&
          <Button
            className="flex-shrink-0"
            width="100%"
            onClick={handleRegister}
            backgroundColor={deloitte_theme.buttonPrimary}
            _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
            height="2.5rem"
            fontSize="sm"
            isLoading={registrationLoader}
          >
            Register
          </Button>
        }
      </div>
      <SuccessModal response={response} isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
    </div>
  );
};

export default AEARegistration;
