import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../baseQuery';
import { showToast } from '../../components/toastService';

export const entityDashboardApi = createApi({
    reducerPath: "entityDashboardApi",
    baseQuery,
    tagTypes: ['Firms'],
    endpoints: (builder) => ({
        searchEnergyManager: builder.query({
            query: (registration_number) => ({
                url: `energy-managers/search/`,
                method: 'GET',
                params: { registration_number },
            }),
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch ({ error }) {
                    showToast({
                        title: 'Error fiding Energy Manager',
                        description: error?.data?.detail || 'Unknown error',
                        status: 'error',
                    });
                }
            }
        }),
        getRegisteredFirms: builder.query({
            query: () => `firms/entity_id`,
            providesTags: ['Firms'],
            transformResponse: (response) => response,
            onError: () => {
                showToast({
                    title: "Error fetching registered firm",
                    status: "error",
                });
            }
        }),
        getListedFirms: builder.query({
            query: () => `firms/listed`,
            transformResponse: (response) => response || [],
            onError: () => {
                showToast({
                    title: "Error fetching listed firms",
                    status: "error",
                });
            }
        }),
        registerFirm: builder.mutation({
            query: ({ firm_id, fy_id }) => ({
                url: `firms/entity-firm-mapping`,
                method: 'POST',
                body: { firm_id, fy_id },
            }),
            invalidatesTags: ['Firms'], // <-- triggers refetch of registered firms
            onQueryStarted: async (arg, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    showToast({ title: "Empanelled Energy Auditing Firm registered successfully!", status: "success" });
                } catch ({ error }) {
                    showToast({
                        title: "Error registering firm",
                        description: error?.data?.detail || 'Unknown error',
                        status: "error"
                    });
                }
            },
        }),
        getSubmissionStatus: builder.query({
            query: (fy_id) => ({
                url: `form/annual-submission-status`,
                method: 'GET',
                params: { fy_id },
            }),
            transformResponse: (response) => response || { submitted: false, status: null, is_closed: null },
            onError: () => {
                showToast({
                    title: "Error fetching submission status",
                    status: "error",
                });
            }
        }),
        generateFormDData: builder.query({
            query: (fy_id) => ({
                url: `/form/form-d-generate`,
                method: 'GET',
                params: { fy_id },
            }),
            transformResponse: (response) => response || {},
            onError: () => {
                showToast({
                    title: "Error fetching Form D details",
                    status: "error",
                });
            }
        }),
    })
})

export const {
    useLazySearchEnergyManagerQuery,
    useGetListedFirmsQuery,
    useGetRegisteredFirmsQuery,
    useRegisterFirmMutation,
    useGetSubmissionStatusQuery,
    useLazyGenerateFormDDataQuery
} = entityDashboardApi