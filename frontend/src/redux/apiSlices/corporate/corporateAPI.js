import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../../baseQuery";
import { showToast } from "../../../components/toastService";

export const corporateAPI = createApi({
    reducerPath: "corporateAPI",
    baseQuery,
    tagTypes: ["corporate"],
    endpoints: (builder) => ({
        getMappedEntitiesList: builder.query({
            query: () => '/corp_child/mapped_list',
            providesTags: ['corporate'],
            async onQueryStarted(arg, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error) {
                    const detail = error?.error?.data?.detail || error?.data?.detail || "Unknown error";
                    showToast({
                        title: "Failed to fetch mapped entities",
                        description: detail,
                        status: 'error'
                    })
                }
            }
        }),
        getAllEntitiesList: builder.query({
            query: () => '/corp_child/all_list',
            async onQueryStarted(arg, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error) {
                    const detail = error?.error?.data?.detail || error?.data?.detail || "Unknown error";
                    showToast({
                        title: "Failed to fetch all entities",
                        description: detail,
                        status: 'error'
                    })
                }
            }
        }),
        mapCorpChildEntity: builder.mutation({
            query: (payload) => ({
                url: '/corp_child/mapping',
                method: 'POST',
                body: payload
            }),
            invalidatesTags: ["corporate"],
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    showToast({
                        title: 'Corporate mapping successful.',
                        description: 'Entity mapped for this financial year only.',
                        status: 'success',
                    });
                } catch (err) {
                    showToast({
                        title: 'Error mapping entity to corporate',
                        description: err?.error?.data?.detail || 'Unknown error',
                        status: 'error',
                    });
                }
            }
        }),
        corpMappingRequestAction: builder.mutation({
            query: (payload) => ({
                url: '/corp_child/mapping-approve',
                method: 'PUT',
                body: payload
            }),
            invalidatesTags: ["corporate"],
            onQueryStarted: async (arg, {queryFulfilled}) => {
                try {
                    const result = await queryFulfilled;
                    showToast({
                        title: 'Action performed successfully.',
                        description: result.data?.message,
                        status: 'success',
                    });
                } catch (err) {
                    showToast({
                        title: 'Error mapping.',
                        description: err?.error?.data?.detail || 'Unknown error',
                        status: 'error',
                    });
                }
            }
        }),
        getMappedEntitiesDetails: builder.query({
            query: (fy_id) => `/corp_child/mapped_entities_details${fy_id ? `?fy_id=${fy_id}` : ''}`,
            providesTags: ['corporate'],
            async onQueryStarted(arg, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error) {
                    const detail = error?.error?.data?.detail || error?.data?.detail || "Unknown error";
                    showToast({
                        title: "Failed to fetch mapped entities details",
                        description: detail,
                        status: 'error'
                    })
                }
            }
        }),
        getCorporateBuyoutSummary: builder.query({
            query: (fy_id) => `/corp_child/corporate_buyout_summary${fy_id ? `?fy_id=${fy_id}` : ''}`,
            providesTags: ['corporate'],
            async onQueryStarted(arg, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error) {
                    const detail = error?.error?.data?.detail || error?.data?.detail || "Unknown error";
                    showToast({
                        title: "Failed to fetch corporate buyout summary",
                        description: detail,
                        status: 'error'
                    })
                }
            }
        })
    })
})

export const {
    useGetMappedEntitiesListQuery,
    useGetAllEntitiesListQuery,
    useMapCorpChildEntityMutation,
    useCorpMappingRequestActionMutation,
    useGetMappedEntitiesDetailsQuery,
    useGetCorporateBuyoutSummaryQuery
} = corporateAPI