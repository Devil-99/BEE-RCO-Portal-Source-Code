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
import deloitte_theme from "../../theme";
import { showToast } from "../../components/toastService";
import { useAddAEAMutation, useEditAEAMutation } from "../../redux/apiSlices/AEAControlApi";
import { isValidEmail, isValidMobile } from "../../utils/validation";

function AddEnergyAuditorModal({ isOpen, onClose, selectedRow }) {
  const [formData, setFormData] = useState({
    aea_id: "",
    full_name: "",
    email: "",
    mobile: "",
    valid_from: "",
    valid_to: "",
    source_type: "",
  });

  useEffect(() => {
    setFormData({
      aea_id: selectedRow?.aea_id || "",
      full_name: selectedRow?.full_name || "",
      email: selectedRow?.email || "",
      mobile: selectedRow?.mobile || "",
      valid_from: selectedRow?.valid_from || "",
      valid_to: selectedRow?.valid_to || "",
      source_type: selectedRow?.source_type || "",
    });
  }, [selectedRow, isOpen]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const [addAea, { isLoading: isAdding }] = useAddAEAMutation();
  const [updateAea, { isLoading: isUpdating }] = useEditAEAMutation();

  const handleSubmit = async () => {
    const { aea_id, full_name, email, mobile, valid_from, valid_to, source_type } = formData;

    // Required fields
    if (!full_name || !email || !valid_from || (!selectedRow && !aea_id)) {
      showToast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        status: "warning",
      });
      return;
    }

    if (!isValidMobile(userFormData.mobile)) return;

    if (!isValidEmail(officialEmail)) return;

    // Date validation
    if (valid_to && valid_from > valid_to) {
      showToast({
        title: "Invalid Dates",
        description: "'Valid To' must be after 'Valid From'",
        status: "warning",
      });
      return;
    }

    // Prepare payload exactly as backend expects
    const payload = {
      full_name,
      email,
      mobile: mobile || null,
      valid_from,
      valid_to: valid_to || null,
      source_type: source_type || null,
    };

    try {
      if (selectedRow) {
        // **EDIT / PUT**
        await updateAea({ aea_id: selectedRow.aea_id, ...payload }).unwrap();
      } else {
        // ADD / POST
        await addAea({ aea_id, ...payload }).unwrap();
      }
      onClose();
    } catch (err) {
      console.error(err);

      // Decode backend errors for toast
      let description = "Unknown error";
      if (err?.data?.detail && Array.isArray(err.data.detail)) {
        description = err.data.detail.map(d => `${d.loc.slice(1).join(".")}: ${d.msg}`).join(", ");
      } else if (err?.data?.detail) {
        description = err.data.detail;
      } else if (err?.message) {
        description = err.message;
      }

      showToast({ title: "Error", description, status: "error" });
    }
  };


  const isBusy = isAdding || isUpdating;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay />
      <ModalContent mx="auto">
        <ModalHeader>{selectedRow ? "Edit AEA" : "Add AEA"}</ModalHeader>
        <ModalBody>
          <Flex direction="column" gap={deloitte_theme.gap}>
            <FormControl isRequired={!selectedRow}>
              <FormLabel>AEA ID</FormLabel>
              <Input
                name="aea_id"
                value={formData.aea_id}
                onChange={handleChange}
                placeholder="e.g. AEA001"
                isDisabled={!!selectedRow}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Full Name</FormLabel>
              <Input name="full_name" value={formData.full_name} onChange={handleChange} />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input name="email" type="email" value={formData.email} onChange={handleChange} />
            </FormControl>

            <FormControl>
              <FormLabel>Mobile</FormLabel>
              <Input name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10-digit mobile" />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Valid From</FormLabel>
              <Input name="valid_from" type="date" value={formData.valid_from} onChange={handleChange} />
            </FormControl>

            <FormControl>
              <FormLabel>Valid To</FormLabel>
              <Input name="valid_to" type="date" value={formData.valid_to} onChange={handleChange} />
            </FormControl>

            <FormControl>
              <FormLabel>Source Type</FormLabel>
              <Input name="source_type" value={formData.source_type} onChange={handleChange} placeholder="Optional" />
            </FormControl>
          </Flex>
        </ModalBody>

        <ModalFooter>
          <Flex>
            <Button mr={3} onClick={onClose} isDisabled={isBusy}>
              Cancel
            </Button>
            <Button bg={deloitte_theme.buttonPrimary} onClick={handleSubmit} isLoading={isBusy}>
              {selectedRow ? "Update" : "Add"}
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default AddEnergyAuditorModal