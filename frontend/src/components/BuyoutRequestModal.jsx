import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Divider,
    Flex,
    FormControl,
    FormLabel,
    Input,
    InputGroup,
    InputRightElement,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Radio,
    RadioGroup,
    Stack,
    Text,
} from '@chakra-ui/react';
import deloitte_theme from '../theme';
import { useBuyoutRequestMutation } from '../redux/apiSlices/buyoutApi';
import { showToast } from "./toastService";

function BuyoutRequestModal({ isOpen, onClose, shortfallAmount, calculatedAmount, selectedFY }) {
    const [buyoutDetails, setBuyoutDetails] = useState({
        shortfall_amount: shortfallAmount,
        payable_amount: calculatedAmount,
        utr_number: "",
        payment_date: new Date(),
        fy_id: selectedFY,
        payment_proof: null,
    });

    const [buyoutRequest, { isLoading }] = useBuyoutRequestMutation();

    const handleSubmitBuyoutRequest = async () => {
        const mandatoryFields = ["utr_number", "payment_date", "payment_proof"];
        for (const field of mandatoryFields) {
            if (!buyoutDetails[field]) {
                showToast({
                    title: "Validation Error",
                    description: `Please fill in the ${field.replace("_", " ")} field.`,
                    status: "warning",
                });
                return;
            }
        }

        try {
            await buyoutRequest(buyoutDetails).unwrap();
            setBuyoutDetails(prev => ({
                ...prev,
                utr_number: "",
                payment_date: new Date(),
                payment_proof: null,
            }));
            onClose();
        } catch (error) {
            console.error("Error submitting buyout request:", error);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Save Payment Details</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <FormControl mb={4} isRequired>
                        <FormLabel fontSize="sm">Shortfall Amount</FormLabel>
                        <InputGroup>
                            <Input
                                value={buyoutDetails.shortfall_amount}
                                isReadOnly
                                size="md"
                            />
                            <InputRightElement pr={3}>
                                <Text color="gray.500">MWh</Text>
                            </InputRightElement>
                        </InputGroup>
                    </FormControl>

                    <FormControl mb={4} isRequired>
                        <FormLabel fontSize="sm">Payment Amount</FormLabel>
                        <InputGroup>
                            <Input
                                value={buyoutDetails.payable_amount}
                                isReadOnly
                                size="md"
                            />
                            <InputRightElement pr={3}>
                                <Text color="gray.500">INR</Text>
                            </InputRightElement>
                        </InputGroup>
                    </FormControl>

                    <FormControl mb={4} isRequired>
                        <FormLabel fontSize="sm">UTR / Transaction Reference ID</FormLabel>
                        <Input
                            placeholder="Enter UTR Number"
                            size="md"
                            value={buyoutDetails.utr_number}
                            onChange={(e) =>
                                setBuyoutDetails(prev => ({
                                    ...prev,
                                    utr_number: e.target.value,
                                }))
                            }
                        />
                    </FormControl>

                    <FormControl mb={4} isRequired>
                        <FormLabel fontSize="sm">Payment Date</FormLabel>
                        <Input
                            type="date"
                            size="md"
                            value={buyoutDetails.payment_date}
                            onChange={(e) =>
                                setBuyoutDetails(prev => ({
                                    ...prev,
                                    payment_date: e.target.value || null,
                                }))
                            }
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel fontSize="sm">Upload Payment Proof</FormLabel>
                        <Input
                            type="file"
                            size="md"
                            accept="image/*,.pdf"
                            onChange={(e) =>
                                setBuyoutDetails({
                                    ...buyoutDetails,
                                    payment_proof: e.target.files?.[0] ?? null,
                                })
                            }
                        />
                    </FormControl>
                </ModalBody>

                <ModalFooter gap={3}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        backgroundColor={deloitte_theme.buttonPrimary}
                        color="white"
                        _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                        onClick={handleSubmitBuyoutRequest}
                        isLoading={isLoading}
                    >
                        Save details
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}

export default BuyoutRequestModal