import { createSlice } from "@reduxjs/toolkit";

const sessionSlice = createSlice({
  name: "session",
  initialState: {
    timeLeft: 0,
    loginTime: null,
    lastActivity: null,
    expiresAt: null,
    isSessionActive: false,
    isModalOpen: false,
  },
  reducers: {
    startSession: (state, action) => {
      const { loginTime, expiryTime } = action.payload;
      state.loginTime = loginTime;
      state.expiresAt = expiryTime;
      state.isSessionActive = true;
      state.timeLeft = Math.max(0, Math.floor((new Date(expiryTime) - new Date(loginTime)) / 1000));
    },
    setSessionMeta: (state, action) => {
      const { lastActivity, expiresAt } = action.payload;
      state.lastActivity = lastActivity;
      state.expiresAt = expiresAt;
      state.timeLeft = Math.max(0, Math.floor((new Date(expiresAt) - new Date(lastActivity)) / 1000));
    },
    decrementTime: (state) => {
      if (state.isSessionActive && state.timeLeft > 0) {
        state.timeLeft -= 1;
      }
    },
    openModal: (state) => {
      state.isModalOpen = true;
    },
    closeModal: (state) => {
      state.isModalOpen = false;
    },
    endSession: (state) => {
      state.isSessionActive = false;
      state.timeLeft = 0;
      state.isModalOpen = false;
    },
  },
});

export const {
  startSession,
  setSessionMeta,
  decrementTime,
  openModal,
  closeModal,
  endSession,
} = sessionSlice.actions;

export default sessionSlice.reducer;
