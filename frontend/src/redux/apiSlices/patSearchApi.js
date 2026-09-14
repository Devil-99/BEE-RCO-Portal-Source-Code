import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../baseQuery';
import { setPrefillEntityFormData, setPrefillUserFormData } from '../RegistrationSlice';
import { showToast } from '../../components/toastService';

export const patSearchApi = createApi({
  reducerPath: 'patSearchApi',
  baseQuery,
  endpoints: (builder) => ({
    getPatLists: builder.query({
      query: (sectorType) => ({
        url: 'pat-registration/list',
        params: { sectorType },
        method: 'GET',
      }),
    }),

    searchPatDetails: builder.mutation({
      query: (patNumber) => ({
        url: `search-pat-registration/${patNumber}`,
        method: 'GET',
      }),
      async onQueryStarted(patNumber, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          // ✅ update registration slice
          dispatch(setPrefillEntityFormData({
            organizationName: data.organisation_name,
            address: data.address,
            state: data.state_code,
          }));

          dispatch(setPrefillUserFormData({
            contactName: data.plant_head_name,
            mobile: data.mobile_number,
            designation: 'Plant Head',
            officialEmail: data.plant_head_email,
            secondaryEmail: data.plant_head_recovery_email,
            declaration: false,
          }));

          showToast({
            title: 'PAT details fetched successfully',
            description: 'You can now proceed with the registration',
            status: 'success',
          });
        } catch ({error}) {
          showToast({
            title: 'PAT Registration Number Not Found',
            description: error?.data?.detail || 'Please try again',
            status: 'error',
          });
        }
      },
    }),
  }),
});

export const { useGetPatListsQuery, useSearchPatDetailsMutation } = patSearchApi;
