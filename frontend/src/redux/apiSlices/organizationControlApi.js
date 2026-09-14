import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery";
import { showToast } from "../../components/toastService";

export const organizationApi = createApi({
  reducerPath: "organizationApi",
  baseQuery,
  tagTypes: ["organizations"],
  endpoints: (builder) => ({

    //remove this as we have commonApi for fetching organization options
    getOrganizationOptions: builder.query({
      query: () => "get-organization_options",
      providesTags: ["organizations"],
    }),
    addOrganization: builder.mutation({
      query: (payload) => ({
        url: "create-organization_option/",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["organizations"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          showToast({ title: "Organization created", status: "success" });
        } catch ({ error }) {
          showToast({
            title: "Error creating organization",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),
    editOrganization: builder.mutation({
      query: (payload) => ({
        url: `update-organization_option/${payload.id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["organizations"],
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          showToast({
            title: `Organization ${data.organization_name} updated`,
            status: "success",
          });
        } catch ({ error }) {
          showToast({
            title: "Error updating organization",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),
  }),
});

export const {
  //useGetOrganizationOptionsQuery,
  useAddOrganizationMutation,
  useEditOrganizationMutation,
} = organizationApi;
