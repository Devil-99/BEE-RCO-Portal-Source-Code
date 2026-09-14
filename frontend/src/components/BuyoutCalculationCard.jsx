import React from 'react'
import { Box, Divider, Flex, Text } from '@chakra-ui/react'
import deloitte_theme from '../theme'

function BuyoutCalculationCard({ shortfallAmount, ratePerMwh }) {
    return (
        <Box
            p={deloitte_theme.paddingX}
            borderRadius="lg"
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
        >
            <Text fontWeight="semibold" mb={3}>
                Payment Calculation
            </Text>

            <Flex justify="space-between" fontSize="sm" mb={2}>
                <Text>Shortfall (MWh)</Text>
                <Text fontWeight="medium">{shortfallAmount}</Text>
            </Flex>

            <Flex justify="space-between" fontSize="sm" mb={2}>
                <Text>Rate per MWh</Text>
                <Text fontWeight="medium">₹ {ratePerMwh}</Text>
            </Flex>

            <Divider my={2} />

            <Flex justify="space-between" fontSize="md">
                <Text fontWeight="semibold">Total Amount</Text>
                <Text fontWeight="bold" color="green.600">
                    ₹ {(shortfallAmount * ratePerMwh).toLocaleString("en-IN")}
                </Text>
            </Flex>
        </Box>
    )
}

export default BuyoutCalculationCard