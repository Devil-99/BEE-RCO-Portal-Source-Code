import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../../baseQuery";
import { showToast } from "../../../components/toastService";

export const helpdeskAPI = createApi({
  reducerPath: "helpdeskAPI",
  baseQuery,
  tagTypes: ["Tickets", "Dashboard", "Category"],

  endpoints: (builder) => ({

    // ============================
    // DASHBOARD
    // ============================
    getDashboardStats: builder.query({
      query: () => "/helpdesk/dashboard",
      providesTags: ["Dashboard"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (err) {
          showToast({
            title: "Failed to load dashboard",
            description: err?.error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    // ============================
    // TICKETS
    // ============================
    getMyTickets: builder.query({
      query: () => "/helpdesk/tickets",
      providesTags: ["Tickets"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (err) {
          showToast({
            title: "Failed to fetch tickets",
            description: err?.error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    getRecentTickets: builder.query({
      query: () => "/helpdesk/recent-tickets",
      providesTags: ["Tickets"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (err) {
          showToast({
            title: "Failed to fetch recent tickets",
            description: err?.error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    // ============================
    // CREATE TICKET
    // ============================
    createTicket: builder.mutation({
      query: (payload) => ({
        url: "/helpdesk/tickets",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Tickets", "Dashboard"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          showToast({
            title: "Ticket created successfully",
            status: "success",
          });
        } catch (err) {
          showToast({
            title: "Error creating ticket",
            description: err?.error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    // ============================
    // RESOLVE TICKET
    // ============================
    resolveTicket: builder.mutation({
      query: ({ ticketId, formData }) => ({
        url: `/helpdesk/tickets/${ticketId}/resolve`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Tickets", "Dashboard"],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const res = await queryFulfilled;
          showToast({
            title: "Ticket resolved successfully",
            description: res.data?.message,
            status: "success",
          });
        } catch (err) {
          showToast({
            title: "Error resolving ticket",
            description: err?.error?.data?.detail || "Unknown error",
            status: "error",
          });
        }
      },
    }),

    // ============================
    // CATEGORY
    // ============================
    getCategories: builder.query({
      query: () => "/helpdesk/categories",
      providesTags: ["Category"],
    }),

    getSubcategories: builder.query({
      query: (categoryId) =>
        `/helpdesk/subcategories/${categoryId}`,
    }),

  }),
});

// ============================
// EXPORT HOOKS
// ============================
export const {
  useGetDashboardStatsQuery,
  useGetMyTicketsQuery,
  useGetRecentTicketsQuery,
  useCreateTicketMutation,
  useResolveTicketMutation,
  useGetCategoriesQuery,
  useGetSubcategoriesQuery,
} = helpdeskAPI;