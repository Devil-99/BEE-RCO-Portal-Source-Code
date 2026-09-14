import React, { useEffect, useState } from "react";
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, Flex, FormControl, FormLabel, Input, Select
} from "@chakra-ui/react";
import deloitte_theme from "../../../theme";
import { showToast } from "../../../components/toastService";
import { useAddAuditFirmMutation, useUpdateAuditFirmMutation } from "../../../redux/apiSlices/auditFirmControlApi";
import { useSelector } from "react-redux";

const AddAuditFirmModal = ({ isOpen, onClose, selectedRow, refetch }) => {
    const [formData, setFormData] = useState({
        firm_name: "",
        state_code: "",
        address: "",
        full_name: "",
        valid_from: "",
        valid_to: "",
        source_type: "",
    });

    const { states } = useSelector(state => state.commonState);
    const [addFirm] = useAddAuditFirmMutation();
    const [updateFirm] = useUpdateAuditFirmMutation();

    useEffect(() => {
        if (selectedRow) {
            // Populate form for edit, exclude firm_id
            setFormData({
                firm_name: selectedRow.firm_name || "",
                state_code: selectedRow.state_code || "",
                address: selectedRow.address || "",
                full_name: selectedRow.full_name || "",
                valid_from: selectedRow.valid_from || "",
                valid_to: selectedRow.valid_to || "",
                source_type: selectedRow.source_type || "",
            });
        } else {
            setFormData({
                firm_name: "",
                state_code: "",
                address: "",
                full_name: "",
                valid_from: "",
                valid_to: "",
                source_type: "",
            });
        }
    }, [selectedRow, isOpen]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        const { firm_name, state_code, address, full_name, valid_from, valid_to, ...rest } = formData;

        if (!firm_name || !state_code || !address || !full_name || !valid_from || !valid_to) {
            showToast({ title: "Missing Fields", description: "Please fill in all required fields.", status: "warning" });
            return;
        }

        try {
            if (selectedRow) {
                // Only send URL id, exclude firm_id from body
                await updateFirm({ id: selectedRow.firm_id, firm_name, state_code, address, full_name, valid_from, valid_to, ...rest }).unwrap();
                showToast({ title: "Audit firm updated successfully", status: "success" });
            } else {
                await addFirm(formData).unwrap();
                showToast({ title: "Audit firm added successfully", status: "success" });
            }

            onClose();
            refetch?.();
        } catch (err) {
            console.error("❌ API Error:", err);
            showToast({ title: "Error", description: err?.data?.detail || err.message || "Unknown error", status: "error" });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{selectedRow ? "Edit Audit Firm" : "Add Audit Firm"}</ModalHeader>
                <ModalBody>
                    <Flex direction="column" gap={deloitte_theme.gap}>
                        <FormControl isRequired>
                            <FormLabel>Firm Name</FormLabel>
                            <Input name="firm_name" value={formData.firm_name} onChange={handleChange} disabled={!!selectedRow} />
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>State</FormLabel>
                            <Select name="state_code" value={formData.state_code} onChange={handleChange} placeholder="Select State">
                                {states.map((s) => (
                                    <option key={s.state_code} value={s.state_code}>{s.state_name} ({s.state_code})</option>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl>
                            <FormLabel>Address</FormLabel>
                            <Input name="address" value={formData.address} onChange={handleChange} />
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>User Full Name</FormLabel>
                            <Input name="full_name" value={formData.full_name} onChange={handleChange} />
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Valid From</FormLabel>
                            <Input type="date" name="valid_from" value={formData.valid_from} onChange={handleChange} />
                        </FormControl>
                        <FormControl>
                            <FormLabel>Valid To</FormLabel>
                            <Input type="date" name="valid_to" value={formData.valid_to} onChange={handleChange} />
                        </FormControl>
                        <FormControl>
                            <FormLabel>Source Type</FormLabel>
                            <Input name="source_type" value={formData.source_type} onChange={handleChange} />
                        </FormControl>
                    </Flex>
                </ModalBody>
                <ModalFooter>
                    <Flex>
                        <Button mr={3} onClick={onClose}>Cancel</Button>
                        <Button bg={deloitte_theme.buttonPrimary} onClick={handleSubmit}>
                            {selectedRow ? "Update" : "Add"}
                        </Button>
                    </Flex>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddAuditFirmModal;
