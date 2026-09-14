import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../baseQuery";
import { showToast } from "../../components/toastService";

export const adminControlApi = createApi({
    reducerPath: "adminControlApi",
    baseQuery,
    tagTypes: ['entities'],
    endpoints: (builder) => ({
        getEntitiesList: builder.query({
            query: ({ page = 1, pageSize = 5, entity_type, document_flag, payment_flag, org_name, username, pat_reg_number, entity_reg_no }) => {
                const params = new URLSearchParams({
                    page: String(page),
                    page_size: String(pageSize),
                });

                if (entity_type) params.set("entity_type", entity_type);
                if (document_flag !== undefined && document_flag !== null) params.set("document_flag", String(document_flag));
                if (payment_flag !== undefined && payment_flag !== null) params.set("payment_flag", String(payment_flag));
                if (org_name) params.set("org_name", org_name);
                if (username) params.set("username", username);
                if (pat_reg_number) params.set("pat_reg_number", pat_reg_number);
                if (entity_reg_no) params.set("entity_reg_no", entity_reg_no);

                return `entities?${params.toString()}`;
            },
            serializeQueryArgs: ({ endpointName, queryArgs }) => {
                const { entity_type, document_flag, payment_flag, org_name, username, pat_reg_number, entity_reg_no } = queryArgs || {};
                return [endpointName, entity_type || "", document_flag ?? "", payment_flag ?? "", org_name || "", username || "", pat_reg_number || "", entity_reg_no || ""].join("|");
            },
            merge: (currentCache, newResponse) => {
                if (newResponse.page === 1) {
                    currentCache.data = newResponse.data;
                } else {
                    currentCache.data = [...(currentCache.data || []), ...newResponse.data];
                }
                currentCache.page = newResponse.page;
                currentCache.total_pages = newResponse.total_pages;
                currentCache.total = newResponse.total;
            },
            forceRefetch({ currentArg, previousArg }) {
                return JSON.stringify(currentArg) !== JSON.stringify(previousArg);
            },
            providesTags: ['entities'],
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error) {
                    showToast({
                        title: "Error fetching entities list",
                        status: "error",
                    });
                }
            },
        }),

        getAllEntities: builder.query({
            query: () => `entities/all`,
            providesTags: ['entities'],
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                } catch (error) {
                    showToast({
                        title: "Error fetching all entities",
                        status: "error",
                    });
                }
            },
        }),
        // entities tabs in the user page 
        getAllRegisteredEntityUsers: builder.query({
            query: () => `get-registered-entity-users`,
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                }
                catch (error) {
                    showToast({
                        title: "Error fetching registered entity users",
                        status: "error",
                    });
                }
            },
        }),
        // non-obligated (NOBE) users tab in the user page
        getAllRegisteredNobeUsers: builder.query({
            query: () => `get-registered-nobe-users`,
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    await queryFulfilled;
                }
                catch (error) {
                    showToast({
                        title: "Error fetching registered NOBE users",
                        status: "error",
                    });
                }
            },
        }),
        documentApprove: builder.mutation({
            query: ({ id, document_flag, remarks }) => ({
                url: `entity/document-status/${id}`,
                method: 'POST',
                body: { document_flag, remarks },
            }),
            invalidatesTags: ['entities'],
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    showToast({
                        title: 'Document status updated.',
                        description: data.message || "",
                        status: 'success',
                    });
                } catch ({ error }) {
                    showToast({
                        title: 'Error updating document status',
                        description: error?.data?.detail || 'Unknown error',
                        status: 'error',
                    });
                }
            },
        }),
        openFile: builder.mutation({
            query: (filepath) => ({
                url: `uploads/${filepath}`,
                method: 'GET',
                responseHandler: async (response) => {
                    if (!response.ok) {
                        const contentType = response.headers.get("content-type") || "";
                        if (contentType.includes("application/json")) {
                            return await response.json();
                        }
                        return await response.text();
                    }
                    return await response.blob();
                },
            }),
            async onQueryStarted(filepath, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;

                    if (data instanceof Blob) {
                        const blobUrl = window.URL.createObjectURL(data);
                        window.open(blobUrl, "_blank");
                    } else {
                        showToast({
                            title: 'Error opening file',
                            description: typeof data === 'string' ? data : data?.detail || 'Unknown error',
                            status: 'error',
                        });
                    }
                } catch ({ error }) {
                    showToast({
                        title: 'Error opening file',
                        description: error?.data?.detail || error?.error || 'Unknown error',
                        status: 'error',
                    });
                }
            },
        }),

        updateEntity: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `entity/update/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: ["entities"],
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    showToast({
                        title: 'Entity Details Updated Successfully',
                        description: data.message || "",
                        status: 'success',
                    });
                } catch ({ error }) {
                    showToast({
                        title: 'Error updating Entity details',
                        description: error?.data?.detail || 'Unknown error',
                        status: 'error',
                    });
                }
            },
        }),

        //add more endpoints as needed

    })
})

export const {
    useGetEntitiesListQuery,
    useGetAllEntitiesQuery,
    useGetAllRegisteredEntityUsersQuery,
    useGetAllRegisteredNobeUsersQuery,
    useDocumentApproveMutation,
    useOpenFileMutation,
    useUpdateEntityMutation
} = adminControlApi

