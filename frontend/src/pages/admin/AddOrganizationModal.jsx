// src/components/modals/AddOrganizationModal.js
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
import {
    useAddOrganizationMutation,
    useEditOrganizationMutation,
} from "../../redux/apiSlices/organizationControlApi";
import { showToast } from "../../components/toastService";

const AddOrganizationModal = ({ isOpen, onClose, selectedRow }) => {
    const [formData, setFormData] = useState({
        id: "",
        entity_type: "",
        state_code: "",
        organization_name: "",
        sector_type: "",
        organization_code: "",
        address: "",
    });
    console.log("selectedRow in AddOrganizationModal:", selectedRow);
    // Get common data from Redux slice
    const { states, sectorTypes } = useSelector((state) => state.commonState);

    // Prefill form when editing
    useEffect(() => {
        if (isOpen) {
            setFormData({
                id: selectedRow?.id || "",
                entity_type: selectedRow?.entity_type || "",
                state_code: selectedRow?.state_code || "",
                organization_name: selectedRow?.organization_name || "",
                sector_type: selectedRow?.sector_type || "",
                organization_code: selectedRow?.organization_code || "",
                address: selectedRow?.address || "",
            });
        }
    }, [selectedRow, isOpen]);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const [addOrganization, { isLoading: isAdding }] = useAddOrganizationMutation();
    const [editOrganization, { isLoading: isEditing }] = useEditOrganizationMutation();

    const handleSubmit = async () => {
        const { entity_type, state_code, organization_name, sector_type, organization_code, address } = formData;

        if (!entity_type || !state_code || !organization_name || !sector_type || !organization_code ) {
            showToast({
                title: "Validation Error",
                description: "Please fill in all required fields.",
                status: "error",
            });
            return;
        }

        try {
            if (selectedRow) {
                console.log(formData);
                await editOrganization(formData).unwrap();
            } else {
                await addOrganization(formData).unwrap();
            }
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    // Show spinner if common data is not loaded yet
    if (!states.length || !sectorTypes.length) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
                <ModalOverlay />
                <ModalContent mx="auto">
                    <ModalHeader>{selectedRow ? "Edit Organization" : "Add Organization"}</ModalHeader>
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
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
            <ModalOverlay />
            <ModalContent mx="auto">
                <ModalHeader>{selectedRow ? "Edit Organization" : "Add Organization"}</ModalHeader>
                <ModalBody>
                    <Flex direction="column" gap={deloitte_theme.gap}>
                        {/* Entity Type */}
                        <FormControl isRequired>
                            <FormLabel>Entity Type</FormLabel>
                            <Select
                                name="entity_type"
                                value={formData.entity_type}
                                onChange={handleChange}
                                placeholder="Select Type"
                            >
                                <option value="DISCOM">Utility</option>
                                <option value="INDUSTRY">Other Obligated Entities</option>
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
                                {states.map((state) => (
                                    <option key={state.state_code} value={state.state_code}>
                                        {state.state_code} - {state.state_name}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Organization Name */}
                        <FormControl isRequired>
                            <FormLabel>Organization Name</FormLabel>
                            <Input name="organization_name" value={formData.organization_name} onChange={handleChange} />
                        </FormControl>

                        {/* Sector Type */}
                        <FormControl isRequired>
                            <FormLabel>Sector Type</FormLabel>
                            <Select
                                name="sector_type"
                                value={formData.sector_type}
                                onChange={handleChange}
                                placeholder="Select Sector Type"
                                isDisabled={!formData.entity_type}
                            >
                                {sectorTypes
                                    .filter((s) => s.entity_type === formData.entity_type)
                                    .map((s) => (
                                        <option key={s.sector_code} value={s.sector_code}>
                                            {s.sector_name}
                                        </option>
                                    ))}
                            </Select>
                        </FormControl>

                        {/* Organization Code */}
                        <FormControl isRequired>
                            <FormLabel>Organization Code</FormLabel>
                            <Input name="organization_code" value={formData.organization_code} onChange={handleChange} />
                        </FormControl>

                        {/* Address */}
                        <FormControl>
                            <FormLabel>Address</FormLabel>
                            <Input name="address" value={formData.address} onChange={handleChange} />
                        </FormControl>
                    </Flex>
                </ModalBody>

                <ModalFooter>
                    <Flex>
                        <Button mr={3} onClick={onClose} isDisabled={isAdding || isEditing}>
                            Cancel
                        </Button>
                        <Button
                            bg={deloitte_theme.buttonPrimary}
                            onClick={handleSubmit}
                            isLoading={isAdding || isEditing}
                        >
                            {selectedRow ? "Edit" : "Add"}
                        </Button>
                    </Flex>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddOrganizationModal;
