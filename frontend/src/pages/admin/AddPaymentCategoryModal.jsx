import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
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
    Checkbox,
} from "@chakra-ui/react";
import deloitte_theme from "../../theme";
import { showToast } from "../../components/toastService";
import {
    useCreatePaymentCategoryMutation,
    useUpdatePaymentCategoryMutation,
} from "../../redux/apiSlices/paymentCategoryApi";

const initialState = {
    category_code: "",
    title: "",
    fy_id: "",
    sector_type: "",
    entity_type: "",
    amount: "",
    is_default: false,
    is_active: true,
};

function AddPaymentCategoryModal({ isOpen, onClose, selectedRow }) {
    const { financialYears } = useSelector((state) => state.commonState);
    const { sectorTypes } = useSelector((state) => state.commonState);

    const [formData, setFormData] = useState(initialState);

    useEffect(() => {
        if (isOpen) {
            setFormData(
                selectedRow
                    ? {
                        category_code: selectedRow.category_code || "",
                        title: selectedRow.title || "",
                        fy_id: selectedRow.fy_id || "",
                        sector_type: selectedRow.sector_type || "",
                        entity_type: selectedRow.entity_type || "",
                        amount: selectedRow.amount ?? "",
                        is_default: selectedRow.is_default || false,
                        is_active: selectedRow.is_active ?? true,
                    }
                    : initialState
            );
        }
    }, [selectedRow, isOpen]);

    const [createPaymentCategory, { isLoading: isCreating }] = useCreatePaymentCategoryMutation();
    const [updatePaymentCategory, { isLoading: isUpdating }] = useUpdatePaymentCategoryMutation();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const closeAndReset = () => {
        setFormData(initialState);
        onClose();
    };

    const handleSubmit = async () => {
        if (!formData.category_code) {
            return showToast({
                title: "Missing Required Fields",
                description: "Category Code is required.",
                status: "warning",
            });
        }

        if (!formData.title.trim()) {
            return showToast({
                title: "Missing Required Fields",
                description: "Title is required.",
                status: "warning",
            });
        }

        if (!formData.fy_id) {
            return showToast({
                title: "Missing Required Fields",
                description: "Financial Year is required.",
                status: "warning",
            });
        }

        const amount = Number(formData.amount);
        if (!formData.amount || isNaN(amount) || amount <= 0) {
            return showToast({
                title: "Invalid Amount",
                description: "Amount must be greater than 0.",
                status: "warning",
            });
        }

        const payload = {
            title: formData.title.trim(),
            fy_id: Number(formData.fy_id),
            sector_type: formData.sector_type || null,
            entity_type: formData.entity_type || null,
            amount,
            is_default: !!formData.is_default,
        };

        try {
            if (selectedRow) {
                await updatePaymentCategory({ id: selectedRow.id, ...payload, is_active: !!formData.is_active }).unwrap();
                showToast({
                    title: "Payment category updated successfully",
                    status: "success",
                });
            } else {
                await createPaymentCategory({ category_code: formData.category_code, ...payload }).unwrap();
                showToast({
                    title: "Payment category created successfully",
                    status: "success",
                });
            }

            closeAndReset();
        } catch (error) {
            console.error("Error saving payment category:", error);
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
                <ModalHeader>
                    {selectedRow ? "Edit Payment Category" : "Add Payment Category"}
                </ModalHeader>

                <ModalBody>
                    <Flex direction="column" gap={deloitte_theme.gap}>
                        <FormControl isRequired>
                            <FormLabel>Category Code</FormLabel>
                            <Select
                                name="category_code"
                                value={formData.category_code}
                                onChange={handleChange}
                                placeholder="Select category code"
                                isDisabled={!!selectedRow}
                            >
                                <option value="REGISTRATION">REGISTRATION</option>
                                <option value="BUYOUT">BUYOUT</option>
                            </Select>
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Title</FormLabel>
                            <Input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Registration Fee"
                                maxLength={100}
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Financial Year</FormLabel>
                            <Select
                                name="fy_id"
                                value={formData.fy_id}
                                onChange={handleChange}
                                placeholder="Select financial year"
                            >
                                {financialYears?.map((fy) => (
                                    <option key={fy.id} value={fy.id}>
                                        {fy.fy_code}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Sector Type</FormLabel>
                            <Select
                                name="sector_type"
                                value={formData.sector_type}
                                onChange={handleChange}
                                placeholder="Optional"
                            >
                                {sectorTypes?.map((sector) => (
                                    <option key={sector.sector_code} value={sector.sector_code}>
                                        {sector.sector_name}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Entity Type</FormLabel>
                            <Select
                                name="entity_type"
                                value={formData.entity_type}
                                onChange={handleChange}
                                placeholder="Optional"
                            >
                                <option value="INDUSTRY">INDUSTRY</option>
                                <option value="DISCOM">DISCOM</option>
                                <option value="NOBE">NOBE</option>
                                <option value="FIRM">FIRM</option>
                            </Select>
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Amount (₹)</FormLabel>
                            <Input
                                name="amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="e.g. 5000"
                            />
                        </FormControl>

                        <Checkbox
                            name="is_default"
                            isChecked={formData.is_default}
                            onChange={handleChange}
                        >
                            Default Category
                        </Checkbox>

                        {selectedRow && (
                            <Checkbox
                                name="is_active"
                                isChecked={formData.is_active}
                                onChange={handleChange}
                            >
                                Active
                            </Checkbox>
                        )}
                    </Flex>
                </ModalBody>

                <ModalFooter>
                    <Flex gap={3}>
                        <Button onClick={closeAndReset}>Cancel</Button>
                        <Button
                            bg={deloitte_theme.buttonPrimary}
                            onClick={handleSubmit}
                            isLoading={isCreating || isUpdating}
                        >
                            {selectedRow ? "Update" : "Add"}
                        </Button>
                    </Flex>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default AddPaymentCategoryModal;
