// src/store/stateSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { commonApi } from "./apiSlices/commonApi";

const initialState = {
  states: [],
  sectorTypes: [],
  organizationOptions: [],
  financialYears: [],
  submissionPeriods: [],
  roles: [],
  firmsListL: []
};

const stateSlice = createSlice({
  name: "commonState",
  initialState,
  reducers: {
    resetCommonData: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      commonApi.endpoints.getCommonData.matchFulfilled,
      (state, { payload }) => {
        state.states = payload.states;
        state.sectorTypes = payload.sectorTypes;
        state.organizationOptions = payload.organizationOptions;
        state.financialYears = payload.financialYears;
        state.submissionPeriods = payload.submissionPeriods;
        state.firmsListL = payload.firmsListL;
      }
    );
  },
});

export const { resetCommonData } = stateSlice.actions;
export default stateSlice.reducer;
