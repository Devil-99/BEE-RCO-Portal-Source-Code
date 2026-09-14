import React, { useState, useEffect } from 'react';
import {
    Flex,
    Wrap,
    WrapItem,
    Button,
    Text,
    Box,
    Divider,
    Input,
    InputGroup,
    InputRightElement,
    Badge,
    Spinner
} from "@chakra-ui/react";
import deloitte_theme from "../../theme";
import { useSelector } from "react-redux";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useGetComplianceSummaryQuery } from "../../redux/apiSlices/forms/formApi";
import { useGetSubmissionStatusQuery, useLazyGenerateFormDDataQuery } from '../../redux/apiSlices/entityDashboardApi';
import { useGetPurchasedRECsQuery, useBuyoutStatusQuery } from '../../redux/apiSlices/buyoutApi';
import { showToast } from "../../components/toastService";

import RECSection from './RECSection';
import BuyoutSection from './BuyoutSection';
import BuyoutStatusCard from '../../components/BuyoutStatusCard';
import FinancialYearFilter from '../../components/FinancialYearFilter';
import ComplianceKPIs from './ComplianceKPIs';
import RCOCertificateOne from '../certificates/RCOCertificateOne';
import RCOCertificateTwo from '../certificates/RCOCertificateTwo';
import FormDDiscom from '../FormD/FormD_DISCOM';
import FormDCpp from '../FormD/FormD_CPP';
import { useFY } from '../../Hooks/useLookUp';

function FormDBuyout() {
    const { financialYears } = useSelector((state) => state.commonState);
    const { entity_id, entity_type, entity_registration_number } = useSelector((state) => state.login);
    const [selectedFY, setSelectedFY] = useState('');
    const getFYCode = useFY();

    const { data: submissionStatus } = useGetSubmissionStatusQuery(selectedFY, { skip: !selectedFY });
    const { data: buyoutStatus } = useBuyoutStatusQuery(selectedFY, { skip: !selectedFY });
    const [generateFormDData,
        {
            data: formDData,
            isLoading: isGeneratingFormD,
            error: formDError
        }
    ] = useLazyGenerateFormDDataQuery();

    const isBuyoutSubmitted = Boolean(
        buyoutStatus?.status &&
        buyoutStatus.status !== "NON_COMPLIANT" &&
        buyoutStatus.status !== "REJECTED"
    );

    const { data: complianceSummary } = useGetComplianceSummaryQuery({ type: entity_type, entity_id, fy_id: selectedFY }, { skip: !selectedFY || isBuyoutSubmitted });
    const { data: purchasedRECs, refetch: refetchPurchasedRECs } = useGetPurchasedRECsQuery(selectedFY, { skip: !selectedFY || isBuyoutSubmitted });

    const [shortfallAmount, setShortfallAmount] = useState(0);
    const [recNumber, setRecNumber] = useState(0);

    useEffect(() => {
        if (complianceSummary?.data) {
            const shortfallValue = complianceSummary.data.surplus_deficit < 0 ? Math.abs(complianceSummary.data.surplus_deficit) * 1000 : 0;

            if (purchasedRECs?.data) {
                const totalPurchased = purchasedRECs.data.reduce((sum, rec) => sum + rec.number_of_recs, 0);
                const adjustedShortfall = shortfallValue - totalPurchased;
                setShortfallAmount(adjustedShortfall > 0 ? adjustedShortfall : 0);
                setRecNumber(adjustedShortfall > 0 ? adjustedShortfall : 0);
            } else {
                setShortfallAmount(shortfallValue);
                setRecNumber(shortfallValue > 0 ? shortfallValue : 0);
            }
        }
    }, [complianceSummary, purchasedRECs, selectedFY]);

    const isSubmissionPending = selectedFY && !submissionStatus?.submitted;

    const isBuyoutCompliant = buyoutStatus?.status === "COMPLIANT";
    const isBuyoutApproved = buyoutStatus?.status === "APPROVED";
    const isBuyoutNotApplicable = !isBuyoutSubmitted && shortfallAmount === 0

    const canGenerateDocuments =
        selectedFY &&
        (
            isBuyoutNotApplicable ||
            (
                isBuyoutApproved ||
                isBuyoutCompliant
            )
        )
        ;

    const handleGenerateFormD = async () => {
        try {
            const response = await generateFormDData(selectedFY).unwrap();
        } catch (error) {
            console.error("Failed to generate Form D data:", error);

            showToast({
                title: "Error",
                description: "Failed to generate Form D.",
                status: "error"
            });
        }
    };

    const renderPendingSubmission = () => {
        return (
            <Box
                w="80%"
                p={deloitte_theme.paddingX}
                border="1px solid"
                borderColor={deloitte_theme.secondary}
                borderRadius="lg"
                bg={deloitte_theme.primary}
                fontSize="lg"
            >
                <Text color="orange.400" fontWeight="bold">
                    Annual submission is pending from {submissionStatus?.stage}
                </Text>

                <Text color="gray.800" fontWeight="semibold">
                    Please wait for approval from BEE Administrator to view
                    compliance details and buyout options.
                </Text>
            </Box>
        );
    };

    const renderComplianceAndBuyout = () => {
        return (
            <>
                <Flex w="full" gap={deloitte_theme.gap}>
                    <RECSection
                        purchasedRECs={purchasedRECs}
                        refetchPurchasedRECs={refetchPurchasedRECs}
                        recNumber={recNumber}
                        setRecNumber={setRecNumber}
                        selectedFY={selectedFY}
                        shortfallAmount={shortfallAmount}
                    />

                    <BuyoutSection
                        selectedFY={selectedFY}
                        shortfallAmount={shortfallAmount}
                    />
                </Flex>
            </>
        );
    };

    const renderFormDButton = () => {
        if (isGeneratingFormD) {
            return (
                <Button
                    w="fit-content"
                    bg={deloitte_theme.buttonPrimary}
                    color={deloitte_theme.white}
                    isLoading
                >
                    Generating Form D...
                </Button>
            );
        }
        if (!formDData?.data) {
            return (
                <Button
                    w="fit-content"
                    bg={deloitte_theme.buttonPrimary}
                    color={deloitte_theme.white}
                    onClick={handleGenerateFormD}
                >
                    Generate Form D
                </Button>
            );
        }
        return (
            <Flex w="full" gap={deloitte_theme.gap}>
                <PDFDownloadLink
                    document={
                        entity_type === "DISCOM"
                            ? <FormDDiscom data={formDData.data} />
                            : <FormDCpp data={formDData.data} />
                    }
                    fileName={`FORM_D_${entity_registration_number}_${getFYCode(selectedFY)}.pdf`}
                    style={{ textDecoration: "none" }}
                >
                    {({ loading }) => (
                        <Button
                            bg={deloitte_theme.buttonPrimary}
                            color={deloitte_theme.white}
                            p={deloitte_theme.paddingY}
                            cursor="pointer"
                            _hover={{
                                bg: deloitte_theme.buttonHoverPrimary
                            }}
                            onClick={handleGenerateFormD}
                            isLoading={isGeneratingFormD}
                        >
                            {loading || isGeneratingFormD ? (
                                <Spinner size="sm" />
                            ) : (
                                "Download Form D"
                            )}
                        </Button>
                    )}
                </PDFDownloadLink>
            </Flex>
        );
    };

    return (
        <Flex
            direction="column"
            gap={deloitte_theme.gap}
            p={deloitte_theme.paddingY}
        >
            <Text
                fontSize="2xl"
                fontWeight="bold"
                color={deloitte_theme.textPrimary}
                mb={5}
            >
                Compliance Dashboard
            </Text>

            <FinancialYearFilter
                selectedFY={selectedFY}
                setSelectedFY={setSelectedFY}
            />

            <Divider />

            {isSubmissionPending ? (
                renderPendingSubmission()
            ) : (

                <>
                    {!isBuyoutSubmitted && (
                        <ComplianceKPIs
                            selectedFY={selectedFY}
                            complianceSummary={complianceSummary}
                            shortfallAmount={shortfallAmount}
                        />
                    )}

                    {/* Case 2 and Case 3: Buyout status */}
                    {isBuyoutSubmitted && (
                        <BuyoutStatusCard
                            buyoutStatus={buyoutStatus}
                        />
                    )}

                    {canGenerateDocuments && renderFormDButton()}

                    {(!isBuyoutSubmitted && shortfallAmount !== 0 ) && renderComplianceAndBuyout()}
                </>

            )}
        </Flex>
    );
}

export default FormDBuyout