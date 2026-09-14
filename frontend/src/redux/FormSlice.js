import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  period_id: null,
  fy_id: null,
  entity_id: null,
  pendingFormStatus: []
};

const formSlice = createSlice({
  name: "formState",
  initialState,
  reducers: {
    setSelectedFormDetails: (state, action) => {
      state.entity_id = action.payload.entity_id;
      state.period_id = action.payload.period_id;
      state.fy_id = action.payload.fy_id;
    },
    resetFormData: () => initialState,
    setSubmittedFormDetails: (state, action) => {
      state.pendingFormStatus = action.payload;
    }
  },
});

export const { setSelectedFormDetails, resetFormData, setSubmittedFormDetails } = formSlice.actions;
export default formSlice.reducer;