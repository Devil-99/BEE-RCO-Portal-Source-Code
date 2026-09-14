import { createSlice } from "@reduxjs/toolkit";

const formSlice = createSlice({
  name: "formState",
  initialState: { formData: {} },
  reducers: {
    updateField: (state, action) => {
      const { acronym, value } = action.payload;
      state.formData[acronym] = value;
    },
    resetForm: (state) => {
      state.formData = {};
    },
  },
});

export const { updateField, resetForm } = formSlice.actions;
export default formSlice.reducer;