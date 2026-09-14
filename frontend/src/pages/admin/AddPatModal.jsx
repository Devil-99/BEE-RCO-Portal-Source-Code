// src/components/AddPatModal.js
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
    Select,
    Spinner,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import deloitte_theme from "../../theme";
import { useAddPatNumberMutation, useUpdatePatNumberMutation } from "../../redux/apiSlices/patControlApi";
import { showToast } from "../../components/toastService";

const AddPatModal = ({ isOpen, onClose, selectedRow }) => {
    const [formData, setFormData] = useState({
        registration_number: "",
        organisation_name: "",
        address: "",
        sector_code: "",
        plant_head_name: "",
        mobile_number: "",
        plant_head_email: "",
        plant_head_recovery_email: "",
        telephone_number: "",
        state_code: "",
        entity_type: "INDUSTRY", // default entity type
    });

    // Get common data from Redux slice
    const { states: stateOptions, sectorTypes: sectorOptions } = useSelector((state) => state.commonState);

    const [addPat, { isLoading: isAdding }] = useAddPatNumberMutation();
    const [updatePat, { isLoading: isUpdating }] = useUpdatePatNumberMutation();

    const isSaving = isAdding || isUpdating;

    // Prefill form when editing
    useEffect(() => {
        if (isOpen) {
            setFormData({
                registration_number: selectedRow?.registration_number || "",
                organisation_name: selectedRow?.organisation_name || "",
                address: selectedRow?.address || "",
                sector_code: selectedRow?.sector_code || "",
                plant_head_name: selectedRow?.plant_head_name || "",
                mobile_number: selectedRow?.mobile_number || "",
                plant_head_email: selectedRow?.plant_head_email || "",
                plant_head_recovery_email: selectedRow?.plant_head_recovery_email || "",
                telephone_number: selectedRow?.telephone_number || "",
                state_code: selectedRow?.state_code || "",
                entity_type: selectedRow?.entity_type || "INDUSTRY",
            });
        }
    }, [selectedRow, isOpen]);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        const requiredFields = [
            "registration_number",
            "organisation_name",
            "address",
            "sector_code",
            "plant_head_name",
            "mobile_number",
            "plant_head_email",
            "state_code",
        ];

        for (const field of requiredFields) {
            if (!formData[field]) {
                return showToast({
                    title: "Error",
                    description: `Please fill ${field.replace("_", " ")}`,
                    status: "error",
                });
            }
        }

        try {
            if (selectedRow) {
                await updatePat({ registration_number: selectedRow.registration_number, ...formData }).unwrap();
                showToast({ title: "Success", description: "PAT updated successfully", status: "success" });
            } else {
                await addPat(formData).unwrap();
                showToast({ title: "Success", description: "PAT added successfully", status: "success" });
            }
            onClose();
        } catch (error) {
            showToast({
                title: "Error",
                description: error?.data?.detail || "Failed to save PAT",
                status: "error",
            });
        }
    };

    // Show spinner if common data not loaded
    if (!stateOptions.length || !sectorOptions.length) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
                <ModalOverlay />
                <ModalContent mx="auto">
                    <ModalHeader>{selectedRow ? "Edit PAT Registration" : "Add PAT Registration"}</ModalHeader>
                    <ModalBody>
                        <Flex justify="center" align="center" minH="100px">
                            <Spinner />
                        </Flex>
                    </ModalBody>
                </ModalContent>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
            <ModalOverlay />
            <ModalContent mx="auto">
                <ModalHeader>{selectedRow ? "Edit PAT Registration" : "Add PAT Registration"}</ModalHeader>

                <ModalBody>
                    <Flex direction="column" gap={deloitte_theme.gap}>
                        {/* Entity Type */}
                        <FormControl isRequired>
                            <FormLabel>Entity Type</FormLabel>
                            <Select
                                name="entity_type"
                                value={formData.entity_type}
                                onChange={handleChange}
                                placeholder="Select Entity Type"
                            >
                                <option value="INDUSTRY">Other Obligated Entities</option>
                                <option value="DISCOM">Utility</option>
                                <option value="NOBE">Non Obligated</option>
                            </Select>
                        </FormControl>

                        {/* State */}
                        <FormControl isRequired>
                            <FormLabel>State</FormLabel>
                            <Select
                                name="state_code"
                                value={formData.state_code}
                                onChange={handleChange}
                                placeholder="Select State"
                            >
                                {stateOptions.map((s) => (
                                    <option key={s.state_code} value={s.state_code}>
                                        {s.state_name} ({s.state_code})
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Sector Type */}
                        <FormControl isRequired>
                            <FormLabel>Sector Type</FormLabel>
                            <Select
                                name="sector_code"
                                value={formData.sector_code}
                                onChange={handleChange}
                                placeholder="Select Sector"
                                isDisabled={!formData.entity_type}
                            >
                                {sectorOptions
                                    .filter((s) => s.entity_type === formData.entity_type)
                                    .map((s) => (
                                        <option key={s.sector_code} value={s.sector_code}>
                                            {s.sector_name} ({s.sector_code})
                                        </option>
                                    ))}
                            </Select>
                        </FormControl>

                        {/* Other Fields */}
                        <FormControl isRequired>
                            <FormLabel>Registration Number</FormLabel>
                            <Input name="registration_number" value={formData.registration_number} onChange={handleChange} />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Organization Name</FormLabel>
                            <Input name="organisation_name" value={formData.organisation_name} onChange={handleChange} />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Address</FormLabel>
                            <Input name="address" value={formData.address} onChange={handleChange} />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Plant Head Name</FormLabel>
                            <Input name="plant_head_name" value={formData.plant_head_name} onChange={handleChange} />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Mobile Number</FormLabel>
                            <Input name="mobile_number" value={formData.mobile_number} onChange={handleChange} />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Plant Head Email</FormLabel>
                            <Input name="plant_head_email" value={formData.plant_head_email} onChange={handleChange} />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Plant Head Recovery Email</FormLabel>
                            <Input name="plant_head_recovery_email" value={formData.plant_head_recovery_email} onChange={handleChange} />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Telephone Number</FormLabel>
                            <Input name="telephone_number" value={formData.telephone_number} onChange={handleChange} />
                        </FormControl>
                    </Flex>
                </ModalBody>

                <ModalFooter>
                    <Flex gap={3}>
                        <Button onClick={onClose}>Cancel</Button>
                        <Button bg={deloitte_theme.buttonPrimary} onClick={handleSubmit} isLoading={isSaving}>
                            {selectedRow ? "Update" : "Add"}
                        </Button>
                    </Flex>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddPatModal;
