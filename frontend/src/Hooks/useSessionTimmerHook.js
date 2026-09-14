
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { decrementTime, openModal, endSession } from "../redux/sessionSlice";
import { useLogoutMutation } from "../redux/apiSlices/authApi";

export const useSessionTimer = () => {
  const { timeLeft, isSessionActive, isModalOpen } = useSelector(
    (state) => state.session
  );
  const dispatch = useDispatch();
  const intervalRef = useRef(null);
  const [logout] = useLogoutMutation();

  // ⏳ countdown interval
  useEffect(() => {
    if (!isSessionActive) return;

    intervalRef.current = setInterval(() => {
      dispatch(decrementTime());
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [isSessionActive, dispatch]);


  useEffect(() => {
    if (!isSessionActive) return;

    // ⚠️ Show modal when 2 minutes left
    if (timeLeft <= 120 && timeLeft > 0 && !isModalOpen) {
      dispatch(openModal());
    }

    // 🚪 Auto logout when timer hits 0
    if (timeLeft === 0) {
      logout().unwrap().catch((error) => {
        console.error("Logout failed", error);
      });
    }
  }, [timeLeft, isSessionActive, dispatch, logout, isModalOpen]);

  return { timeLeft, isSessionActive, isModalOpen };
};
