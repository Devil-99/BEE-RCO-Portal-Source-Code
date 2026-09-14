import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../../baseQuery";
import { showToast } from "../../../components/toastService";

export const rbacApi = createApi({
    reducerPath: "rbacApi",
    baseQuery,
    tagTypes: ['users', 'roles'],
    endpoints: (builder) => ({
        getUserList: builder.query({
            query: () => `get-user-list`,
            providesTags: ['users'],
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error) {
                    showToast({
                        title: "Error fetching users",
                        status: "error",
                    });
                }
            },
        }),
        updateUserDetails: builder.mutation({
            query: ({ user_id, updatedDetails }) => ({
                url: `update-user/${user_id}`,
                method: 'PUT',
                body: updatedDetails,
            }),
            invalidatesTags: ['users'],
            onQueryStarted: async (arg, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    showToast({ title: "User details updated successfully!", status: "success" });
                } catch ({ error }) {
                    showToast({
                        title: "Error updating user details",
                        description: error?.data?.detail || 'Unknown error',
                        status: "error"
                    });
                }
            },
        }),
        getRoles: builder.query({
            query: () => `admin/get-all-roles`,
            providesTags: ['roles'],
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error) {
                    showToast({
                        title: "Error fetching roles",
                        status: "error",
                    });
                }
            },
        }),
        createUser: builder.mutation({
            query: (payload) => ({
                url: 'create-user',
                method: 'POST',
                body: payload,
            }),
            invalidatesTags: ['users'],
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                    showToast({
                        title: "User created successfully",
                        status: "success",
                    });
                } catch ({error}) {
                    const backendError = error?.data?.detail || "Failed to create user. Please try again.";
                    showToast({
                        title: "Error creating user",
                        status: "error",
                        description: backendError
                    });
                }
            }
        }),
        createRole: builder.mutation({
            query: (payload) => ({
                url: "admin/create-role",
                method: "POST",
                body: payload,
            }),

            invalidatesTags: ["roles"],

            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;

                    showToast({
                        title: "Role created successfully",
                        status: "success",
                    });
                } catch ({ error }) {
                    const backendError =
                        error?.data?.detail ||
                        "Failed to create role. Please try again.";

                    showToast({
                        title: "Error creating role",
                        status: "error",
                        description: backendError,
                    });
                }
            },
        }),
    }),
});

export const { useGetUserListQuery, useUpdateUserDetailsMutation, useGetRolesQuery, useCreateUserMutation, useCreateRoleMutation } = rbacApi;