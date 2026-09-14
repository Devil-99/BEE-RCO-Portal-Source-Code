import React from 'react'
import { Box, Text } from '@chakra-ui/react'
import deloitte_theme from '../theme'

function BuyoutPaymentNoticeCard({ payMode }) {
    return (
        <Box
            p={deloitte_theme.paddingX}
            borderRadius="lg"
            bg={payMode === "offline" ? deloitte_theme.primary : "yellow.50"}
            border="1px dotted"
            borderColor={payMode === "offline" ? deloitte_theme.secondary : "yellow.300"}
        >
            {
                payMode === "offline" ?
                    (
                        <>
                            <Text fontWeight="semibold" mb={2}>
                                Bank Details for Offline Payment
                            </Text>

                            <Text fontSize="sm" mb={2}>
                                Please transfer the above amount using the following bank details:
                            </Text>

                            <Box fontSize="sm" mb={3}>
                                <Text><b>Account Name:</b> Bureau of Energy Efficiency</Text>
                                <Text><b>Bank Name:</b> State Bank of India</Text>
                                <Text><b>Account Number:</b> 44757802745</Text>
                                <Text><b>IFSC Code:</b> SBIN0003219</Text>
                                <Text><b>Branch:</b> South Extn-II</Text>
                            </Box>

                            <Text fontSize="sm" color="gray.600">
                                <b>Important: </b>
                                Upon successful completion of the payment, the payer shall mandatorily share the{" "}
                                <Text as="span" fontWeight="medium" color="blue.600">
                                    UTR number
                                </Text>{" "}
                                along with complete transaction details via email at{" "}
                                <Text as="span" fontWeight="medium" color="blue.600">
                                    RCO.support@beeindia.gov.in
                                </Text>.
                                {" "}for verification and record purposes. Failure to do so may result in non-recognition of the payment.
                            </Text>
                        </>
                    ) :
                    (
                        <>
                            <Text fontWeight="semibold" mb={2}>
                                Online Payment Unavailable
                            </Text>
                            <Text fontSize="sm" mb={2}>
                                We are currently in the process of integrating online payment options. Please proceed with offline payment using the provided bank details. We apologize for the inconvenience and appreciate your understanding.
                            </Text>
                        </>
                    )
            }
        </Box>
    )
}

export default BuyoutPaymentNoticeCard