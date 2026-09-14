// src/redux/apiSlices/rcoApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery";
import { showToast } from "../../components/toastService";

export const rcoApi = createApi({
  reducerPath: "rcoApi",
  baseQuery,
  tagTypes: ["RCO_TARGETS"],
  endpoints: (builder) => ({
    
    getRcoTargets: builder.query({
      query: () => "/rco-targets/all",
      providesTags: ["RCO_TARGETS"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch ({ error }) {
          showToast({
            title: "Error fetching RCO targets",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    getRcoTargetByStateFY: builder.query({
      query: ({ fy_id }) => `/rco-targets/fy-${fy_id}`,
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch ({ error }) {
          showToast({
            title: "Error fetching RCO target",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    addRcoTarget: builder.mutation({
      query: ({ fy_id, payload }) => ({
        url: `/rco-targets/fy-${fy_id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["RCO_TARGETS"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          showToast({
            title: "RCO target added successfully",
            description: data?.message || "",
            status: "success",
          });
        } catch ({ error }) {
          showToast({
            title: "Error adding RCO target",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    updateRcoTarget: builder.mutation({
      query: ({ fy_id, payload }) => ({
        url: `/update-target/fy-${fy_id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["RCO_TARGETS"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          showToast({
            title: "RCO target updated successfully",
            description: data?.message || "",
            status: "success",
          });
        } catch ({ error }) {
          showToast({
            title: "Error updating RCO target",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),
  }),
});

export const {
  useGetRcoTargetsQuery,
  useGetRcoTargetByStateFYQuery,
  useAddRcoTargetMutation,
  useUpdateRcoTargetMutation,
} = rcoApi;
