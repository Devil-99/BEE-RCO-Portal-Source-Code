// redux/sessionApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery";
import { showToast } from "../../components/toastService";
import { setSessionMeta, closeModal } from "../sessionSlice";

export const sessionApi = createApi({
  reducerPath: "sessionApi",
  baseQuery,
  endpoints: (builder) => ({
    resumeSession: builder.mutation({
      query: () => ({
        url: `refresh-session`,
        method: "POST",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setSessionMeta({ lastActivity: data.last_activity, expiresAt: data.expiry_time }))
          dispatch(closeModal());
          showToast({
            title: data?.message || "Session extended successfully",
            status: "success"
          });
        } catch ({ error }) {

          showToast({
            title: error?.data?.detail || "Unable to extend session",
            status: "error"
          });

        }
      },
    }),
  }),
});

export const { useResumeSessionMutation } = sessionApi;
