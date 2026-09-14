import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery"; 
import { showToast } from "../../components/toastService";

export const auditFirmApi = createApi({
  reducerPath: "auditFirmApi",
  baseQuery,
  tagTypes: ["audit_firm"],
  endpoints: (builder) => ({
    getAuditFirms: builder.query({
      query: () => `firms/get-firms`,
      providesTags: ["audit_firm"],

      transformResponse: (response) => response || [], 
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          const detail =
            error?.error?.data?.detail ||
            error?.data?.detail ||
            "Unknown error";

          showToast({
            title: "Error fetching listed firms",
            description: detail,
            status: "error",
          });
        }
      },
    }),

    getRegisteredAuditFirms: builder.query({
      query: () => `firms/registered`,
      providesTags: ["audit_firm"],

      transformResponse: (response) => response || [], 
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          const detail =
            error?.error?.data?.detail ||
            error?.data?.detail ||
            "Unknown error";

          showToast({
            title: "Error fetching registered audit firms",
            description: detail,
            status: "error",
          });
        }
      },
    }),

    addAuditFirm: builder.mutation({
      query: (payload) => ({
        url: "/firms/create-firm",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [{ type: "audit_firm", id: "LIST" }],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          showToast({
            title: "Audit firm added successfully",
            description: data?.message || "",
            status: "success",
          });
        } catch ({ error }) {
          showToast({
            title: "Error adding audit firm",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    updateAuditFirm: builder.mutation({
      query: ({ id, ...rest }) => ({
        url: `/firms/update-firms/${id}`,
        method: "PUT",
        body: rest,
      }),
      invalidatesTags: (result, error, arg) =>
        result ? [{ type: "audit_firm", id: arg.id }, { type: "audit_firm", id: "LIST" }] : [{ type: "audit_firm", id: "LIST" }],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          showToast({
            title: "Audit firm updated successfully",
            description: data?.message || "",
            status: "success",
          });
        } catch ({ error }) {
          showToast({
            title: "Error updating audit firm",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    deleteAuditFirm: builder.mutation({
      query: (id) => ({
        url: `/firms/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "audit_firm", id: "LIST" }],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          showToast({
            title: "Audit firm deleted successfully",
            status: "info",
          });
        } catch ({ error }) {
          showToast({
            title: "Error deleting audit firm",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

uploadAuditFirmExcel: builder.mutation({
  query: (formData) => ({
    url: "/firms/upload-excel",
    method: "POST",
    body: formData,
  }),

  invalidatesTags: [{ type: "audit_firm", id: "LIST" }],

  async onQueryStarted(_, { queryFulfilled }) {
    try {
      const { data } = await queryFulfilled;

      showToast({
        title: "Upload Successful",
        description: `${data?.inserted_count || 0} firms added, ${
   data?.updated_count || 0
} firms updated.`,
        status: "success",
      });
    } catch ({ error }) {
      const detail = error?.data?.detail;

      if (detail?.errors?.length) {
        showToast({
          title: "Validation Failed",
          description: "Please review the errors below.",
          status: "warning",
        });
      } else {
        showToast({
          title: "Upload Failed",
          description:
            typeof detail === "string"
              ? detail
              : detail?.message || "Failed to upload audit firms.",
          status: "error",
        });
      }
    }
  },
}),
  }),
});

export const {
  useGetAuditFirmsQuery,
  useGetRegisteredAuditFirmsQuery,
  useAddAuditFirmMutation,
  useUpdateAuditFirmMutation,
  useDeleteAuditFirmMutation,
  useUploadAuditFirmExcelMutation
} = auditFirmApi;
