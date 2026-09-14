import React from 'react'
import { Box, Text, Wrap, WrapItem } from '@chakra-ui/react'
import deloitte_theme from '../../theme'
import { useSelector } from 'react-redux';

function ComplianceKPIs({ selectedFY, complianceSummary, shortfallAmount }) {
    const { financialYears } = useSelector((state) => state.commonState);
    return (
        <Box
            p={deloitte_theme.paddingX}
        >
            {/* Header of Compliance Summary */}
            <Text fontSize="lg" fontWeight="semibold" mb={4}>
                Compliance Summary{" "}
                {selectedFY ? (
                    <Text as="span" fontSize="sm" fontWeight="normal">
                        for FY {financialYears.find(fy => fy.id === selectedFY)?.fy_code}
                    </Text>
                ) : (
                    <Text as="span" fontSize="sm" fontWeight="normal" color="red.500">
                        Please select a financial year
                    </Text>
                )}
            </Text>
            {/* KPIs Section */}
            <Wrap spacing={6}>
                {/* Target */}
                <WrapItem>
                    <Box p={deloitte_theme.paddingX} border="1px solid" borderColor={deloitte_theme.secondary} borderRadius="lg" bg={deloitte_theme.primary} minW="180px">
                        <Text fontSize="sm">
                            RCO Target
                            <Text as="span" fontSize="xs" color="gray.500" pl={2}>
                                in MU
                            </Text>
                        </Text>
                        <Text fontSize="xl" fontWeight="bold">
                            {complianceSummary?.data?.target ?? "-"}
                        </Text>
                    </Box>
                </WrapItem>

                {/* Compliance */}
                <WrapItem>
                    <Box p={deloitte_theme.paddingX} border="1px solid" borderColor={deloitte_theme.secondary} borderRadius="lg" bg={deloitte_theme.primary} minW="180px">
                        <Text fontSize="sm">
                            RCO Compliance
                            <Text as="span" fontSize="xs" color="gray.500" pl={2}>
                                in MU
                            </Text>
                        </Text>
                        <Text fontSize="xl" fontWeight="bold">
                            {complianceSummary?.data?.compliance ?? "-"}
                        </Text>
                    </Box>
                </WrapItem>

                {/* Compliance % */}
                <WrapItem>
                    <Box p={deloitte_theme.paddingX} border="1px solid" borderColor={deloitte_theme.secondary} borderRadius="lg" bg={deloitte_theme.primary} minW="180px">
                        <Text fontSize="sm">
                            RCO Compliance
                            <Text as="span" fontSize="xs" color="gray.500" pl={2}>
                                in %
                            </Text>
                        </Text>
                        <Text fontSize="xl" fontWeight="bold">
                            {complianceSummary?.data?.compliance_percentage ?? "-"}%
                        </Text>
                    </Box>
                </WrapItem>

                {/* Surplus / Deficit */}
                <WrapItem>
                    <Box p={deloitte_theme.paddingX} border="1px solid" borderColor={deloitte_theme.secondary} borderRadius="lg" bg={deloitte_theme.primary} minW="180px">
                        <Text fontSize="sm">
                            Surplus / Deficit
                            <Text as="span" fontSize="xs" color="gray.500" pl={2}>
                                in MU
                            </Text>
                        </Text>
                        <Text
                            fontSize="xl"
                            fontWeight="bold"
                            color={
                                complianceSummary?.data?.surplus_deficit >= 0
                                    ? "green.500"
                                    : "red.500"
                            }
                        >
                            {complianceSummary?.data?.surplus_deficit ?? "-"}
                        </Text>
                    </Box>
                </WrapItem>

                {/* Surplus / Deficit % */}
                <WrapItem>
                    <Box p={deloitte_theme.paddingX} border="1px solid" borderColor={deloitte_theme.secondary} borderRadius="lg" bg={deloitte_theme.primary} minW="180px">
                        <Text fontSize="sm">
                            Surplus / Deficit
                            <Text as="span" fontSize="xs" color="gray.500" pl={2}>
                                in %
                            </Text>
                        </Text>
                        <Text
                            fontSize="xl"
                            fontWeight="bold"
                            color={
                                complianceSummary?.data?.surplus_deficit_percentage >= 0
                                    ? "green.500"
                                    : "red.500"
                            }
                        >
                            {complianceSummary?.data?.surplus_deficit_percentage ?? "-"}%
                        </Text>
                    </Box>
                </WrapItem>

                <WrapItem>
                    <Box p={deloitte_theme.paddingX} border="1px solid" borderColor={deloitte_theme.secondary} borderRadius="lg" bg={deloitte_theme.secondary} minW="180px">
                        <Text fontSize="sm">
                            Shortfall
                            <Text as="span" fontSize="xs" color="gray.50" pl={2}>
                                in MWh
                            </Text>
                        </Text>
                        <Text
                            fontSize="xl"
                            fontWeight="bold"
                        >
                            {shortfallAmount}
                        </Text>
                    </Box>
                </WrapItem>
            </Wrap>
        </Box>
    )
}

export default ComplianceKPIs