import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetPaymentDetailsQuery } from '../../redux/apiSlices/trackStatusApi';
import SkeletonComponent from '../../components/SkeletonComponent';
import {
    Flex,
    Box,
    Heading,
    Text,
    Input,
    InputGroup,
    InputLeftAddon,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionIcon,
    AccordionPanel,
    Button,
    Spinner
} from '@chakra-ui/react'
import deloitte_theme from '../../theme';
import approvalPaymentImg from '../../assets/status/approval_payment.svg';
import { LuImagePlus } from "react-icons/lu";
import { FaFilePdf, FaUser, FaIdCard, FaCopy, FaCheck } from "react-icons/fa";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ReceiptPDF from "./ReceiptPDF";

function PaymentSuccessPage() {
    const navigate = useNavigate();
    const { order_id } = useParams();

    const nameModifier = (name) => {
        return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    const dateModifier = (dateStr) => {
        const date = new Date(dateStr).toLocaleDateString('en-GB');
        const time = new Date(dateStr).toLocaleTimeString('en-GB');
        return `${date}, ${time}`;
    }

    const [transactionDetails, setTransactionDetails] = useState({
        transaction_id: '',
        order_id: 'ORD987654321',
        amount_paid: '₹15000.00',
        transaction_date: '2024-06-15',
        payment_method: 'Credit Card'
    });
    const [userDetails, setUserDetails] = useState({
        username: 'ABC-ABCD-ABCD-2026-001',
        entity_registration_number: 'ABCD1234EFGH5678'
    });
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [processComplete, setProcessComplete] = useState(false);

    const { data: paymentDetails } = useGetPaymentDetailsQuery(order_id);

    useEffect(() => {
        setUpdatingStatus(true);
        if (paymentDetails?.order_id) {
            setTransactionDetails(prev => ({
                ...prev,
                transaction_id: paymentDetails.transaction_id,
                order_id: paymentDetails.order_id,
                amount_paid: paymentDetails.amount,
                bank_reference_number: paymentDetails.bank_ref_number,
                receipt_identification_number: paymentDetails.challan_number,
                transaction_date: paymentDetails.transaction_date,
                payment_method: paymentDetails.payment_mode,
                status: paymentDetails.status
            }));
            setUserDetails(prev => ({
                ...prev,
                username: paymentDetails.username,
                entity_registration_number: paymentDetails.entity_registration_number
            }));

            if (paymentDetails.username)
                setProcessComplete(true);
        }
        setUpdatingStatus(false);
    }, [paymentDetails])

    // Clipboard copy functionality
    const [copiedField, setCopiedField] = useState(null);
    const [clipboardLoader, setClipboardLoader] = useState(false);

    const copyToClipboard = (value, fieldName) => {
        setClipboardLoader(true);
        navigator.clipboard.writeText(value).then(() => {
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        }).catch(() => {
            console.error('Failed to copy to clipboard');
        }).finally(() => {
            setClipboardLoader(false);
        });
    };

    const getIconForField = (fieldName) => {
        if (fieldName.includes('username')) return <FaUser size={20} />;
        if (fieldName.includes('entity')) return <FaIdCard size={20} />;
        return <FaUser size={20} />;
    };
    return (
        <Flex w="full" h="75vh" justifyContent="space-evenly" alignItems="top" gap={deloitte_theme.gap}>
            <Flex w="45%" justifyContent="center" alignItems="center">
                <img
                    src={approvalPaymentImg}
                    alt="Payment Successful"
                    style={{
                        width: '100%',
                        maxWidth: '600px',
                        height: 'auto',
                        objectFit: 'contain'
                    }}
                />
            </Flex>
            <Flex w="55%" overflowY={"auto"} direction="column" gap={deloitte_theme.gap} p={deloitte_theme.paddingX}>
                <Heading as="h2" size="lg" color={deloitte_theme.ternary}>
                    Payment Successful
                </Heading>

                <Box>
                    <Text fontWeight={"semibold"}>
                        {
                            processComplete ?
                                "Your payment has been successfully processed."
                                :
                                "Your payment has been received and is currently under verification."
                        }
                    </Text>
                    <Text>
                        For further details kindly refer below.'
                    </Text>
                </Box>
                {
                    updatingStatus ?
                        <SkeletonComponent />
                        :
                        <Flex w="full" direction="column" gap={deloitte_theme.gap}>
                            <Accordion defaultIndex={[0]} allowMultiple>
                                <AccordionItem>
                                    <AccordionButton bg={processComplete ? deloitte_theme.buttonPrimary : deloitte_theme.primary}>
                                        <Box as='span' flex='1' textAlign='left'>
                                            Payment Invoice
                                        </Box>
                                        <AccordionIcon />
                                    </AccordionButton>
                                    <AccordionPanel>
                                        <Flex justifyContent="space-between" gap={deloitte_theme.gap} px={deloitte_theme.paddingX}>
                                            <Flex direction="column" w="full">
                                                {
                                                    Object.entries(transactionDetails).map(([key, value]) => (
                                                        <InputGroup key={key}>
                                                            <InputLeftAddon w="40%">{nameModifier(key)} :</InputLeftAddon>
                                                            <Input value={value} isReadOnly textAlign="right" bg={deloitte_theme.lightGray} p={deloitte_theme.paddingY} />
                                                        </InputGroup>
                                                    ))
                                                }
                                                <InputGroup>
                                                    <InputLeftAddon w="40%">BEE PAN No. :</InputLeftAddon>
                                                    <Input value={"AAAAE0631J"} isReadOnly textAlign="right" bg={deloitte_theme.lightGray} p={deloitte_theme.paddingY} />
                                                </InputGroup>
                                            </Flex>
                                            {
                                                paymentDetails?.order_id &&
                                                <Flex direction="column" justifyContent="end" alignItems="center" gap={deloitte_theme.gap} p={deloitte_theme.paddingY}>
                                                    <PDFDownloadLink
                                                        document={<ReceiptPDF data={paymentDetails} />}
                                                        fileName={`receipt_${paymentDetails?.entity_registration_number}.pdf`}
                                                        style={{ textDecoration: "none" }}
                                                    >
                                                        {({ loading }) => (
                                                            <Box
                                                                bg="red.500"
                                                                color={deloitte_theme.white}
                                                                p={deloitte_theme.paddingY}
                                                                borderRadius="100%"
                                                                cursor="pointer"
                                                                _hover={{ bg: "red.600" }}
                                                            >
                                                                {loading ? <Spinner size="sm" /> : <FaFilePdf size={25} />}
                                                            </Box>
                                                        )}
                                                    </PDFDownloadLink>
                                                </Flex>
                                            }
                                        </Flex>
                                    </AccordionPanel>
                                </AccordionItem>
                            </Accordion>

                            {/* Username section */}
                            {
                                !processComplete ?
                                    (
                                        <Flex
                                            direction="column"
                                            gap={deloitte_theme.gap}
                                            bg="blue.50"
                                            border="1px solid"
                                            borderColor="blue.200"
                                            p={deloitte_theme.paddingX}
                                            borderRadius="md"
                                        >
                                            <Text fontSize="md" color="blue.800" fontWeight="semibold">
                                                Your payment is under verification and may take up to 30 minutes to reflect in your account.
                                            </Text>
                                            <Text fontSize="md" color={deloitte_theme.textWarning}>
                                                Please do not make another payment during this time.
                                            </Text>
                                            <Text fontSize="sm" color={deloitte_theme.ternary}>
                                                Your status will update automatically and respective username and password will be sent to your mobile number.
                                            </Text>
                                        </Flex>
                                    )
                                    :
                                    (
                                        <Flex direction="column" alignItems="center" gap={deloitte_theme.gap}>
                                            {
                                                Object.entries(userDetails).map(([key, value]) => (
                                                    <Flex
                                                        key={key}
                                                        w="90%"
                                                        alignItems="center"
                                                        gap={deloitte_theme.gap}
                                                        py={deloitte_theme.paddingY}
                                                        px={deloitte_theme.paddingX}
                                                        borderRadius="md"
                                                        bg={deloitte_theme.primary}
                                                    >
                                                        {/* Icon */}
                                                        <Box color="blue.400">
                                                            {getIconForField(key)}
                                                        </Box>

                                                        {/* Key and Value */}
                                                        <Flex direction="row" flex="1" gap={deloitte_theme.gap}>
                                                            <Text fontSize="sm" color="gray.600">{nameModifier(key)} :</Text>
                                                            <Text fontWeight="semibold">{value}</Text>
                                                        </Flex>

                                                        {/* Copy Button */}
                                                        <Button
                                                            key={key}
                                                            cursor="pointer"
                                                            onClick={() => copyToClipboard(value, nameModifier(key))}
                                                            title="Copy to clipboard"
                                                            isLoading={clipboardLoader && copiedField === nameModifier(key)}
                                                        >
                                                            {copiedField === nameModifier(key) ? (
                                                                <FaCheck size={18} className='text-green-500' />
                                                            ) : (
                                                                <FaCopy size={18} className='text-gray-400' />
                                                            )}
                                                        </Button>
                                                    </Flex>
                                                ))
                                            }
                                            <Button
                                                size="md"
                                                onClick={() => navigate('/formpage?type=login')}
                                                bg={deloitte_theme.buttonSecondary}
                                                _hover={{ bg: deloitte_theme.buttonHoverSecondary }}
                                            >
                                                Go to Login
                                            </Button>
                                        </Flex>
                                    )
                            }
                        </Flex>
                }
            </Flex>
        </Flex>
    )
}

export default PaymentSuccessPage