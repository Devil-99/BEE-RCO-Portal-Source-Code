import { useEffect, useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Select,
    Flex,
    FormControl,
    FormLabel,
    Input
} from '@chakra-ui/react';
import deloitte_theme from '../../theme';
import { showToast } from '../../components/toastService';
import { useAddSectorTypeMutation, useEditSectorTypeMutation } from '../../redux/apiSlices/sectorControlApi';

function AddSectorTypeModal({ isOpen, onClose, selectedRow }) {

    const initialState = {
        sector_code: "",
        sector_name: "",
        entity_type: "",
        description: "",
    }

    const [formData, setFormData] = useState(initialState);

    // Prefill form when editing OR reset when fresh
    useEffect(() => {
        if (isOpen) {
            setFormData(selectedRow ? selectedRow : initialState);
        }
    }, [selectedRow, isOpen]);

    const [addSectorType, { isLoading: isAdding }] = useAddSectorTypeMutation();
    const [editSectorType, { isLoading: isEditing }] = useEditSectorTypeMutation();

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const closeAndReset = () => {
        setFormData(initialState);
        onClose();
    };

    const handleSubmit = async () => {

        if (!formData.sector_code || !formData.sector_name || !formData.entity_type) {
            return showToast({
                title: "Missing Required Fields",
                description: "Sector Code, Name, and Entity Type are required.",
                status: "warning",
            });
        }

        try {
            if (selectedRow) {
                await editSectorType(formData).unwrap();
            } else {
                await addSectorType(formData).unwrap();
            }

            closeAndReset();

        } catch (error) {
            console.error(error);
            showToast({
                title: "Error",
                description: error?.data?.detail || "Something went wrong",
                status: "error",
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={closeAndReset} isCentered>
            <ModalOverlay />
            <ModalContent mx="auto">
                <ModalHeader>{selectedRow ? "Edit Sector Type" : "Add Sector Type"}</ModalHeader>

                <ModalBody>
                    <Flex direction="column" gap={deloitte_theme.gap}>
                        <FormControl isRequired>
                            <FormLabel>Sector Code</FormLabel>
                            <Input
                                name="sector_code"
                                value={formData.sector_code}
                                onChange={handleChange}
                                placeholder="e.g. CHE"
                                isDisabled={!!selectedRow}   // prevent editing key
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Sector Name</FormLabel>
                            <Input
                                name="sector_name"
                                value={formData.sector_name}
                                onChange={handleChange}
                                placeholder="e.g. Chemicals"
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Entity Type</FormLabel>
                            <Select
                                name="entity_type"
                                value={formData.entity_type}
                                onChange={handleChange}
                                placeholder="Select type"
                            >
                                <option value="INDUSTRY">INDUSTRY</option>
                                <option value="DISCOM">DISCOM</option>
                                <option value="NOBE">NOBE</option>
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Description</FormLabel>
                            <Input
                                name="description"
                                value={formData.description || ""}
                                onChange={handleChange}
                                placeholder="Optional"
                            />
                        </FormControl>
                    </Flex>
                </ModalBody>

                <ModalFooter>
                    <Flex gap={3}>
                        <Button onClick={closeAndReset}>Cancel</Button>
                        <Button
                            bg={deloitte_theme.buttonPrimary}
                            onClick={handleSubmit}
                            isLoading={isAdding || isEditing}
                        >
                            {selectedRow ? "Update" : "Add"}
                        </Button>
                    </Flex>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default AddSectorTypeModal;
