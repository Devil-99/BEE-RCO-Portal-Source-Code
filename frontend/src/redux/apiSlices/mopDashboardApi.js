import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery";
import { showToast } from "../../components/toastService";

export const mopDashboardApi = createApi({
  reducerPath: "mopDashboardApi",
  baseQuery,
  tagTypes: ["MopDashboard"],
  endpoints: (builder) => ({
    getMopDashboardSummary: builder.query({
      query: ({ fy_id }) => ({
        url: "dashboard/mop-summary",
        method: "GET",
        params: { fy_id },
      }),
      providesTags: ["MopDashboard"],
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          const detail =
            error?.error?.data?.detail ||
            error?.data?.detail ||
            "Unknown error";
          showToast({
            title: "Failed to fetch MoP dashboard data",
            description: detail,
            status: "error",
          });
        }
      },
    }),
  }),
});

export const { useGetMopDashboardSummaryQuery } = mopDashboardApi;
