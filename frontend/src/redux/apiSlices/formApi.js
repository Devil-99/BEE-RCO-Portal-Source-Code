import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../baseQuery';
import { showToast } from '../../components/toastService';

export const formApi = createApi({
    reducerPath: "formApi",
    baseQuery,
    tagTypes: ["Form"],
    endpoints: (builder) => ({
        submitForm: builder.mutation({
            query: ({ payload, type }) => {
                const url = type === "DISCOM" ? "/form/discom/submit" : "/form/cpp/submit"
                return {
                    url,
                    method: "POST",
                    body: payload
                }
            },
            invalidatesTags: ["Form"],
            async onQueryStarted(arg, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    showToast({
                        title: "Form Submitted successfully",
                        description: data?.message,
                        status: "success"
                    });
                } catch ({ error }) {
                    showToast({
                        title: error?.data?.detail || "Submission failed",
                        status: "error",
                    });
                }
            }
        }),
        submittedForms: builder.query({
            query: (params) => ({
                url: "form/submitted",
                method: "GET",
                params: params || {},
            }),
            providesTags: ["Form"],
            transformResponse: (response) => {
                if (response && !Array.isArray(response) && response.items !== undefined) {
                    return response;
                }
                return response || [];
            },
        }),
        getSubmissionStageHistory: builder.query({
            query: (submission_id) => ({
                url: `form/submission-history`,
                method: "GET",
                params: { submission_id },
            }),
            transformResponse: (response) => response || [],
        }),
        formAction: builder.mutation({
            query: ({ form_id, action, remarks }) => ({
                url: `/form/action/${form_id}`,
                method: "POST",
                body: { action, remarks },
            }),
            invalidatesTags: ["Form"],
            async onQueryStarted(arg, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    showToast({
                        title: data?.message || "Action performed successfully",
                        status: "success"
                    });
                } catch ({ error }) {
                    showToast({
                        title: error?.data?.detail || "Unable to perform action",
                        status: "error"
                    });
                }
            },
        }),
        formActionByWorkflow: builder.mutation({
            query: ({ form_id, workflow_id }) => ({
                url: `form/update-workflow`,
                method: "PUT",
                body: { form_id, workflow_id },
            }),
            async onQueryStarted(arg, { queryFulfilled, dispatch }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        formApi.endpoints.formAction.initiate({
                            form_id: arg.form_id,
                            action: "accept",
                            remarks: "Accepted by SLR"
                        })
                    )
                } catch (error) {
                    showToast({
                        title: error?.data?.message || "Unable to set workflow",
                        status: "error"
                    });
                }
            },
        }),
        getSelectiveSubmissionDetails: builder.query({
            query: () => `/form/selective-submission-detail`,
            transformResponse: (res) => res || {},
        }),
        getFormUploads: builder.query({
            query: ({entity_id, fy_id, period_id}) => `form/uploads/entity-${entity_id}-fy-${fy_id}-period-${period_id}`,
            transformResponse: (res) => res?.uploads || {},
        })
    })
})

export const {
    useSubmitFormMutation,
    useSubmittedFormsQuery,
    useGetSubmissionStageHistoryQuery,
    useFormActionMutation,
    useFormActionByWorkflowMutation,
    useGetSelectiveSubmissionDetailsQuery,
    useGetFormUploadsQuery
} = formApi