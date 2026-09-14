import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import deloitte_theme from "../../../theme";
import { showToast } from "../../../components/toastService";
import { useUpdateUserDetailsMutation } from "../../../redux/apiSlices/Admin/RbacApi";
import { isValidEmail, isValidMobile } from "../../../utils/validation";

function UpdateUserModal({ isOpen, onClose, selectedUser, refetch }) {
  const [formData, setFormData] = useState({
    user_id: "",
    full_name: "",
    primary_email: "",
    mobile: "",
  });

  useEffect(() => {
    setFormData({
      user_id: selectedUser?.id || "",
      full_name: selectedUser?.full_name || "",
      primary_email: selectedUser?.primary_email || selectedUser?.email || "",
      mobile: selectedUser?.mobile || "",
    });
  }, [selectedUser, isOpen]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserDetailsMutation();

  const handleSubmit = async () => {
    const { user_id, primary_email, mobile } = formData;

    if (!user_id) {
      showToast({ title: "Missing User", description: "No user selected.", status: "warning" });
      return;
    }

    if (!primary_email) {
      showToast({ title: "Missing Email", description: "Primary email is required.", status: "warning" });
      return;
    }

    if (!isValidEmail(primary_email)) return;
    if (mobile && !isValidMobile(mobile)) return;

    const updatedDetails = {
      primary_email,
      mobile: mobile,
    };

    try {
      await updateUser({ user_id, updatedDetails }).unwrap();
      refetch();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const isBusy = isUpdating;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay />
      <ModalContent mx="auto">
        <ModalHeader>Update User Details</ModalHeader>
        <ModalBody>
          <Flex direction="column" gap={deloitte_theme.gap}>
            <FormControl>
              <FormLabel>Full Name</FormLabel>
              <Input name="full_name" value={formData.full_name} isDisabled />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Primary Email</FormLabel>
              <Input name="primary_email" type="email" value={formData.primary_email} onChange={handleChange} />
            </FormControl>

            <FormControl>
              <FormLabel>Mobile</FormLabel>
              <Input name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10-digit mobile" />
            </FormControl>
          </Flex>
        </ModalBody>

        <ModalFooter>
          <Flex>
            <Button mr={3} onClick={onClose} isDisabled={isBusy}>
              Cancel
            </Button>
            <Button bg={deloitte_theme.buttonPrimary} onClick={handleSubmit} isLoading={isBusy}>
              Update
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default UpdateUserModal;
