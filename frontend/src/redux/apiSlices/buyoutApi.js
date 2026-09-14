import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../baseQuery';
import { showToast } from '../../components/toastService';

export const buyoutApi = createApi({
    reducerPath: "buyoutApi",
    baseQuery,
    tagTypes: ['BuyoutStatus','Buyout'],
    endpoints: (builder) => ({
        getPurchasedRECs: builder.query({
            query: (fy_id) => `buyout/purchased-recs?fy_id=${fy_id}`,
            transformResponse: (response) => response || [],
            onError: () => {
                showToast({
                    title: "Error fetching purchased RECs",
                    status: "error",
                });
            }
        }),
        buyrec: builder.mutation({
            query: (payload) => ({
                url: '/buyout/buy-recs',
                method: 'POST',
                body: payload,
            }),
            onQueryStarted: async (arg, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    showToast({ title: "RECs bought successfully!", status: "success" });
                } catch ({ error }) {
                    showToast({
                        title: "Error buying RECs",
                        description: error?.data?.detail || 'Unknown error',
                        status: "error"
                    });
                }
            },
        }),
        buyoutRequest: builder.mutation({
            query: (payload) => {
                // Convert the payload to FormData to support file upload
                const formData = new FormData();
                formData.append('fy_id', payload.fy_id);
                formData.append('shortfall_amount', payload.shortfall_amount);
                formData.append('payable_amount', payload.payable_amount);
                formData.append('utr_number', payload.utr_number);
                formData.append('payment_date', payload.payment_date);
                if (payload.payment_proof) {
                    formData.append('payment_proof', payload.payment_proof);
                }

                return {
                    url: 'buyout/buyout-request',
                    method: 'POST',
                    body: formData,
                    // Don't set Content-Type header; let the browser set it with boundary
                };
            },
            invalidatesTags: (result, error, arg) => [{ type: 'BuyoutStatus', id: arg.fy_id }],
            onQueryStarted: async (arg, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    showToast({ title: "Buyout request submitted successfully!", status: "success" });
                } catch ({ error }) {
                    showToast({
                        title: "Error submitting buyout request",
                        description: error?.data?.detail || 'Unknown error',
                        status: "error"
                    });
                }
            },
        }),
        buyoutStatus: builder.query({
            query: (fy_id) => `buyout/buyout-status?fy_id=${fy_id}`,
            transformResponse: (response) => response || {},
            providesTags: (result, error, fy_id) => [{ type: 'BuyoutStatus', id: fy_id }],
            onError: () => {
                showToast({
                    title: "Error fetching buyout status",
                    status: "error",
                });
            }
        }),
        getBuyoutRequestList: builder.query({
            query: () => 'buyout/get-buyout-request-list',
            providesTags: ['Buyout'],
        }),
        adminBuyoutAction: builder.mutation({
            query: ({ buyout_request_id, action, remarks }) => ({
                url: `buyout/admin-action/${buyout_request_id}`,
                method: 'PUT',
                body: {
                    action,
                    remarks,
                },
            }),

            invalidatesTags: ['Buyout'],

            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    await queryFulfilled;

                    showToast({
                        title: 'Action completed successfully',
                        status: 'success',
                    });

                } catch ({ error }) {
                    showToast({
                        title: 'Action failed',
                        description:
                            error?.data?.detail ||
                            'Something went wrong',
                        status: 'error',
                    });
                }
            },
        }),
    })
});

export const {
    useGetPurchasedRECsQuery,
    useBuyrecMutation,
    useBuyoutRequestMutation,
    useBuyoutStatusQuery,

    useGetBuyoutRequestListQuery,
    useAdminBuyoutActionMutation,
} = buyoutApi