// src/redux/apiSlices/patApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery";
import { showToast } from "../../components/toastService";

export const patApi = createApi({
    reducerPath: "patApi",
    baseQuery,
    tagTypes: ["PAT"],
    endpoints: (builder) => ({

        getPatNumbers: builder.query({
            query: ({ page = 1, page_size = 10 }) =>
                `get-pat-registrations?page=${page}&page_size=${page_size}`,
            providesTags: ["PAT"],
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch ({ error }) {
                    showToast({
                        title: "Error fetching PAT numbers",
                        description: error?.data?.detail,
                        status: "error",
                    });
                }
            }
        }),

        addPatNumber: builder.mutation({
            query: (payload) => ({
                url: "create-pat-registration",
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["PAT"],
        }),

        updatePatNumber: builder.mutation({
            query: ({ registration_number, ...payload }) => ({
                url: `update-pat-registration/${registration_number}`,
                method: "PUT",
                body: payload,
            }),
            invalidatesTags: ["PAT"],
        }),
    }),
});

export const { 
    useGetPatNumbersQuery, 
    useAddPatNumberMutation, 
    useUpdatePatNumberMutation 
} = patApi;
