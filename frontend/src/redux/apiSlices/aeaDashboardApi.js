import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../baseQuery';
import { showToast } from '../../components/toastService';

export const aeaDashboardApi = createApi({
    reducerPath: "aeaDashboardApi",
    baseQuery,
    tagTypes: ['AEAEntities', 'AEAFirms'],
    endpoints: (builder) => ({
        searchAEAById: builder.query({
            query: (aea_id) => ({
                url: '/search-aea-by-id',
                method: 'GET',
                params: { aea_id },
            }),
            async onQueryStarted(arg, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error) {
                    const detail =
                        error?.error?.data?.detail || error?.data?.detail || "Unknown error";
                    showToast({
                        title: "Accredited Energy Auditor Not Found",
                        description: detail,
                        status: 'error',
                    });
                }
            }
        }),

        getAeaEntities: builder.query({
            query: () => `aea/mapped-entities`,
            providesTags: ['AEAEntities'],
            transformResponse: (response) => response || [],
            onError: () => {
                showToast({
                    title: "Error fetching mapped entities",
                    status: "error",
                });
            }
        }),

        getAeaMappedFirms: builder.query({
            query: () => `aea/mapped-firms`,
            providesTags: ['AEAFirms'],
            transformResponse: (response) => response || [],
            onError: () => {
                showToast({
                    title: "Error fetching mapped firms",
                    status: "error",
                });
            }
        }),

        getAllFirms: builder.query({
            query: () => `firms/listed`,
            transformResponse: (response) => response || [],
            onError: () => {
                showToast({
                    title: "Error fetching listed firms",
                    status: "error",
                });
            }
        }),

        mapAuditorFirm: builder.mutation({
            query: (payload) => ({
                url: 'aea/auditor-firm-mapping',
                method: 'POST',
                body: payload,
            }),
            invalidatesTags: ['AEAFirms'],
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    showToast({
                        title: 'Auditor mapped to firm successfully.',
                        status: 'success',
                    });
                } catch (err) {
                    showToast({
                        title: 'Error mapping auditor to firm',
                        description: err?.error?.data?.detail || 'Unknown error',
                        status: 'error',
                    });
                }
            },
        }),
    })
});

export const {
    useLazySearchAEAByIdQuery,
    useGetAeaEntitiesQuery,
    useGetAeaMappedFirmsQuery,
    useGetAllFirmsQuery,
    useMapAuditorFirmMutation
} = aeaDashboardApi;
