import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery";
import { showToast } from "../../components/toastService";

export const aeaApi = createApi({
  reducerPath: "aeaApi",
  baseQuery,
  tagTypes: ["AEA"],
  endpoints: (builder) => ({
    getAEA: builder.query({
      query: () => `/get-aeas`,
      providesTags: ["AEA"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch ({ error }) {
          showToast({
            title: "Error fetching auditors",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),
    getRegisteredAEA: builder.query({
      query: () => `/get-registered-aeas`,
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch ({ error }) {
          showToast({
            title: "Error fetching registered auditors",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),
    addAEA: builder.mutation({
      query: (data) => ({
        url: `/aea/create-aea`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["AEA"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          showToast({
            title: "AEA created successfully",
            description: data?.message || "",
            status: "success",
          });
        } catch ({ error }) {
          showToast({
            title: "Error creating AEA",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    editAEA: builder.mutation({
      query: (payload) => ({
        url: `/aea/update-aea`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["AEA"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          showToast({
            title: "AEA updated successfully",
            description: data?.message || "",
            status: "success",
          });
        } catch ({ error }) {
          showToast({
            title: "Error updating AEA",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    uploadAEAExcel: builder.mutation({
      query: (formData) => ({
        url: "/aea/upload-excel",
        method: "POST",
        body: formData,
      }),

      invalidatesTags: ["AEA"],

      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;

          showToast({
            title: "Energy Auditors uploaded successfully",
            description: data?.message || "",
            status: "success",
          });
        } catch ({ error }) {
          showToast({
            title: "Error uploading Energy Auditors",
            description:
                error?.data?.detail?.message ||
                error?.data?.detail ||
                "Unknown error",
            status: "error",
          });
        }
      },
    }),

    deleteAEA: builder.mutation({
      query: (aea_id) => ({
        url: '/aea/delete-aea',
        method: "DELETE",
        params: { aea_id },
      }),
      invalidatesTags: ["AEA"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          showToast({
            title: "AEA deleted successfully",
            description: data?.message || "",
            status: "info",
          });
        } catch ({ error }) {
          showToast({
            title: "Error deleting AEA",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),
  }),
});

export const {
  useGetAEAQuery,
  useGetRegisteredAEAQuery,
  useAddAEAMutation,
  useEditAEAMutation,
  useUploadAEAExcelMutation,
  useDeleteAEAMutation,
} = aeaApi;
