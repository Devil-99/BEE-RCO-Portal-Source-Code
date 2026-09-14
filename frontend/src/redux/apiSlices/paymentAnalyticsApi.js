import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery";
import { showToast } from "../../components/toastService";

export const paymentAnalyticsApi = createApi({
    reducerPath: "paymentAnalyticsApi",
    baseQuery,
    tagTypes: ['paymentAnalytics'],
    endpoints: (builder) => ({
        getPaymentAnalytics: builder.query({
            query: ({ entity_id, start_date, end_date }) => {
                const params = {};
                if (entity_id) params.entity_id = entity_id;
                if (start_date) params.start_date = start_date;
                if (end_date) params.end_date = end_date;
                return {
                    url: "dashboard/payment-analytics",
                    method: "GET",
                    params
                };
            },
            providesTags: ['paymentAnalytics'],
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error) {
                    showToast({
                        title: "Error fetching payment analytics",
                        status: "error",
                    });
                }
            },
        }),
        getPaymentList: builder.query({
            query: ({   entity_id,
                        entity_type,
                        payment_mode,
                        payment_status,
                        category,
                        state_code,
                        start_date,
                        end_date,
                        search,
                        search_type,
                        page,
                        page_size,}) => {
                const params = {};
                if (entity_id) params.entity_id = entity_id;
                if (entity_type) params.entity_type = entity_type;
                if (payment_mode) params.payment_mode = payment_mode;
                if (payment_status) params.payment_status = payment_status;
                if (category) params.category = category;
                if (state_code) params.state_code = state_code;
                if (start_date) params.start_date = start_date;
                if (end_date) params.end_date = end_date;

                if (search?.trim()) {
                    params.search = search.trim();
                    params.search_type = search_type;
                }

                if (page) params.page = page;
                if (page_size) params.page_size = page_size;
                return {
                    url: "dashboard/payment-list",
                    method: "GET",
                    params
                };
            },
            providesTags: ['paymentAnalytics'],
            keepPreviousData: true,
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error) {
                    showToast({
                        title: "Error fetching payment list",
                        status: "error",
                    });
                }
            },
        }),
    })
})

export const {
    useGetPaymentAnalyticsQuery,
    useGetPaymentListQuery,
} = paymentAnalyticsApi
