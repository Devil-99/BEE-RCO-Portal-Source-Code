import React from 'react'
import { Box, Text, Badge, HStack, VStack, IconButton } from '@chakra-ui/react';
import deloitte_theme from '../theme';
import { useOpenFileMutation } from '../redux/apiSlices/adminControlApi';
import { showToast } from './toastService';
import { AiFillFilePdf, AiFillFileImage } from "react-icons/ai";

const statusStyles = {
    COMPLIANT: { color: "green.500", bg: "green.50", text: "Compliant" },
    NON_COMPLIANT: { color: "gray.500", bg: "gray.50", text: "Non-Compliant" },
    REJECTED: { color: "red.500", bg: "red.50", text: "Rejected" },
    PENDING: { color: "yellow.500", bg: "yellow.50", text: "Pending" },
};

function BuyoutStatusCard({ buyoutStatus }) {
    const [openFile] = useOpenFileMutation();

    const getFileName = (file) => {
        if (!file) return null;
        const name = file.split("/").pop();
        return name;
    }

    const getFileType = (file) => {
        if (!file) return null;
        const lower = file.toLowerCase();
        if (lower.endsWith('.pdf')) return 'pdf';
        // treat other common image extensions as images
        if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.webp')) return 'image';
        return 'file';
    }

    const fileType = buyoutStatus?.document_url ? getFileType(buyoutStatus.document_url) : null;
    const fileName = buyoutStatus?.document_url ? getFileName(buyoutStatus.document_url) : null;

    const handleOpenFile = (filepath) => {
        if (!filepath) {
            showToast({
                title: "No file available",
                status: "warning",
            });
            return;
        }
        openFile(filepath);
    }

    return (
        <Box
            w="50%"
            p={deloitte_theme.paddingX}
            border="1px solid"
            borderColor="gray.300"
            borderRadius="lg"
            bg={statusStyles[buyoutStatus.status]?.bg || "yellow.50"}
        >
            <Text fontSize="lg" fontWeight="bold" mb={3}>
                Buyout request status:
                <Badge ml={2} size="lg" colorScheme={statusStyles[buyoutStatus.status]?.color ? statusStyles[buyoutStatus.status].color.split(".")[0] : "gray"}>
                    {buyoutStatus.status}
                </Badge>
            </Text>
            <HStack justifyContent="space-between" alignItems="flex-start" spacing={6}>
                <VStack alignItems="flex-start" spacing={2} flex="1">
                    {
                        buyoutStatus.buyout_type && (
                            <Text mb={1}>
                                Buyout Type: <b>{buyoutStatus.buyout_type}</b>
                            </Text>
                        )
                    }
                    {buyoutStatus.utr_number && (
                        <Text mb={1}>
                            UTR Number: <b>{buyoutStatus.utr_number}</b>
                        </Text>
                    )}
                    {buyoutStatus.payment_date && (
                        <Text mb={1}>
                            Payment Date: <b>{new Date(buyoutStatus.payment_date).toLocaleDateString("en-GB")}</b>
                        </Text>
                    )}
                    {buyoutStatus.buyout_request_id && (
                        <Text mb={1}>
                            Request ID: <b>{buyoutStatus.buyout_request_id}</b>
                        </Text>
                    )}
                    {buyoutStatus.submitted_on && (
                        <Text mb={1}>
                            Submitted on: <b>{new Date(buyoutStatus.submitted_on).toLocaleString()}</b>
                        </Text>
                    )}
                    {buyoutStatus.approved_on && (
                        <Text mb={1}>
                            Approved on: <b>{new Date(buyoutStatus.approved_on).toLocaleString()}</b>
                        </Text>
                    )}
                    {buyoutStatus.remarks && (
                        <Text>
                            Remarks: <b>{buyoutStatus.remarks}</b>
                        </Text>
                    )}
                </VStack>
                <Box minW={{ base: '110px', md: '160px' }}>
                    {buyoutStatus.document_url ? (
                        <VStack spacing={2} alignItems="flex-end" mr={5}>
                            <Box p={2} bg="white" borderRadius="md" boxShadow="sm" border="1px solid" borderColor="gray.100">
                                <IconButton
                                    aria-label="open-file"
                                    icon={
                                        fileType === 'pdf'
                                            ? <AiFillFilePdf size="28px" color="#D53F8C" />
                                            : <AiFillFileImage size="28px" color="#D53F8C" />
                                    }
                                    variant="ghost"
                                    onClick={() => handleOpenFile(buyoutStatus.document_url)}
                                />
                            </Box>
                            <Text
                                fontSize="sm"
                                color="gray.600"
                                textAlign="right"
                                noOfLines={2}
                                maxW="140px"
                            >
                                {fileName || buyoutStatus.document_url}
                            </Text>
                        </VStack>
                    ) : (
                        <Box />
                    )}
                </Box>
            </HStack>
        </Box>
    )
}

export default BuyoutStatusCard