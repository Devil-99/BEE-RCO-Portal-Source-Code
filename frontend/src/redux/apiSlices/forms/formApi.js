import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../../baseQuery';
import { showToast } from '../../../components/toastService';

// Helper to normalize base string (remove leading slash)
const normalizeBase = (base) => (base ? String(base).replace(/^\//, '') : '');

export const formsApi = createApi({
  reducerPath: 'formsApi',
  baseQuery,
  tagTypes: ['FormsMeta', 'FormData'],
  endpoints: (builder) => ({
    getSections: builder.query({
      query: (base) => `${normalizeBase(base)}/sections`,
      transformResponse: (res) => res || [],
      providesTags: ['FormsMeta'],
    }),
    getFields: builder.query({
      query: (base) => `${normalizeBase(base)}/fields`,
      transformResponse: (res) => res || [],
      providesTags: ['FormsMeta'],
    }),
    getFinancialYears: builder.query({
      query: () => `financial-year`,
      transformResponse: (res) => res || [],
      providesTags: ['FormsMeta'],
    }),
    getPeriodsForFy: builder.query({
      query: (fyId) => `submission-period/fy-${fyId}`,
      transformResponse: (res) => res || [],
    }),
    getRcoTargetPercentage: builder.query({
      query: ({ fy_id, state }) => ({
        url: `rco-targets`,
        method: 'GET',
        params: { fy_id, state },
      }),
      transformResponse: (res) => res || [],
      onQueryStarted: async (args, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          // You can perform side effects here with the fetched data if needed
        } catch ({error}) {
          showToast({
            title: 'Error fetching RCO Target percentage',
            description: error?.data?.detail || 'An error occurred while fetching RCO Targets.',
            status: 'error',
          })
        }
      }
    }),
    getFormData: builder.query({
      query: ({ entity_id, fy, period }) =>
        `form/data/entity-${entity_id}-fy-${fy}-period-${period}`,
      transformResponse: (res) => res || [],
      providesTags: ['FormData'],
    }),
    uploadFiles: builder.mutation({
      // Expect a FormData instance from caller
      query: (formData) => ({
        url: `form-data/uploads`,
        method: 'POST',
        body: formData,
        // Let the browser set the boundary for multipart content-type
      }),
    }),
    submitFormApi: builder.mutation({
      query: ({ path, payload }) => ({
        url: path,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['FormData', 'FormsMeta'],
    }),
    getComplianceSummary: builder.query({
      query: ({ type, entity_id, fy_id }) => ({
        url: `form/compliance-summary`,
        method: 'GET',
        params: { type, entity_id, fy_id },
      }),
      transformResponse: (res) => res || {},
      onQueryStarted: async (args, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
        } catch ({error}) {
          showToast({
            title: 'Error fetching compliance summary',
            description: error?.data?.detail || 'An error occurred while fetching compliance summary.',
            status: 'error',
          })
        }
      },
    }),
  }),
});

export const {
  useGetSectionsQuery,
  useGetFieldsQuery,
  useGetFinancialYearsQuery,
  useGetPeriodsForFyQuery,
  useGetRcoTargetPercentageQuery,
  useGetFormDataQuery,
  useUploadFilesMutation,
  useSubmitFormApiMutation,
  useGetComplianceSummaryQuery
} = formsApi;

export default formsApi;
