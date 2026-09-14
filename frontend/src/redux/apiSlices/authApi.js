import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../baseQuery';
import { showToast } from '../../components/toastService';
import { loginSuccess, logout, passwordChange } from '../LoginSlice';
import { clearPrefillData } from '../RegistrationSlice';
import { startSession, endSession } from "../sessionSlice";

export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: baseQuery,
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: "login",
                method: "POST",
                body: credentials,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(loginSuccess(data));
                    dispatch(startSession({ loginTime: data.login_time, expiryTime: data.expiry_time }));
                } catch (error) {
                    console.error(error);
                }
            }
        }),
        logout: builder.mutation({
            query: () => ({
                url: "logout",
                method: "POST",

            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(logout());
                    dispatch(endSession());
                } catch (error) {
                    showToast({
                        title: "Logout Failed",
                        description: error?.error?.data?.detail,
                        status: "error",
                    });
                }
            }
        }),
        verifyUsername: builder.mutation({
            query: (username) => ({
                url: "send-otp-to-username",
                method: "POST",
                params: { username }
            }),
            async onQueryStarted(arg, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    showToast({
                        title: data.message || "OTP sent successfully",
                        status: "success",
                    });
                } catch ({ error }) {
                    showToast({
                        title: "Username Verification Failed",
                        description: error?.data?.detail || "Network Error",
                        status: "error",
                    });
                }
            }
        }),
        verifyCredentials: builder.mutation({
            query: ({ username, password }) => ({
                url: "verify-login-credentials",
                method: "POST",
                body: { username, password }
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    showToast({
                        title: data.message || "OTP sent successfully",
                        description: `Expires in: ${data.expires_in} mins.`,
                        status: "success",
                    });
                } catch ({ error }) {
                    showToast({
                        title: "Wrong Credential",
                        description: error?.data?.detail || "Wrong Credential",
                        status: "error",
                    });
                }
            }
        }),
        verifyUsernameOTP: builder.mutation({
            query: ({ username, otp }) => ({
                url: "verify-username-otp",
                method: "POST",
                body: { username, otp },
            }),
            async onQueryStarted(arg, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    showToast({
                        title: data.message || "OTP verified successfully",
                        status: "success",
                    });
                } catch ({ error }) {
                    showToast({
                        title: "OTP Verification Failed",
                        description: error?.data?.detail || "Network Error",
                        status: "error",
                    });
                }
            }
        }),
        resetPassword: builder.mutation({
            query: ({ new_password, token }) => ({
                url: "reset-password",
                method: "POST",
                body: { new_password, token },
            })
        }),
        passwordChange: builder.mutation({
            query: (credentials) => ({
                url: "change-password",
                method: "POST",
                body: credentials,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(passwordChange());
                    showToast({
                        title: "Password Changed Successfully",
                        description: data.message || "Your password has been updated.",
                        status: "success",
                    });
                } catch (error) {
                    showToast({
                        title: "Password Change Failed",
                        description: error?.error?.data?.detail || error.message,
                        status: "error",
                    });
                }
            }
        }),
        entityRegistration: builder.mutation({
            query: (formData) => ({
                url: "register",
                method: "POST",
                body: formData
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    showToast({
                        title: "Application submitted successfully.",
                        description: data.message || "Your application is under review.",
                        status: "success",
                    });
                    dispatch(clearPrefillData());
                } catch ({ error }) {
                    showToast({
                        title: "Registration Failed",
                        description: error?.data?.detail || error.message,
                        status: "error",
                    });
                }
            }
        }),
        firmRegistration: builder.mutation({
            query: (formData) => ({
                url: "firms/register",
                method: "POST",
                body: formData,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                } catch ({ error }) {
                    const errMsg =
                        error?.data?.detail ||
                        "Something went wrong.";
                    showToast({
                        title: "Firm Registration Failed",
                        description: errMsg,
                        status: "error",
                    });
                }
            }
        }),
        aeaRegistration: builder.mutation({
            query: (formData) => ({
                url: "aea/register",
                method: "POST",
                body: formData,
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    showToast({
                        title: data.message,
                        description: "Login with your AEA Registration Number",
                        status: "success",
                    });
                } catch ({ error }) {
                    const errMsg =
                        error?.data?.detail ||
                        "Something went wrong.";
                    showToast({
                        title: "AEA Registration Failed",
                        description: errMsg,
                        status: "error",
                    });
                }
            }
        }),
    })
});

export const {
    useLoginMutation,
    useLogoutMutation,
    useVerifyUsernameMutation,
    useVerifyCredentialsMutation,
    useVerifyUsernameOTPMutation,
    usePasswordChangeMutation,
    useResetPasswordMutation,
    useEntityRegistrationMutation,
    useFirmRegistrationMutation,
    useAeaRegistrationMutation
} = authApi;