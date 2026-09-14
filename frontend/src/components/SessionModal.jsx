import React from "react";
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from "react-redux";
import ConfirmModal from "./ConfirmModal";
import {
  closeModal,
  endSession,
} from "../redux/sessionSlice";
import { useResumeSessionMutation } from "../redux/apiSlices/sessionApi";
import { useLogoutMutation } from "../redux/apiSlices/authApi";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text
} from '@chakra-ui/react';

const SessionModal = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isModalOpen, isSessionActive, timeLeft } = useSelector(
    (state) => state.session
  );

  const [resumeSession, { isLoading: isResuming }] = useResumeSessionMutation();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleContinue = async () => {
    try {
      await resumeSession().unwrap();
    } catch (err) {
      console.error("Resume session failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      dispatch(closeModal());
      navigate("/");
      logout().unwrap();
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ConfirmModal
      isOpen={isModalOpen}
      onClose={handleLogout}
      onConfirm={handleContinue}
      title="Session Expiring Soon"
      message={`Your session will expire in ${Math.floor(
        timeLeft / 60
      )}m ${timeLeft % 60}s. Do you want to continue?`}
      confirmText="Continue"
      cancelText="Logout"
      confirmColor="green"
      cancelColor="red"
      isLoading={isResuming || isLoggingOut}
    />
  );
};

export default SessionModal;