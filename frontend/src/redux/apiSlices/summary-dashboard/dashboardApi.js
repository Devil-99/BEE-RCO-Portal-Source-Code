import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../../baseQuery";
import { showToast } from "../../../components/toastService";

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery,
  tagTypes: ["dashboard"],
  endpoints: (builder) => ({
    getDashboardSummaryReport: builder.query({
      query: ({ fy_id }) => ({
        url: "dashboard/get-summary-detail",
        method: 'GET',
        params: {fy_id}
      }),
      providesTags: ["dashboard"],
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          const detail =
            error?.error?.data?.detail ||
            error?.data?.detail ||
            "Unknown error";

          showToast({
            title: "Failed to fetch dashboard data",
            description: detail,
            status: "error",
          });
        }
      },
    }),
  }),
});

export const { useGetDashboardSummaryReportQuery } = dashboardApi;