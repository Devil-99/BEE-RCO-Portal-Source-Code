import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "../../baseQuery";
import { showToast } from "../../../components/toastService";

export const energyManagerApi = createApi({
    reducerPath: "energyManagerApi",
    baseQuery,
    tagTypes: ["EnergyManagers"],
    endpoints: (builder) => ({
        getEnergyManagers: builder.query({
            query: ({ page = 1, page_size = 10, search = "" } = {}) => {
                let url = `admin/energy-managers?page=${page}&page_size=${page_size}`;
                if (search) url += `&search=${encodeURIComponent(search)}`;
                return url;
            },
            providesTags: ["EnergyManagers"],
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                } catch ({ error }) {
                    const detail =
                        error?.data?.detail ||
                        "Unknown error";
                    showToast({
                        title: "Error fetching energy managers",
                        description: detail,
                        status: "error",
                    });
                }
            },
        }),
        createEnergyManager: builder.mutation({
            query: (payload) => ({
                url: "admin/energy-manager",
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["EnergyManagers"],
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    showToast({
                        title: "Energy manager created successfully",
                        description: data?.message || "",
                        status: "success",
                    });
                } catch ({ error }) {
                    showToast({
                        title: "Error creating energy manager",
                        description: error?.data?.detail || "Unknown error",
                        status: "error",
                    });
                }
            },
        }),
        updateEnergyManager: builder.mutation({
            query: ({ registration_number, ...payload }) => ({
                url: `admin/energy-manager/${encodeURIComponent(registration_number)}`,
                method: "PUT",
                body: payload,
            }),
            invalidatesTags: ["EnergyManagers"],
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    showToast({
                        title: "Energy manager updated successfully",
                        description: data?.message || "",
                        status: "success",
                    });
                } catch ({ error }) {
                    showToast({
                        title: "Error updating energy manager",
                        description: error?.data?.detail || "Unknown error",
                        status: "error",
                    });
                }
            },
        }),
    }),
});

export const {
    useGetEnergyManagersQuery,
    useCreateEnergyManagerMutation,
    useUpdateEnergyManagerMutation,
} = energyManagerApi;
