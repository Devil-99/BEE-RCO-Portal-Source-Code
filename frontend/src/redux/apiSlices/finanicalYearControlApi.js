import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery"; 
import { showToast } from "../../components/toastService";

export const financialYearApi = createApi({
  reducerPath: "financialYearApi",
  baseQuery,
  tagTypes: ["financialYear"],
  endpoints: (builder) => ({

    //remove this as we have commonApi for fetching financial years
    getFinancialYears: builder.query({
      query: () => "get-financial-years",
      providesTags: ["financialYear"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch ({ error }) {
          showToast({
            title: "Error fetching financial years",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    addFinancialYear: builder.mutation({
      query: (payload) => ({
        url: "create-financial-year",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["financialYear"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          showToast({ title: "Financial Year created", status: "success" });
        } catch ({ error }) {
          showToast({
            title: "Error creating financial year",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    updateFinancialYear: builder.mutation({
      query: ({ id, ...rest }) => ({
        url: `update-financial-year/${id}`,
        method: "PUT",
        body: rest,
      }),
      invalidatesTags: ["financialYear"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          showToast({ title: "Financial Year updated", status: "success" });
        } catch ({ error }) {
          showToast({
            title: "Error updating financial year",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    deleteFinancialYear: builder.mutation({
      query: (id) => ({
        url: `delete-financial-year/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["financialYear"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          showToast({ title: "Financial Year deleted", status: "success" });
        } catch ({ error }) {
          showToast({
            title: "Error deleting financial year",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),
  }),
});

export const {
  //useGetFinancialYearsQuery,
  useAddFinancialYearMutation,
  useUpdateFinancialYearMutation,
  useDeleteFinancialYearMutation,
} = financialYearApi;
