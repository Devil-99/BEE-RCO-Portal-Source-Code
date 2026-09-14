import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../baseQuery';
import { showToast } from '../../components/toastService';

export const firmDashboardApi = createApi({
    reducerPath: 'firmDashboardApi',
    baseQuery,
    tagTypes: ['Entities', 'Auditors'],
    endpoints: (builder) => ({
        getAllFirmNames: builder.query({
            query: () => 'firms/names',
            async onQueryStarted(arg, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error) {
                    const detail =
                        error?.error?.data?.detail || error?.data?.detail || "Unknown error";
                    showToast({
                        title: "Unable to fetch firm names",
                        description: detail,
                        status: 'error',
                    });
                }
            },
        }),

        searchFirmByName: builder.query({
            query: (firmName) => `firms/firm_id/${firmName}`,
            async onQueryStarted(arg, { queryFulfilled }) {
                try {

                    await queryFulfilled;
                } catch (error) {
                    const detail =
                        error?.error?.data?.detail || error?.data?.detail || "Unknown error";
                    showToast({
                        title: "Empanelled Auditing Firm Not Found",
                        description: detail,
                        status: 'error',
                    });
                }
            }
        }),

        getFirmEntities: builder.query({
            query: ({ fy_id }) => (
                {
                    url: `firms/mapped-entities`,
                    method: 'GET',
                    params: { fy_id }
                }
            ),
            providesTags: ['Entities'],
            transformResponse: (response) => response || [],
            onError: () => {
                showToast({
                    title: "Error fetching firm entities",
                    status: "error",
                });
            }
        }),


        getFirmAuditors: builder.query({
            query: () => `aea/mapped-aeas`,
            transformResponse: (response) => response || [],
            providesTags: ['Auditors'],
            onError: () => {
                showToast({
                    title: "Error fetching firm auditors",
                    status: "error",
                });
            }
        }),

        approveAuditor: builder.mutation({
            query: (auditor_id) => ({
                url: `aea/approve-auditor`,
                method: 'POST',
                body: auditor_id,
            }),
            invalidatesTags: ['Auditors'],
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    showToast({
                        title: 'Auditor approved successfully.',
                        status: 'success',
                    });
                } catch (err) {
                    showToast({
                        title: 'Error approving auditor',
                        description: err?.error?.data?.detail || 'Unknown error',
                        status: 'error',
                    });
                }
            },
        }),

        rejectAuditor: builder.mutation({
            query: (auditor_id) => ({
                url: `aea/reject-auditor`,
                method: 'POST',
                body: auditor_id
            }),
            invalidatesTags: ["Auditors"],
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    showToast({
                        title: 'Auditor rejected successfully.',
                        status: 'success',
                    });
                } catch (err) {
                    showToast({
                        title: 'Error rejecting auditor',
                        description: err?.error?.data?.detail || 'Unknown error',
                        status: 'error',
                    });
                }
            },
        }),

        mapEntityAuditor: builder.mutation({
            query: (payload) => ({
                url: 'firms/entity-firm-auditor-mapping',
                method: 'POST',
                body: payload,
            }),
            invalidatesTags: ['Entities'],
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    showToast({
                        title: 'Entity mapped to auditor successfully.',
                        status: 'success',
                    });
                } catch (err) {
                    showToast({
                        title: 'Error mapping entity to auditor',
                        description: err?.error?.data?.detail || 'Unknown error',
                        status: 'error',
                    });
                }
            },
        }),
    }),
});

export const {
    useGetAllFirmNamesQuery,
    useLazySearchFirmByNameQuery,
    useGetFirmEntitiesQuery,
    useGetFirmAuditorsQuery,
    useApproveAuditorMutation,
    useRejectAuditorMutation,
    useMapEntityAuditorMutation,
} = firmDashboardApi;
