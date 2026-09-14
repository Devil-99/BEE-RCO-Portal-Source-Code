import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Flex, Box, Button, Heading, Text, Divider, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';
import { ChevronDownIcon } from "@chakra-ui/icons";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from '../../components/toastService';
import deloitte_theme from '../../theme';

import { useSelector } from 'react-redux';
import approvalApprovedImg from '../../assets/status/approval_approved.svg';
import { useGetOrderDetailsQuery, useCreateOrderIdMutation, useInitiateTransactionMutation } from '../../redux/apiSlices/trackStatusApi';
import { useResolveAmountQuery } from '../../redux/apiSlices/paymentCategoryApi';
import { submitPaymentForm } from './paymentService';

const MotionBox = motion(Box);

const statusConfig = {
    SUCCESS: { bg: "green.100", color: "green.700", label: "Success" },
    FAILED: { bg: "red.100", color: "red.700", label: "Failed" },
    PENDING: { bg: "yellow.100", color: "yellow.700", label: "Pending" },
    BOOKED: { bg: "blue.100", color: "blue.700", label: "Processing" }
};

const PaymentPage = () => {
    const navigate = useNavigate();
    const { user_id, entity_id, entity_type, payment_flag } = useSelector((state) => state.login);
    const { financialYears } = useSelector((state) => state.commonState);

    const [payMode, setPayMode] = useState('NB');

    const { data: regAmount } = useResolveAmountQuery({
        category_code: 'REGISTRATION',
        entity_id: entity_id
    });
    
    const REGISTRATION_AMOUNT = regAmount?.amount;
    const GST_RATE = 0.00;
    const TOTAL_AMOUNT = REGISTRATION_AMOUNT
        ? REGISTRATION_AMOUNT + (REGISTRATION_AMOUNT * GST_RATE) + (REGISTRATION_AMOUNT * GST_RATE)
        : 0;

    const paymentAmountDetails = REGISTRATION_AMOUNT
        ? [
            { label: 'Amount', value: `₹ ${REGISTRATION_AMOUNT.toFixed(2)}` },
            { label: `CGST (${GST_RATE}%)`, value: `₹ ${(REGISTRATION_AMOUNT * GST_RATE).toFixed(2)}` },
            { label: `SGST (${GST_RATE}%)`, value: `₹ ${(REGISTRATION_AMOUNT * GST_RATE).toFixed(2)}` },
        ]
        : []

    const { data: orderDetails = [], isSuccess: orderDetailSuccess } = useGetOrderDetailsQuery({ entity_id });
    const [isOpenInvoice, setIsOpenInvoice] = useState(true);

    useEffect(() => {
        if (orderDetails.length > 0) {
            setIsOpenInvoice(false);
            if (payment_flag)
                navigate(`/payment-success/${orderDetails[0]?.order_id}`);
        }
    }, [payment_flag, orderDetails, orderDetailSuccess, navigate]);

    const [createOrderIdHandler, { isLoading: isCreatingOrder }] = useCreateOrderIdMutation();
    const [initiateTransactionHandler, { isLoading: isInitiatingTransaction }] = useInitiateTransactionMutation();

    const handleTransactionInitiation = async () => {
        try {
            const orderDetails = await createOrderIdHandler({ user_id, entity_id, amount: TOTAL_AMOUNT.toFixed(2) }).unwrap();

            if (!orderDetails?.order_id) {
                throw new Error('Order ID not received');
            } else {
                showToast({
                    title: "Order Created",
                    description: `Order ID: ${orderDetails.order_id} created successfully.`,
                    status: 'success'
                });

                await handleMakePayment(orderDetails.order_id);
            }
        } catch (error) {
            const errMsg = error.response?.data?.detail || 'Unable to create order. Please try again.';
            showToast({
                title: "Payment Initiation Failed",
                description: errMsg,
                status: 'error'
            });
        }
    };

    const handleMakePayment = async (order_id) => {
        try {
            const response = await initiateTransactionHandler({ order_id, pay_mode: payMode }).unwrap();

            if (!response?.success) {
                throw new Error(response?.message || 'Transaction initiation failed');
            }

            submitPaymentForm(response.encrypted_data, response.merchant_id, response.sbi_endpoint);
        } catch (error) {
            showToast({
                title: "Payment Initiation Failed",
                description: error.response?.data?.detail || 'Please try again or contact support',
                status: 'error'
            });
        }
    };

    return (
        <Flex w="full" justifyContent="space-evenly" alignItems="top" gap={deloitte_theme.gap}>
            <img
                src={approvalApprovedImg}
                alt="Documents Approved"
                style={{
                    width: '100%',
                    maxWidth: '534px',
                    height: 'auto',
                    objectFit: 'contain'
                }}
            />
            <Flex w="60%" direction="column" gap={deloitte_theme.gap} py={deloitte_theme.paddingY}>
                <Heading as="h2" size="lg" color={deloitte_theme.ternary}>
                    Documents Approved. Proceed for payment.
                </Heading>

                <Text>
                    Your registration have been Reviewed and Approved. You can make the payment now.
                    For further details kindly refer below.
                </Text>

                <Flex w="full" direction="column" gap={deloitte_theme.gap}>
                    {/* Payment Invoice Section */}
                    <Box
                        w="full"
                        borderRadius="xl"
                        boxShadow="lg"
                        overflow="hidden"
                        bg="white"
                    >
                        {/* Header (Clickable) */}
                        <Flex
                            bg={deloitte_theme.ternary}
                            color="white"
                            px={deloitte_theme.paddingX}
                            py={deloitte_theme.paddingY}
                            justify="space-between"
                            align="center"
                            cursor="pointer"
                            onClick={() => setIsOpenInvoice(!isOpenInvoice)}
                        >
                            <Heading size="md">Payment Summary</Heading>

                            {/* Arrow Icon */}
                            <MotionBox
                                animate={{ rotate: isOpenInvoice ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ChevronDownIcon boxSize={6} />
                            </MotionBox>
                        </Flex>

                        {/* Collapsible Body */}
                        <AnimatePresence initial={false}>
                            {isOpenInvoice && (
                                <MotionBox
                                    key="content"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.35, ease: "easeInOut" }}
                                    overflow="hidden"
                                >
                                    <Box
                                        px={deloitte_theme.paddingX}
                                        py={deloitte_theme.paddingY}
                                    >
                                        {/* Line Items */}
                                        {paymentAmountDetails.map((item) => (
                                            <Flex
                                                key={item.label}
                                                justify="space-between"
                                                py={2}
                                                fontSize="sm"
                                            >
                                                <Text color="gray.600">{item.label}</Text>
                                                <Text fontWeight="medium">
                                                    {item.value}
                                                </Text>
                                            </Flex>
                                        ))}

                                        <Divider my={3} />

                                        {/* Total */}
                                        <Flex justify="space-between" py={deloitte_theme.paddingY}>
                                            <Text fontWeight="bold" fontSize="md">
                                                Total Amount
                                            </Text>
                                            <Text
                                                fontWeight="bold"
                                                fontSize="lg"
                                                color="green.600"
                                            >
                                                {`₹ ${TOTAL_AMOUNT.toFixed(2)}`}
                                            </Text>
                                        </Flex>
                                    </Box>
                                </MotionBox>
                            )}
                        </AnimatePresence>
                    </Box>

                    {
                        orderDetails?.length > 0 ?
                            (
                                <Flex direction="column" gap={deloitte_theme.gap}>
                                    <Heading size="md" bg={deloitte_theme.ternary} color={deloitte_theme.white} p={deloitte_theme.paddingY}>
                                        Payment History
                                    </Heading>
                                    <Box overflowX={"auto"}>
                                        <Table variant="simple" size="sm">
                                            <Thead bg={deloitte_theme.lightGray}>
                                                <Tr>
                                                    <Th>Order ID</Th>
                                                    <Th isNumeric>Amount</Th>
                                                    <Th>Status</Th>
                                                    <Th>Response</Th>
                                                    <Th>Created At</Th>
                                                    <Th>Verified At</Th>
                                                    <Th>Action</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {
                                                    orderDetails.map((order) => {
                                                        const status = statusConfig[order.status] || statusConfig.BOOKED;
                                                        return (
                                                            <Tr key={order.order_id} borderBottom={`1px solid ${deloitte_theme.lightGray}`} bg={status.bg}>
                                                                <Td fontWeight="semibold">{order.order_id}</Td>
                                                                <Td isNumeric>
                                                                    ₹{parseFloat(order.amount).toFixed(2)}
                                                                </Td>
                                                                <Td>
                                                                    <Text
                                                                        px={2}
                                                                        py={1}
                                                                        borderRadius="md"
                                                                        textAlign="center"
                                                                        bg={status.bg}
                                                                        color={status.color}
                                                                    >
                                                                        {order.gateway_status}
                                                                    </Text>
                                                                </Td>
                                                                <Td>{order.reason}</Td>
                                                                <Td>{new Date(order.created_at).toLocaleDateString()}-{new Date(order.created_at).toLocaleTimeString()}</Td>
                                                                <Td>{new Date(order.verified_at).toLocaleDateString()}-{new Date(order.verified_at).toLocaleTimeString()}</Td>
                                                                <Td>
                                                                    {/* ACTION LOGIC */}
                                                                    {order.status === "FAILED" && (
                                                                        <Button
                                                                            size="sm"
                                                                            colorScheme="red"
                                                                            variant="outline"
                                                                            onClick={handleTransactionInitiation}
                                                                        >
                                                                            Retry
                                                                        </Button>
                                                                    )}

                                                                    {order.status === "PENDING" && order.gateway_status === null && (
                                                                        <Button
                                                                            size="sm"
                                                                            colorScheme="blue"
                                                                            onClick={() => handleMakePayment(order.order_id)}
                                                                        >
                                                                            Complete Payment
                                                                        </Button>
                                                                    )}

                                                                    {order.gateway_status === "BOOKED" && (
                                                                        <Text fontSize="xs" color="gray.500">
                                                                            Awaiting bank confirmation...
                                                                        </Text>
                                                                    )}

                                                                    {order.status === "SUCCESS" && (
                                                                        <Text fontSize="xs" color="green.600">
                                                                            Paid
                                                                        </Text>
                                                                    )}
                                                                </Td>
                                                            </Tr>
                                                        )
                                                    }
                                                    )
                                                }
                                            </Tbody>
                                        </Table>
                                    </Box>
                                </Flex>
                            ) : (
                                <Flex w="full" justifyContent="end">
                                    <Button
                                        size="md"
                                        width="fit-content"
                                        bgColor={deloitte_theme.buttonPrimary}
                                        _hover={{
                                            bgColor: deloitte_theme.buttonHoverPrimary
                                        }}
                                        onClick={handleTransactionInitiation}
                                        isLoading={isCreatingOrder || isInitiatingTransaction}
                                        loadingText={isInitiatingTransaction && "Redirected to SBI pay..."}
                                    >
                                        Make Payment
                                    </Button>
                                </Flex>
                            )
                    }
                </Flex>
            </Flex>
        </Flex>
    );
};

export default PaymentPage;