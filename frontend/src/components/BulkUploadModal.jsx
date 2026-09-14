import { useState, useEffect } from "react";
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
    Text,
    Box,
    Spinner,
} from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";
import { FiFileText } from "react-icons/fi";

import deloitte_theme from "../theme";
import { showToast } from "./toastService";

const BulkUploadModal = ({
                             isOpen,
                             onClose,
                             refetch,
                             title,
                             fileLabel,
                             templateUrl,
                             templateName,
                             uploadFile,
                             uploading,
                             fileInputId,
                         }) => {

    const [file, setFile] = useState(null);

    const [preparing, setPreparing] =
        useState(false);

    const [preparingFileName, setPreparingFileName] =
        useState("");

    const [validationErrors, setValidationErrors] =
        useState([]);

    // Download Template

    const downloadTemplate = () => {
        const a = document.createElement("a");

        a.href = templateUrl;
        a.download = templateName;

        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    useEffect(() => {
        if (isOpen) {
            downloadTemplate();
        }
    }, [isOpen]);

    // File Selection

    const handleFileChange = (e) => {

        const selected =
            e.target.files?.[0] || null;

        if (!selected) return;

        const fileName =
            selected.name.toLowerCase();

        if (!fileName.endsWith(".xlsx")) {

            showToast({
                title: "Invalid File Type",
                description:
                    "Please select an .xlsx file.",
                status: "error",
            });

            return;
        }

        setPreparing(true);
        setPreparingFileName(selected.name);
        setValidationErrors([]);

        const reader = new FileReader();

        reader.onload = () => {

            setFile(selected);

            setPreparing(false);

        };

        reader.onerror = () => {

            resetState();

            showToast({
                title: "File Read Error",
                description:
                    "Could not read the selected file.",
                status: "error",
            });

        };

        reader.readAsArrayBuffer(selected);

    };

    // Upload

    const handleSubmit = async () => {

        if (!file) {

            showToast({
                title: "No File Selected",
                description:
                    "Please select an Excel file to upload.",
                status: "warning",
            });

            return;

        }

        const formData = new FormData();

        formData.append(
            "file",
            file
        );

        try {

            await uploadFile(
                formData
            ).unwrap();

            setValidationErrors([]);

            refetch?.();

            handleClose();

        } catch (error) {

            const errors =
                error?.data?.detail?.errors;

            if (
                Array.isArray(errors)
            ) {

                setValidationErrors(
                    errors
                );

            }

        }

    };

    // Reset

    const resetState = () => {

        setFile(null);

        setPreparing(false);

        setPreparingFileName("");

        setValidationErrors([]);

    };

    const handleClose = () => {

        resetState();

        onClose();

    };

    return (

        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            isCentered
            size="lg"
        >
            <ModalOverlay bg="blackAlpha.400" />

            <ModalContent
                borderRadius="xl"
                overflow="hidden"
                bg={deloitte_theme.white}
                border="1px solid"
                borderColor={deloitte_theme.borderColor}
            >
                <ModalHeader>
                    {title}
                </ModalHeader>

                <ModalBody py={6}>
                    <Flex
                        direction="column"
                        gap={5}
                    >

                        <FormControl isRequired>

                            <FormLabel
                                fontWeight="600"
                                fontSize="sm"
                                color={deloitte_theme.textPrimary}
                            >
                                {fileLabel}
                            </FormLabel>

                            <Input
                                id={fileInputId}
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileChange}
                                display="none"
                                disabled={
                                    uploading ||
                                    preparing
                                }
                            />

                            <Box
                                border="1px solid"
                                borderColor={
                                    file && !preparing
                                        ? deloitte_theme.buttonSecondary
                                        : deloitte_theme.borderColor
                                }
                                borderRadius="lg"
                                p={4}
                                bg={
                                    file && !preparing
                                        ? "blue.50"
                                        : deloitte_theme.white
                                }
                                transition="all 0.2s ease"
                                _hover={{
                                    borderColor:
                                        file && !preparing
                                            ? deloitte_theme.buttonHoverSecondary
                                            : deloitte_theme.secondary,
                                    boxShadow: "sm",
                                }}
                            >

                                <Flex
                                    justify="space-between"
                                    align="center"
                                >

                                    <Flex
                                        align="center"
                                        gap={4}
                                    >

                                        <Box
                                            p={3}
                                            borderRadius="md"
                                            bg={
                                                file && !preparing
                                                    ? "blue.100"
                                                    : deloitte_theme.primary
                                            }
                                        >

                                            {preparing ? (

                                                <Spinner
                                                    size="sm"
                                                    color={deloitte_theme.ternary}
                                                />

                                            ) : file ? (

                                                <CheckCircleIcon
                                                    color={
                                                        deloitte_theme.buttonHoverSecondary
                                                    }
                                                    boxSize={5}
                                                />

                                            ) : (

                                                <FiFileText
                                                    size={20}
                                                    color={
                                                        deloitte_theme.ternary
                                                    }
                                                />

                                            )}

                                        </Box>

                                        <Box>

                                            <Text
                                                fontWeight="600"
                                                fontSize="sm"
                                                color={
                                                    deloitte_theme.textPrimary
                                                }
                                            >
                                                {preparing
                                                    ? `Processing ${preparingFileName}...`
                                                    : file
                                                        ? file.name
                                                        : "No file selected"}
                                            </Text>

                                            <Text
                                                fontSize="xs"
                                                color={
                                                    deloitte_theme.textSecondary
                                                }
                                            >
                                                {preparing
                                                    ? "Processing file..."
                                                    : "Supported format: XLSX"}
                                            </Text>

                                        </Box>

                                    </Flex>

                                    <Button
                                        as="label"
                                        htmlFor={fileInputId}
                                        size="sm"
                                        cursor="pointer"
                                        isDisabled={
                                            uploading ||
                                            preparing
                                        }
                                        bg={
                                            file
                                                ? deloitte_theme.buttonSecondary
                                                : deloitte_theme.buttonPrimary
                                        }
                                        color={
                                            deloitte_theme.black
                                        }
                                        _hover={{
                                            bg:
                                                file
                                                    ? deloitte_theme.buttonHoverSecondary
                                                    : deloitte_theme.buttonHoverPrimary,
                                        }}
                                    >
                                        {file
                                            ? "Replace File"
                                            : "Browse File"}
                                    </Button>

                                </Flex>

                            </Box>

                        </FormControl>

                        {validationErrors.length > 0 && (

                            <Box
                                bg="red.50"
                                border="1px solid"
                                borderColor="red.300"
                                borderRadius="md"
                                p={4}
                                maxH="200px"
                                overflowY="auto"
                            >

                                <Text
                                    fontWeight="700"
                                    mb={2}
                                    color="red.700"
                                >
                                    Validation Errors
                                </Text>

                                {validationErrors.map(
                                    (err, index) => (
                                        <Text
                                            key={index}
                                            fontSize="sm"
                                            color="red.600"
                                            mb={1}
                                        >
                                            {err}
                                        </Text>
                                    )
                                )}

                            </Box>

                        )}

                        <Box
                            bg={deloitte_theme.primary}
                            borderLeft="4px solid"
                            borderColor={
                                deloitte_theme.secondary
                            }
                            borderRadius="md"
                            p={4}
                        >

                            <Text
                                fontWeight="700"
                                mb={2}
                                color={
                                    deloitte_theme.ternary
                                }
                            >
                                Notice
                            </Text>

                            <Text
                                fontSize="sm"
                                color={
                                    deloitte_theme.textPrimary
                                }
                                mb={1}
                            >
                                Kindly fill the template excel with new data and upload it.
                            </Text>

                            <Text
                                fontSize="sm"
                                color={
                                    deloitte_theme.textPrimary
                                }
                            >
                                System will not allow any other excel format other than this template.
                            </Text>

                        </Box>

                    </Flex>
                </ModalBody>

                <ModalFooter
                    borderTop="1px solid"
                    borderColor={
                        deloitte_theme.borderColor
                    }
                >

                    <Flex
                        w="100%"
                        justify="flex-end"
                        gap={3}
                    >

                        <Button
                            variant="outline"
                            borderColor={
                                deloitte_theme.borderColor
                            }
                            onClick={handleClose}
                            isDisabled={
                                uploading ||
                                preparing
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            bg={
                                deloitte_theme.buttonPrimary
                            }
                            color={
                                deloitte_theme.black
                            }
                            _hover={{
                                bg:
                                deloitte_theme.buttonHoverPrimary,
                            }}
                            isDisabled={
                                !file ||
                                preparing ||
                                uploading
                            }
                            isLoading={uploading}
                            loadingText="Uploading..."
                            onClick={handleSubmit}
                        >
                            Submit
                        </Button>

                    </Flex>

                </ModalFooter>

            </ModalContent>

        </Modal>

    );

};

export default BulkUploadModal;