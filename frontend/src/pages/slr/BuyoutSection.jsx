import React, { useState, useEffect } from 'react'
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
} from '@chakra-ui/react'
import deloitte_theme from '../../theme'
import { useSelector } from 'react-redux'
import { useResolveAmountQuery } from '../../redux/apiSlices/paymentCategoryApi';
import BuyoutRequestModal from '../../components/BuyoutRequestModal';
import BuyoutCalculationCard from '../../components/BuyoutCalculationCard';
import BuyoutPaymentNoticeCard from '../../components/BuyoutPaymentNoticeCard';

function BuyoutSection({ selectedFY, shortfallAmount }) {
    const { user_id, entity_id, entity_type } = useSelector((state) => state.login);
    const { data: buyoutRate } = useResolveAmountQuery(
        { category_code: 'BUYOUT', fy_id: selectedFY, entity_id: entity_id },
        { skip: !selectedFY }
    );
    const ratePerMwh = buyoutRate?.amount;
    const calculatedAmount = shortfallAmount * ratePerMwh;

    const [showPaymentBox, setShowPaymentBox] = useState(false);
    const [paymentMode, setPaymentMode] = useState("offline");

    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <Flex
            w="full"
            direction="column"
            p={deloitte_theme.paddingX}
            gap={deloitte_theme.gap}
            border="1px solid"
            borderColor={deloitte_theme.primary}
            bgColor={deloitte_theme.white}
            borderRadius="lg"
        >
            <Text w="full" textAlign="left" fontSize="md" fontWeight="semibold">
                Buyout Option:
            </Text>
            <BuyoutCalculationCard shortfallAmount={shortfallAmount} ratePerMwh={ratePerMwh} />
            {
                showPaymentBox ?
                    <Flex direction="column" gap={deloitte_theme.gap}>
                        {/* 🔹 Payment Mode */}
                        <Box>
                            <Text fontSize="sm" fontWeight="medium" mb={2}>
                                Select Payment Mode
                            </Text>

                            <RadioGroup onChange={setPaymentMode} value={paymentMode}>
                                <Stack direction="row">
                                    <Radio value="offline">Offline Payment</Radio>
                                    <Radio value="online" disabled>Online Payment</Radio>
                                </Stack>
                            </RadioGroup>
                        </Box>

                        {/* 🔹 Notice Card */}
                        <BuyoutPaymentNoticeCard payMode={paymentMode} />

                        {
                            paymentMode === "offline" &&
                            <Button
                                width="fit-content"
                                backgroundColor={deloitte_theme.buttonPrimary}
                                color="white"
                                _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                                onClick={() => setIsModalOpen(true)}
                            >
                                Save Payment Details
                            </Button>
                        }

                        <BuyoutRequestModal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            shortfallAmount={shortfallAmount}
                            calculatedAmount={calculatedAmount}
                            selectedFY={selectedFY}
                        />
                    </Flex>
                    :
                    <Button
                        width="fit-content"
                        backgroundColor={deloitte_theme.buttonPrimary}
                        color="white"
                        _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                        disabled={!selectedFY || shortfallAmount <= 0}
                        onClick={() => setShowPaymentBox(!showPaymentBox)}
                    >
                        Proceed to Buyout
                    </Button>
            }
        </Flex>
    )
}

export default BuyoutSection