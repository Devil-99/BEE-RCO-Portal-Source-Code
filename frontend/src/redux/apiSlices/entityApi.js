// src/redux/api/entityApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery";
import { showToast } from "../../components/toastService";

export const entityApi = createApi({
  reducerPath: "entityApi",
  baseQuery,
  tagTypes: ["entities"], // for invalidatesTags
  endpoints: (builder) => ({
    // GET Entity Details
    getEntityDetails: builder.query({
      query: (entity_id) => ({
        url: '/get-entity-by-id',
        method: "GET",
        params: { entity_id },
      }),
      transformResponse: (response) => response?.data || response,
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          showToast({
            title: "Error fetching entity details",
            status: "error",
          });
        }
      },
    }),

    // POST Upload Rejected Documents
    uploadRejectedDocs: builder.mutation({
      query: ({ entity_id, files }) => {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        return {
          url: `/entity/reupload-docs/${entity_id}`,
          method: "POST",
          body: formData
        };
      },
      invalidatesTags: ["entities"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          showToast({
            title: "Error uploading documents",
            status: "error",
          });
        }
      },
    }),
  }),
});

export const {
  useGetEntityDetailsQuery,
  useUploadRejectedDocsMutation,
} = entityApi;
