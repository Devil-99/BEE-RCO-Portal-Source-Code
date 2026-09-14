import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery";
import { showToast } from "../../components/toastService";

export const trackStatusApi = createApi({
    reducerPath: "trackStatusApi",
    baseQuery,
    endpoints: (builder) => ({
        trackStatus: builder.query({
            query: ({ mobile, otp }) => ({
                url: "track-status",
                method: "GET",
                params: { mobile, otp }
            }),
        }),
        getReviewComment: builder.query({
            query: ({ entity_id }) => ({
                url: "entity/get-review-comment",
                method: "GET",
                params: { entity_id }
            }),
            transformResponse: (response) => response?.comment || response, 
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                } catch (err) {
                    const errMsg = err?.error?.data?.detail || 'Unable to fetch review comment';
                    showToast({
                        title: 'Error',
                        description: errMsg,
                        status: 'error'
                    });
                }
            }
        }),
        getOrderDetails: builder.query({
            query: ({ entity_id }) => ({
                url: `payment/order-details`,
                method: "GET",
                params: { entity_id }
            }),
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                } catch (err) {
                    const errMsg = err?.error?.data?.detail || 'Unable to fetch order details';
                    showToast({
                        title: 'Error',
                        description: errMsg,
                        status: 'error'
                    });
                }
            }
        }),
        createOrderId: builder.mutation({
            query: ({ user_id, entity_id, amount }) => ({
                url: "payment/order-creation",
                method: "POST",
                body: { user_id, entity_id, amount }
            })
        }),
        initiateTransaction: builder.mutation({
            query: ({ order_id, pay_mode }) => ({
                url: "payment/transaction-initiate",
                method: "POST",
                body: { order_id, pay_mode }
            })
        }),
        getPaymentDetails: builder.query({
            query: (order_id) => ({
                url: "payment/payment-details",
                method: "GET",
                params: { order_id }
            })
        })
    })
})

export const {
    useLazyTrackStatusQuery,
    useGetReviewCommentQuery,
    useGetOrderDetailsQuery,
    useCreateOrderIdMutation,
    useInitiateTransactionMutation,
    useGetPaymentDetailsQuery
} = trackStatusApi;