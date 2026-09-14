import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    entityFormData: {
        state: "",
        entityType: "",
        sectorType: "",
        isPat: "",
        organizationName: "",
        address: "",
        patRegNumber: "",
    },
    userFormData: {
        contactName: "",
        designation: "",
        mobile: "",
        officialEmail: "",
        secondaryEmail: "",
        declaration: false,
    },
};

export const registrationSlice = createSlice({
    name: "registration",
    initialState,
    reducers: {
        updateEntityField: (state, action) => {
            const { name, value } = action.payload;
            state.entityFormData[name] = value;
        },
        updateUserField: (state, action) => {
            const { name, value } = action.payload;
            state.userFormData[name] = value;
        },
        setPrefillEntityFormData: (state, action) => {
            state.entityFormData = { ...state.entityFormData, ...action.payload };
        },
        setPrefillUserFormData: (state, action) => {
            state.userFormData = { ...state.userFormData, ...action.payload };
        },
        clearPrefillData: (state) => {
            state.entityFormData = initialState.entityFormData;
            state.userFormData = initialState.userFormData;
        },
    },
});

export const {
    updateEntityField,
    updateUserField,
    setPrefillEntityFormData,
    setPrefillUserFormData,
    clearPrefillData,
} = registrationSlice.actions;
export default registrationSlice.reducer;