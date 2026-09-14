import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery";
import { showToast } from "../../components/toastService";

export const stateApi = createApi({
  reducerPath: "stateApi",
  baseQuery,
  tagTypes: ["states"],
  endpoints: (builder) => ({
    getStates: builder.query({
      query: () => "get-states",
      providesTags: ["states"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch ({ error }) {
          showToast({
            title: "Error fetching states",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),
    addState: builder.mutation({
      query: (payload) => ({
        url: "create-state",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["states"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          showToast({ title: "State created successfully", status: "success" });
        } catch ({ error }) {
          showToast({
            title: "Error creating state",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),
    editState: builder.mutation({
      query: (payload) => ({
        url: `update-state/${payload.state_code}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["states"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          showToast({ title: "State updated successfully", status: "success" });
        } catch ({ error }) {
          showToast({
            title: "Error updating state",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),
  }),
});

export const {
  useGetStatesQuery,
  useAddStateMutation,
  useEditStateMutation,
} = stateApi;
