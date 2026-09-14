import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery"; // use the same baseQuery as other APIs
import { showToast } from "../../components/toastService";

export const submissionPeriodApi = createApi({
  reducerPath: "submissionPeriodApi",
  baseQuery,
  tagTypes: ["submissionPeriods"],
  endpoints: (builder) => ({
    //we can remove getSubmissionPeriods as we have commonApi for fetching submission periods
    getSubmissionPeriods: builder.query({
      query: () => "get-submission-periods",
      providesTags: ["submissionPeriods"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch ({ error }) {
          showToast({
            title: "Error fetching submission periods",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    createSubmissionPeriod: builder.mutation({
      query: (payload) => ({
        url: "create-submission-period",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["submissionPeriods"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          showToast({
            title: "Submission Period Created",
            description: data?.message || "",
            status: "success",
          });
        } catch ({ error }) {
          showToast({
            title: "Error saving Submission Period",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    deleteSubmissionPeriod: builder.mutation({
      query: (id) => ({
        url: `delete-submission-period/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["submissionPeriods"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          showToast({
            title: "Submission Period Deleted",
            status: "info",
          });
        } catch ({ error }) {
          showToast({
            title: "Error deleting submission period",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),
  }),
});

export const {
  //useGetSubmissionPeriodsQuery,
  useCreateSubmissionPeriodMutation,
  useDeleteSubmissionPeriodMutation,
} = submissionPeriodApi;
