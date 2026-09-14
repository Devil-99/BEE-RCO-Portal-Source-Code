import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery";
import { showToast } from "../../components/toastService";

export const sectorApi = createApi({
  reducerPath: "sectorApi",
  baseQuery,
  tagTypes: ["Common"], // must match commonApi
  endpoints: (builder) => ({

    addSectorType: builder.mutation({
      query: (payload) => ({
        url: "create-sector_type",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Common"], // refresh shared dropdown/data
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
          showToast({ title: "New sector created", status: "success" });
        } catch ({ error }) {
          showToast({
            title: "Error creating sector",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    editSectorType: builder.mutation({
      query: (payload) => ({
        url: `update-sector_type/${payload?.sector_code}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Common"], // triggers refetch
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          showToast({
            title: `Sector ${data?.sector_name} updated`,
            status: "success",
          });
        } catch ({ error }) {
          showToast({
            title: "Error updating sector",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

  }),
});

export const {
  useAddSectorTypeMutation,
  useEditSectorTypeMutation,
} = sectorApi;
