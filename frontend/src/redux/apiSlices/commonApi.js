// src/store/commonApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../baseQuery';
import { showToast } from '../../components/toastService';

export const commonApi = createApi({
  reducerPath: 'commonApi',
  baseQuery,
  tagTypes: ['Common'],
  endpoints: (builder) => ({
    getCommonData: builder.query({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          // Parallel requests
          const [stateRes, sectorRes, orgRes, financialYearRes, submissionPeriodRes] = await Promise.all([
            fetchWithBQ("get-states"),
            fetchWithBQ("get-sector_types"),
            fetchWithBQ("get-organization_options"),
            fetchWithBQ("get-financial-years"),
            fetchWithBQ("get-submission-periods")
          ]);

          const errors = [];

          if (stateRes.error) errors.push("States");
          if (sectorRes.error) errors.push("Sector Types");
          if (orgRes.error) errors.push("Organization Options");
          if (financialYearRes.error) errors.push("Financial Years");
          if (submissionPeriodRes.error) errors.push("Submission Periods");

          if (errors.length) {
            showToast({
              title: "Some data could not be loaded. Please refresh again",
              description: `Missed Data:- ${errors.join(", ")}`,
              status: "error",
            });
          }

          return {
            data: {
              states: stateRes.data,
              sectorTypes: sectorRes.data,
              organizationOptions: orgRes.data,
              financialYears: financialYearRes.data,
              submissionPeriods: submissionPeriodRes.data
            },
          };
        } catch (err) {
          showToast({
            title: "Failed to fetch common data",
            description: err.message,
            status: "error",
          });
          return { error: { status: 500, data: err.message } };
        }
      },
      providesTags: ['Common'],
    }),
  }),
});

export const { useGetCommonDataQuery } = commonApi;
