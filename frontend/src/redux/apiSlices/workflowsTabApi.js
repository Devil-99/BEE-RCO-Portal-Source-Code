import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery";

export const workflowsTabApi = createApi({
  reducerPath: "workflowsTabApi",
  baseQuery,
  tagTypes: ["Workflows"],

  endpoints: (builder) => ({
    getWorkflows: builder.query({
      query: () => "/workflows/get-workflows",
      providesTags: ["Workflows"],
    }),

    createWorkflow: builder.mutation({
      query: (body) => ({
        url: "/workflows/create-workflow",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Workflows"],
    }),

    updateWorkflow: builder.mutation({
      query: (data) => ({
        url: `/workflows/update-workflow/${data.id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Workflows"],
    }),

    getFinancialYears: builder.query({
      query: () => "/get-financial-years",
    }),
  }),
});

export const {
  useGetWorkflowsQuery,
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
  useGetFinancialYearsQuery,
} = workflowsTabApi;