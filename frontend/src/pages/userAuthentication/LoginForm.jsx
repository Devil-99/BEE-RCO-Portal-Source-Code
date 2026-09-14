import { useEffect, useRef, useState } from "react";
import {
  FormControl,
  FormLabel,
  Input,
  Button,
  InputGroup,
  InputRightElement,
  FormErrorMessage,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import deloitte_theme from "../../theme";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useLoginMutation, useVerifyCredentialsMutation } from "../../redux/apiSlices/authApi";
import { showToast } from "../../components/toastService";

const LoginForm = () => {
  const navigate = useNavigate();
  const [loginApi, { isLoading }] = useLoginMutation();
  const usernameFieldRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);

  const [userDetails, setUserDetails] = useState({
    username: "",
    password: "",
    verificationCode: "",
  });

  const [verifyCredentials, { isLoading: usernameVerifying }] = useVerifyCredentialsMutation();

  const [showVerificationField, setShowVerificationField] = useState(false);
  const [formError, setFormError] = useState({ username: "", password: "", otp: "" });

  useEffect(() => {
    if (usernameFieldRef.current) {
      usernameFieldRef.current.focus();
    }
  }, []);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
    setFormError((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSendOTP = async () => {
    if (!userDetails.username) {
      setFormError((prev) => ({
        ...prev,
        username: "Username is required.",
      }));
      return;
    }
    if (!userDetails.password) {
      setFormError((prev) => ({
        ...prev,
        password: "Password is required.",
      }));
      return;
    }
    try {
      await verifyCredentials({ username: userDetails.username, password: userDetails.password }).unwrap();
      setShowVerificationField(true);
    } catch (error) {
      const backendMessage =
        error?.data?.detail?.[0]?.msg ||      // Pydantic error (422)
        error?.data?.detail ||                // Custom backend detail
        error?.data?.message ||               // Custom message
        error?.error ||                       // RTK general error
        "Network issue. Please try again.";        // Fallback
      console.error(backendMessage)
    }
  }

  const handleLogin = async (e) => {
    // Basic validations
    let hasError = false;
    if (!userDetails.username) {
      setFormError((prev) => ({
        ...prev,
        username: "Username is required.",
      }));
      hasError = true;
    }
    if (!userDetails.password) {
      setFormError((prev) => ({
        ...prev,
        password: "Password is required.",
      }));
      hasError = true;
    }
    if (!userDetails.verificationCode) {
      setFormError((prev) => ({
        ...prev,
        otp: "OTP is required.",
      }));
      hasError = true;
    }
    if (userDetails.verificationCode.length !== 6) {
      setFormError((prev) => ({
        ...prev,
        otp: "OTP must be exactly 6 digits.",
      }));
      hasError = true;
    }

    if (hasError) return;

    try {
      const response = await loginApi({
        username: userDetails.username,
        password: userDetails.password,
        verificationCode: userDetails.verificationCode,
      }).unwrap();

      const role_code = response.role_code;
      const username = response.username;

      if (role_code === "ADM" && username.split("-")[2] === "ADM") navigate("/admin-dashboard");
      else if (role_code === "AEA") navigate("/aea-dashboard");
      else if (role_code === "FIRM") navigate("/firm-dashboard");
      else if (role_code === "SLDC" && username.split("-")[2] === "SLDC") navigate("/sldc-dashboard");
      else if (role_code === "SDA" && username.split("-")[2] === "SDA") navigate("/sda-dashboard");
      else if (role_code === "MOP" && username.split("-")[2] === "MOP") navigate("/mop-dashboard");
      else if (role_code === "SLR" && username.split("-")[2] === "SLR") navigate("/slr-dashboard");
      else if (role_code === "USR" && username.split("-")[2] === "USR") navigate("/slr-dashboard");
      else if (role_code === "CORP" && username.split("-")[2] === "CORP") navigate("/corporate-dashboard");
      else if (role_code === "SNA" && username.split("-")[2] === "SNA") navigate("/senior-admin-dashboard");
      else if (role_code === "SPA" && username.split("-")[2] === "SPA") navigate("/super-admin-dashboard");
      else navigate("/404error")

    } catch (error) {
      const backendMessage =
        error?.data?.detail?.[0]?.msg ||      // Pydantic error (422)
        error?.data?.detail ||                // Custom backend detail
        error?.data?.message ||               // Custom message
        error?.error ||                       // RTK general error
        "Invalid OTP. Please try again.";        // Fallback

      showToast({
        title: "Login Failed",
        description: backendMessage,
        status: "error",
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!showVerificationField) {
      handleSendOTP();
    } else {
      handleLogin();
    }
  };


  return (
    <div className="bg-white h-[70vh] rounded-lg shadow-lg">
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
          Login
        </p>
        <div
          className="w-40 h-1 mx-auto rounded-full"
          style={{ backgroundColor: deloitte_theme.secondary }}
        ></div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="overflow-y-auto inset-shadow-sm flex flex-col"
        style={{ padding: deloitte_theme.paddingX, gap: deloitte_theme.gap }}
      >
        {/* Username Field */}
        <FormControl isInvalid={!!formError.username}>
          <FormLabel className="text-sm text-gray-700">Username</FormLabel>
          <Input
            ref={usernameFieldRef}
            name="username"
            placeholder="Enter Username"
            value={userDetails.username}
            onChange={onChangeHandler}
            size="md"
            borderColor="gray.300"
          />
          <FormErrorMessage>{formError.username}</FormErrorMessage>
        </FormControl>

        {/* Password Field with Eye Toggle */}
        <FormControl isInvalid={!!formError.password}>
          <FormLabel className="text-sm text-gray-700">Password</FormLabel>
          <InputGroup>
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              value={userDetails.password}
              onChange={onChangeHandler}
              autoComplete="off"
              size="md"
              borderColor="gray.300"
            />
            <InputRightElement width="3rem">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <ViewIcon /> : <ViewOffIcon />}
              </Button>
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{formError.password}</FormErrorMessage>
        </FormControl>

        {showVerificationField && (
          <div className="flex items-start gap-4 w-full">
            <motion.div
              animate={{ width: "35%" }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0"
            >
              <Button
                width="100%"
                onClick={handleSendOTP}
                color="black"
                border="1px solid"
                borderColor={deloitte_theme.buttonHoverWarning}
                backgroundColor={deloitte_theme.white}
                height="2.5rem"
                fontSize="sm"
                isDisabled={!userDetails.username || !userDetails.password}
              >
                Resend
              </Button>
            </motion.div>

            <motion.div
              animate={{ width: "65%", opacity: 1 }}
              initial={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FormControl isInvalid={!!formError.otp}>
                <Input
                  name="verificationCode"
                  placeholder="Enter 6 digit OTP"
                  value={userDetails.verificationCode}
                  onChange={onChangeHandler}
                  pattern="\d{6}"
                  inputMode="numeric"
                  maxLength={6}
                  size="md"
                  borderColor="gray.300"
                />
                <FormErrorMessage>{formError.otp}</FormErrorMessage>
              </FormControl>
            </motion.div>
          </div>
        )}

        {!showVerificationField ? (
          <Button
            width="100%"
            type="submit"
            color="black"
            border="1px solid"
            borderColor={deloitte_theme.buttonPrimary}
            backgroundColor={deloitte_theme.white}
            _hover={{
              backgroundColor: deloitte_theme.buttonHoverPrimary,
              color: "white",
            }}
            isLoading={usernameVerifying}
            isDisabled={!userDetails.username || !userDetails.password}
          >
            Verify
          </Button>
        ) : (
          <Button
            width="100%"
            type="submit"
            backgroundColor={deloitte_theme.buttonPrimary}
            color="black"
            _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
            isLoading={isLoading}
            isDisabled={!userDetails.verificationCode || userDetails.verificationCode.length !== 6}
          >
            Login
          </Button>
        )}

      </form>
      {/* Forgot Password Link */}
      <div className="text-center">
        <p
          onClick={() => navigate("/formpage?type=forgotPassword")}
          className="text-sm text-gray-600 hover:underline cursor-pointer"
        >
          Forgot Password ?
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
