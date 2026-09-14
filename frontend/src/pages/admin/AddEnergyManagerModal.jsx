import { useEffect, useState } from "react";
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
import { useCreateEnergyManagerMutation, useUpdateEnergyManagerMutation } from "../../redux/apiSlices/Admin/EnergyManagerApi";
import { showToast } from "../../components/toastService";

const AddEnergyManagerModal = ({ isOpen, onClose, selectedRow }) => {
    const [formData, setFormData] = useState({ registration_number: "", name: "" });

    const [createEM, { isLoading: isCreating }] = useCreateEnergyManagerMutation();
    const [updateEM, { isLoading: isUpdating }] = useUpdateEnergyManagerMutation();

    const isSaving = isCreating || isUpdating;
    const isEdit = !!selectedRow;

    useEffect(() => {
        if (isOpen) {
            setFormData({
                registration_number: selectedRow?.registration_number || "",
                name: selectedRow?.name || "",
            });
        }
    }, [selectedRow, isOpen]);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        if (!formData.registration_number.trim()) {
            return showToast({ title: "Error", description: "Registration number is required", status: "error" });
        }
        if (!formData.name.trim()) {
            return showToast({ title: "Error", description: "Name is required", status: "error" });
        }

        try {
            if (isEdit) {
                await updateEM({ registration_number: selectedRow.registration_number, name: formData.name }).unwrap();
                showToast({ title: "Success", description: "Energy Manager updated successfully", status: "success" });
            } else {
                await createEM(formData).unwrap();
                showToast({ title: "Success", description: "Energy Manager added successfully", status: "success" });
            }
            onClose();
        } catch (error) {
            showToast({
                title: "Error",
                description: error?.data?.detail || "Failed to save Energy Manager",
                status: "error",
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
            <ModalOverlay />
            <ModalContent mx="auto">
                <ModalHeader>{isEdit ? "Edit Energy Manager" : "Add Energy Manager"}</ModalHeader>

                <ModalBody>
                    <Flex direction="column" gap={deloitte_theme.gap}>
                        <FormControl isRequired>
                            <FormLabel>Registration Number</FormLabel>
                            <Input
                                name="registration_number"
                                value={formData.registration_number}
                                onChange={handleChange}
                                isReadOnly={isEdit}
                                bg={isEdit ? "gray.50" : "white"}
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Name</FormLabel>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter energy manager name"
                            />
                        </FormControl>
                    </Flex>
                </ModalBody>

                <ModalFooter>
                    <Flex gap={3}>
                        <Button onClick={onClose}>Cancel</Button>
                        <Button bg={deloitte_theme.buttonPrimary} onClick={handleSubmit} isLoading={isSaving}>
                            {isEdit ? "Update" : "Add"}
                        </Button>
                    </Flex>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddEnergyManagerModal;
