import { useEffect, useState } from "react";
import {
    Box,
    FormControl,
    FormLabel,
    Input,
    Button,
    HStack,
} from "@chakra-ui/react";
import deloitte_theme from "../../theme";
import instance from "../../api_instance";
import { showToast } from "../../components/toastService";
import { motion } from "framer-motion";
import { isValidMobile, isValidEmail } from "../../utils/validation";
import { useFirmRegistrationMutation } from "../../redux/apiSlices/authApi";
import { useSendOtpMutation } from "../../redux/apiSlices/smsApi";
import { useLazySearchFirmByNameQuery, useGetAllFirmNamesQuery } from "../../redux/apiSlices/firmDashboardApi";
import SuccessModal from "./SuccessModal";

function FirmRegistration() {
    const [firmRegistration, { isLoading: registrationLoader }] = useFirmRegistrationMutation();
    const [triggerSearchFirm, { isFetching }] = useLazySearchFirmByNameQuery();
    const { data: firmNames, isFetching: isFirmNamesFetching } = useGetAllFirmNamesQuery();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [formData, setFormData] = useState({
        firm_name: "",
        address: "",
        full_name: "",
        email: "",
        mobile: "",
        otp: ""
    });

    const [filteredFirmNames, setFilteredFirmNames] = useState([]);

    useEffect(() => {
        setFilteredFirmNames(firmNames);
        const handler = setTimeout(() => {
            const query = formData.firm_name.trim().toLowerCase();
            const filtered = (firmNames || []).filter((firm) =>
                firm.toLowerCase().includes(query)
            );
            setFilteredFirmNames(filtered);
        }, 300);

        return () => clearTimeout(handler);
    }, [formData.firm_name, firmNames])

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [response, setResponse] = useState({
        message: '',
        username: ''
    });

    const onChangeHandler = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
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

    const handleSearch = async () => {
        if (!formData.firm_name) {
            showToast({
                title: "Firm Name required",
                description: "Please enter Firm Name before searching.",
                status: "warning",
            });
            return;
        }

        const data = await triggerSearchFirm(formData.firm_name).unwrap();

        const { full_name, address, mobile, email } = data;

        setFormData((prev) => ({
            ...prev,
            address,
            full_name,
            mobile,
            email
        }));
    };

    const handleValidation = (formData) => {
        if (
            !formData.firm_name ||
            !formData.address ||
            !formData.full_name ||
            !isValidEmail(formData.email) ||
            !isValidMobile(formData.mobile)
        ) {
            showToast({
                title: "Please fill all fields correctly",
                status: "error",
            });
            return;
        }

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
            const resData = await firmRegistration(formData).unwrap();
            setResponse({
                message: resData.message,
                username: resData.username
            });
            setShowSuccessModal(true);
            setFormData({
                firm_name: "",
                address: "",
                full_name: "",
                email: "",
                mobile: "",
                otp: ""
            })
        } catch (error) {
            console.error("Firm registration failed:", error);
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
                    Audit Firm Registration
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
                <FormControl>
                    <FormLabel className="text-sm text-gray-700">Firm Name</FormLabel>
                    <HStack>
                        <Box position="relative" width="100%">
                            <Input
                                name="firm_name"
                                placeholder="Enter Empanelled Audit Firm Name"
                                value={formData.firm_name}
                                onChange={onChangeHandler}
                                onFocus={() => setIsMenuOpen(true)}
                                onBlur={() => setTimeout(() => setIsMenuOpen(false), 200)}
                                size="md"
                                borderColor="gray.300"
                            />
                            {isMenuOpen &&
                                <Box
                                    position="absolute"
                                    top="100%"
                                    left="0"
                                    right="0"
                                    sx={deloitte_theme.glass}
                                    color="white"
                                    mt={1}
                                    zIndex={10}
                                    maxH="200px"
                                    overflowY="auto"
                                >
                                    {!isFirmNamesFetching && filteredFirmNames.length === 0 && (
                                        <Box px={3} py={2}>No results found</Box>
                                    )}

                                    {!isFirmNamesFetching &&
                                        filteredFirmNames.map((firmName) => (
                                            <Box
                                                key={firmName}
                                                px={deloitte_theme.paddingX}
                                                py={deloitte_theme.paddingY}
                                                cursor="pointer"
                                                _hover={{ bg: deloitte_theme.glassBackground }}
                                                onMouseDown={() => {
                                                    // onMouseDown prevents blur before click
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        firm_name: firmName
                                                    }));
                                                    setIsMenuOpen(false);
                                                }}
                                            >
                                                {firmName}
                                            </Box>
                                        ))}
                                </Box>
                            }
                        </Box>
                        <Button
                            onClick={handleSearch}
                            isLoading={isFetching}
                            color="black"
                            border="1px solid"
                            borderColor={deloitte_theme.buttonPrimary}
                            backgroundColor={deloitte_theme.white}
                            _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary, color: "white" }}
                            height="2.5rem"
                            fontSize="sm"
                        >
                            Search
                        </Button>
                    </HStack>
                </FormControl>

                <FormControl>
                    <FormLabel className="text-sm text-gray-700">Address</FormLabel>
                    <Input
                        name="address"
                        placeholder="Enter Address"
                        value={formData.address}
                        onChange={onChangeHandler}
                        size="md"
                        borderColor="gray.300"
                    />
                </FormControl>

                <FormControl>
                    <FormLabel className="text-sm text-gray-700">Full Name</FormLabel>
                    <Input
                        name="full_name"
                        placeholder="Enter Lead Energy Auditor Name"
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
                {/* OTP Bypass */}
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
}

export default FirmRegistration;
