import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Button,
    Divider,
    Flex,
    Text,
    Wrap,
    WrapItem,
    Radio,
    RadioGroup,
    Stack
} from '@chakra-ui/react';
import deloitte_theme from '../../theme';
import { useGetCorporateBuyoutSummaryQuery } from '../../redux/apiSlices/corporate/corporateAPI';
import { useResolveAmountQuery } from '../../redux/apiSlices/paymentCategoryApi';
import { useBuyoutStatusQuery } from '../../redux/apiSlices/buyoutApi';
import SkeletonComponent from '../../components/SkeletonComponent';
import BuyoutCalculationCard from '../../components/BuyoutCalculationCard';
import BuyoutPaymentNoticeCard from '../../components/BuyoutPaymentNoticeCard';
import BuyoutRequestModal from '../../components/BuyoutRequestModal';
import BuyoutStatusCard from '../../components/BuyoutStatusCard';

function PendingStatusSection({ buyoutSummary }) {
    return (
        <Box p={deloitte_theme.paddingX} border="1px solid" borderColor="orange.300" borderRadius="lg" bg="orange.50">
            <Text fontWeight="bold" color="orange.600" mb={2}>
                Pending
            </Text>
            <Text mb={3}>
                One or more linked entity submissions are still pending. Corporate cumulative shortfall and surplus/deficit will be available once all mapped entity submissions are closed.
            </Text>
            <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
                <Box p={4} borderRadius="lg" bg="white" border="1px solid" borderColor="gray.200" minW="180px">
                    <Text fontSize="sm" color="gray.600">Total mapped entities</Text>
                    <Text fontSize="xl" fontWeight="bold">{buyoutSummary.total_entities}</Text>
                </Box>
                <Box p={4} borderRadius="lg" bg="white" border="1px solid" borderColor="gray.200" minW="180px">
                    <Text fontSize="sm" color="gray.600">Closed submissions</Text>
                    <Text fontSize="xl" fontWeight="bold">{buyoutSummary.closed_entities}</Text>
                </Box>
                <Box p={4} borderRadius="lg" bg="white" border="1px solid" borderColor="gray.200" minW="180px">
                    <Text fontSize="sm" color="gray.600">Pending submissions</Text>
                    <Text fontSize="xl" fontWeight="bold">{buyoutSummary.pending_entities}</Text>
                </Box>
            </Flex>
        </Box>
    )
}


function CorporateBuyout() {
    const { entity_id } = useSelector((state) => state.login)
    const { financialYears } = useSelector((state) => state.commonState);
    const [selectedFY, setSelectedFY] = useState('');
    const [showPaymentBox, setShowPaymentBox] = useState(false);
    const [paymentMode, setPaymentMode] = useState("offline");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {
        data: buyoutSummary,
        isLoading: isBuyoutSummaryLoading,
    } = useGetCorporateBuyoutSummaryQuery(
        selectedFY ? parseInt(selectedFY) : null,
        { skip: !selectedFY }
    );

    const { data: buyoutStatus } = useBuyoutStatusQuery(selectedFY, { skip: !selectedFY });

    const buyoutSubmitted = Boolean(
        buyoutStatus?.status && buyoutStatus.status !== "NON_COMPLIANT" && buyoutStatus.status !== "REJECTED"
    );

    const shortfallAmount = buyoutSummary?.total_shortfall ?? 0;
    const cumulativeSurplusDeficit = buyoutSummary?.cumulative_surplus_deficit;
    const allClosed = buyoutSummary?.all_submissions_closed;
    const totalRecs = buyoutSummary?.total_recs ?? 0;

    const { data: buyoutRate } = useResolveAmountQuery(
        { category_code: 'BUYOUT', fy_id: selectedFY, entity_id: entity_id },
        { skip: !selectedFY }
    );
    const ratePerMwh = buyoutRate?.amount;
    const canProceed = allClosed && shortfallAmount > 0 && !buyoutSubmitted;

    const calculatedAmount = shortfallAmount * ratePerMwh;

    return (
        <Flex direction="column" gap={deloitte_theme.gap}>
            <Text fontSize="2xl" fontWeight="bold" color={deloitte_theme.textPrimary} mb={5}>
                Corporate Compliance Dashboard
            </Text>
            {/* FY Filter */}
            <Flex gap={deloitte_theme.gap} alignItems="center">
                <Text fontSize="md" fontWeight="bold" color={deloitte_theme.textPrimary}>
                    Financial Year :
                </Text>
                <Wrap spacing={3}>
                    {financialYears.map((fy) => (
                        <WrapItem key={fy.id}>
                            <Button
                                size="sm"
                                variant={selectedFY === fy.id ? 'solid' : 'outline'}
                                backgroundColor={selectedFY === fy.id ? deloitte_theme.buttonPrimary : 'white'}
                                color={selectedFY === fy.id ? 'black' : 'gray.700'}
                                borderColor="gray.300"
                                _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                                onClick={() => {
                                    setSelectedFY(fy.id);
                                    setShowPaymentBox(false);
                                }}
                            >
                                {fy.fy_code}
                            </Button>
                        </WrapItem>
                    ))}
                </Wrap>
            </Flex>

            <Divider borderColor={deloitte_theme.borderColor} />

            {isBuyoutSummaryLoading ? (
                <SkeletonComponent />
            ) : (
                <Box p={deloitte_theme.paddingX}>
                    {
                        !selectedFY ? (
                            <Box p={deloitte_theme.paddingX} border="1px solid" borderColor={deloitte_theme.secondary} borderRadius="lg" bg={deloitte_theme.primary}>
                                <Text fontWeight="semibold">Select a financial year to view the corporate buyout summary.</Text>
                            </Box>
                        ) : !buyoutSummary ? (
                            <Box p={deloitte_theme.paddingX} border="1px solid" borderColor={deloitte_theme.secondary} borderRadius="lg" bg={deloitte_theme.primary}>
                                <Text fontWeight="semibold">Unable to load corporate buyout data for this financial year.</Text>
                            </Box>
                        ) : !allClosed ? (
                            <PendingStatusSection buyoutSummary={buyoutSummary} />
                        ) : buyoutSubmitted ? (
                            <BuyoutStatusCard buyoutStatus={buyoutStatus} />
                        ) : (
                            <Flex direction="column" gap={deloitte_theme.gap}>
                                <Wrap spacing={6}>
                                    <WrapItem>
                                        <Box p={deloitte_theme.paddingX} border="1px solid" borderColor={deloitte_theme.secondary} borderRadius="lg" bg={deloitte_theme.primary} minW="180px">
                                            <Text fontSize="sm">Total Surplus / Deficit</Text>
                                            <Text fontSize="xl" fontWeight="bold" color={cumulativeSurplusDeficit >= 0 ? 'green.500' : 'red.500'}>
                                                {cumulativeSurplusDeficit ?? '-'}
                                            </Text>
                                        </Box>
                                    </WrapItem>
                                    <WrapItem>
                                        <Box p={deloitte_theme.paddingX} border="1px solid" borderColor={deloitte_theme.secondary} borderRadius="lg" bg={deloitte_theme.primary} minW="180px">
                                            <Text fontSize="sm">Total RECs bought</Text>
                                            <Text fontSize="xl" fontWeight="bold" color={totalRecs >= 0 ? 'green.500' : 'red.500'}>
                                                {totalRecs ?? '-'}
                                            </Text>
                                        </Box>
                                    </WrapItem>
                                    <WrapItem>
                                        <Box p={deloitte_theme.paddingX} border="1px solid" borderColor={deloitte_theme.secondary} borderRadius="lg" bg={deloitte_theme.primary} minW="180px">
                                            <Text fontSize="sm">Total Shortfall</Text>
                                            <Text fontSize="xl" fontWeight="bold">{shortfallAmount}</Text>
                                        </Box>
                                    </WrapItem>
                                </Wrap>

                                <Box mt={deloitte_theme.gap}>
                                    <Button
                                        width="fit-content"
                                        backgroundColor={deloitte_theme.buttonPrimary}
                                        color="white"
                                        _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                                        disabled={!canProceed}
                                        onClick={() => setShowPaymentBox(!showPaymentBox)}
                                    >
                                        Proceed to Buyout
                                    </Button>
                                </Box>
                            </Flex>
                        )
                    }

                    {showPaymentBox && canProceed && (
                        <Box mt={deloitte_theme.gap} p={deloitte_theme.paddingX} border="1px solid" borderColor="gray.200" borderRadius="lg" bg="white">
                            <Flex direction="column" gap={4}>
                                <BuyoutCalculationCard shortfallAmount={shortfallAmount} ratePerMwh={ratePerMwh} />

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
                        </Box>
                    )}
                </Box>
            )
            }
        </Flex >
    );
}

export default CorporateBuyout;
