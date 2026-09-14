import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../baseQuery';
import { showToast } from '../../components/toastService';

export const smsApi = createApi({
  reducerPath: 'smsApi',
  baseQuery,
  endpoints: (builder) => ({
    sendOtp: builder.mutation({
      query: ({ number, tsFlag }) => ({
        url: 'auth/send-otp',
        method: 'POST',
        body: {
          number,
          ...(tsFlag ? { tsFlag } : {}),
        },
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          showToast({
            title: data?.message || 'OTP sent successfully',
            status: 'success',
          });
        } catch (error) {
          const errMsg = error?.data?.detail || error?.error?.data?.detail || 'Failed to send OTP.';
          showToast({
            title: 'Error Sending OTP',
            description: errMsg,
            status: 'error'
          });
        }
      },
    }),
  }),
});

export const { useSendOtpMutation } = smsApi;
