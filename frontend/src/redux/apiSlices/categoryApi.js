import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery";
import { showToast } from "../../components/toastService";

export const categoryApi = createApi({
  reducerPath: "categoryApi",
  baseQuery,
  endpoints: (builder) => ({
    getCategories: builder.query({
      query: () => "/category-all",
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch ({ error }) {
          showToast({
            title: "Error fetching categories",
            description: error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),
  }),
});

export const {
  useGetCategoriesQuery,
} = categoryApi;
