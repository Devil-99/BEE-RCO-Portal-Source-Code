import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery";
import { showToast } from "../../components/toastService";

export const paymentCategoryApi = createApi({
    reducerPath: "paymentCategoryApi",
    baseQuery,
    tagTypes: ['paymentCategory'],
    endpoints: (builder) => ({
        resolveAmount: builder.query({
            query: (params) => ({
                url: '/payment-category/resolve-amount',
                params
            }),
            async onQueryStarted(arg, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error) {
                    const detail = error?.error?.data?.detail || error?.data?.detail || "Unknown error";
                    showToast({
                        title: "Failed to resolve payment amount",
                        description: detail,
                        status: 'error'
                    })
                }
            }
        }),
        getPaymentCategories: builder.query({
            query: () => '/payment-category/list',
            providesTags: ['paymentCategory'],
        }),
        createPaymentCategory: builder.mutation({
            query: (payload) => ({
                url: '/payment-category/create',
                method: 'POST',
                body: payload,
            }),
            invalidatesTags: ['paymentCategory'],
        }),
        updatePaymentCategory: builder.mutation({
            query: ({ id, ...payload }) => ({
                url: `/payment-category/${id}`,
                method: 'PUT',
                body: payload,
            }),
            invalidatesTags: ['paymentCategory'],
        }),
    })
})

export const {
    useResolveAmountQuery,
    useLazyResolveAmountQuery,
    useGetPaymentCategoriesQuery,
    useCreatePaymentCategoryMutation,
    useUpdatePaymentCategoryMutation,
} = paymentCategoryApi
