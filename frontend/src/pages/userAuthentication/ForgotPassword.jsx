import React, { useState, useEffect, useRef } from 'react'
import deloitte_theme from '../../theme'
import {
    FormControl,
    FormLabel,
    Input,
    Button,
    InputGroup,
    InputRightElement
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { useResetPasswordMutation, useVerifyUsernameMutation, useVerifyUsernameOTPMutation } from '../../redux/apiSlices/authApi';
import { showToast } from '../../components/toastService';
import instance from '../../api_instance';
import { useNavigate } from 'react-router-dom';

function ForgotPassword() {
    const navigate = useNavigate();
    const usernameFieldRef = useRef(null);
    const [username, setUsername] = useState('');
    useEffect(() => {
        if (usernameFieldRef.current) {
            usernameFieldRef.current.focus();
        }
    }, []);

    const [userVerificationStatus, setUserVerificationStatus] = useState(false);

    const [verifyUsername, { isLoading: usernameVerifying }] = useVerifyUsernameMutation();
    const [showVerificationField, setShowVerificationField] = useState(false);

    const handleSendOTP = async () => {
        if (!username) {
            showToast({
                title: 'Please provide username !',
                status: "warning"
            })
            return;
        }
        try {
            await verifyUsername(username).unwrap();
            setShowVerificationField(true);
        } catch (error) {
            console.error(error);
        }
    }

    const [otp, setOtp] = useState('');
    const [token, setToken] = useState('');
    const [verifyUsernameOTP, { isLoading: otpVerifying }] = useVerifyUsernameOTPMutation();
    const handleVerifyOTP = async () => {
        if (!otp) {
            showToast({
                title: 'Please enter the OTP sent to your mobile number !',
                status: "warning"
            });
            return;
        }

        try {
            const otpRes = await verifyUsernameOTP({ username, otp }).unwrap();

            setToken(otpRes?.resetToken);
            setUserVerificationStatus(true);
        } catch (otpError) {
            console.error(otpError);
        }
    };


    const [password, setPassword] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState({
        newPassword: false,
        confirmPassword: false
    })
    const [resetPassword, { isLoading: reseting }] = useResetPasswordMutation();
    const handleChangePassword = async () => {
        if (password.newPassword !== password.confirmPassword) {
            showToast({
                title: 'Passwords do not match !',
                status: "warning"
            })
            return;
        }
        try {
            const res = await resetPassword({
                new_password: password.newPassword,
                token
            }).unwrap();
            showToast({
                title: res?.message || 'Password Reset Successful !',
                status: "success"
            })
            navigate('/formpage?type=login');
        } catch (error) {
            // Extract meaningful error message safely
            const backendMessage =
                error?.data?.detail?.[0]?.msg ||      // Pydantic error (422)
                error?.data?.detail ||                // Custom backend detail
                error?.data?.message ||               // Custom message
                error?.error ||                       // RTK general error
                "Invalid OTP. Please try again.";        // Fallback

            showToast({
                title: "OTP Verification Failed",
                description: backendMessage,
                status: "error",
            });
        }
    }

    return (
        <div className="bg-white h-[70vh] rounded-lg shadow-lg">
            {/* Header  */}
            <div
                className="text-center"
                style={{
                    paddingTop: deloitte_theme.paddingY,
                    paddingBottom: deloitte_theme.paddingY,
                }}>
                <p className="text-xl font-semibold text-gray-900 ">
                    Forgot Password
                </p>
                <div className="w-40 h-1 mx-auto rounded-full" style={{ backgroundColor: deloitte_theme.secondary }}></div>
            </div>
            {
                userVerificationStatus ?
                    <div
                        className="overflow-y-auto inset-shadow-sm flex flex-col"
                        style={{ padding: deloitte_theme.paddingX, gap: deloitte_theme.gap }}
                    >
                        <FormControl>
                            <FormLabel className="text-sm text-gray-700">New Password</FormLabel>
                            <InputGroup>
                                <Input
                                    name="newPassword"
                                    type={showPassword.newPassword ? "text" : "password"}
                                    placeholder="Enter Password"
                                    value={password.newPassword}
                                    onChange={(e) => setPassword({ ...password, [e.target.name]: e.target.value })}
                                    size="md"
                                    borderColor="gray.300"
                                />
                                <InputRightElement width="3rem">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowPassword({ ...showPassword, newPassword: !showPassword.newPassword })}
                                    >
                                        {showPassword.newPassword ? <ViewOffIcon /> : <ViewIcon />}
                                    </Button>
                                </InputRightElement>
                            </InputGroup>
                        </FormControl>

                        <FormControl>
                            <FormLabel className="text-sm text-gray-700">Confirm Password</FormLabel>
                            <InputGroup>
                                <Input
                                    name="confirmPassword"
                                    type={showPassword.confirmPassword ? "text" : "password"}
                                    placeholder="Enter Password"
                                    value={password.confirmPassword}
                                    onChange={(e) => setPassword({ ...password, [e.target.name]: e.target.value })}
                                    size="md"
                                    borderColor="gray.300"
                                />
                                <InputRightElement width="3rem">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowPassword({ ...showPassword, confirmPassword: !showPassword.confirmPassword })}
                                    >
                                        {showPassword.confirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                                    </Button>
                                </InputRightElement>
                            </InputGroup>
                        </FormControl>
                        <Button
                            width="100%"
                            onClick={handleChangePassword}
                            color="black"
                            border="1px solid"
                            borderColor={deloitte_theme.buttonPrimary}
                            backgroundColor={deloitte_theme.white}
                            _hover={{
                                backgroundColor: deloitte_theme.buttonHoverPrimary,
                                color: "white",
                            }}
                            height="2.5rem"
                            fontSize="sm"
                            isLoading={reseting}
                        >
                            Submit
                        </Button>
                    </div>
                    :
                    <div
                        className="overflow-y-auto inset-shadow-sm flex flex-col"
                        style={{ padding: deloitte_theme.paddingX, gap: deloitte_theme.gap }}
                    >
                        {/* Username Field */}
                        <FormControl>
                            <FormLabel className="text-sm text-gray-700">Username</FormLabel>
                            <Input
                                ref={usernameFieldRef}
                                placeholder="Enter Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                size="md"
                                borderColor="gray.300"
                            />
                        </FormControl>

                        {/* OTP Verification Section */}
                        {
                            <div className="flex items-start gap-4 w-full">
                                <motion.div
                                    animate={{ width: showVerificationField ? "35%" : "100%" }}
                                    transition={{ duration: 0.3 }}
                                    className="flex-shrink-0"
                                >
                                    <Button
                                        width="100%"
                                        onClick={handleSendOTP}
                                        color="black"
                                        border="1px solid"
                                        borderColor={deloitte_theme.buttonPrimary}
                                        backgroundColor={deloitte_theme.white}
                                        _hover={{
                                            backgroundColor: deloitte_theme.buttonHoverPrimary,
                                            color: "white",
                                        }}
                                        height="2.5rem"
                                        fontSize="sm"
                                        isLoading={usernameVerifying}
                                    >
                                        {showVerificationField ? "Resend OTP" : "Get OTP"}
                                    </Button>
                                </motion.div>

                                {showVerificationField && (
                                    <motion.div
                                        animate={{ width: "65%", opacity: 1 }}
                                        initial={{ width: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <FormControl>
                                            <Input
                                                placeholder="Enter OTP"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                size="md"
                                                borderColor="gray.300"
                                            />
                                        </FormControl>
                                    </motion.div>
                                )}
                            </div>
                        }
                        {
                            showVerificationField &&
                            <Button
                                width="100%"
                                onClick={handleVerifyOTP}
                                color="black"
                                border="1px solid"
                                borderColor={deloitte_theme.buttonPrimary}
                                backgroundColor={deloitte_theme.white}
                                _hover={{
                                    backgroundColor: deloitte_theme.buttonHoverPrimary,
                                    color: "white",
                                }}
                                height="2.5rem"
                                fontSize="sm"
                                isLoading={otpVerifying}
                            >
                                Submit
                            </Button>
                        }

                    </div>
            }
            {/* Forgot Password Link */}
            <div className="text-center">
                <p
                    onClick={() => navigate("/formpage?type=login")}
                    className="text-sm text-gray-600 hover:underline cursor-pointer"
                >
                    Go to Login ?
                </p>
            </div>
        </div>
    )
}

export default ForgotPassword