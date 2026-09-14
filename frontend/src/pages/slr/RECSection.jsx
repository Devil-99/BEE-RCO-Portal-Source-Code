import React, { useState } from 'react'
import { Box, Button, Divider, Flex, Input, InputGroup, InputRightElement, Text } from '@chakra-ui/react'
import deloitte_theme from '../../theme'
import { useBuyrecMutation } from '../../redux/apiSlices/buyoutApi';
import { showToast } from '../../components/toastService';

function RECSection({ purchasedRECs, refetchPurchasedRECs, recNumber, setRecNumber, selectedFY, shortfallAmount }) {
    const [recButtonEnabled, setRecButtonEnabled] = useState(true);
    const [recDate, setRecDate] = useState(new Date().toISOString().split("T")[0]);

    const [buyrec, { isLoading: recBuying }] = useBuyrecMutation();
    const totalRecPurchased = purchasedRECs?.data?.reduce((total, rec) => total + rec.number_of_recs, 0) || 0;

    const handleRecSubmit = async () => {
        // Implement the logic to submit the RE Certificate with the recNumber
        if (recNumber > shortfallAmount) {
            showToast(
                {
                    title: "REC Number cannot exceed shortfall amount.",
                    status: "error"
                }
            );
            return;
        }
        await buyrec({
            fy_id: selectedFY,
            number_of_recs: recNumber,
            purchase_date: recDate
        });
        refetchPurchasedRECs();
        setRecButtonEnabled(!recButtonEnabled)
    };

    return (
        <Flex
            w="50%"
            direction={"column"}
            alignItems="center"
            gap={deloitte_theme.gap}
            p={deloitte_theme.paddingX}
            border="1px solid"
            borderColor={deloitte_theme.primary}
            bgColor={deloitte_theme.white}
        >
            <Text w="full" textAlign="left" fontSize="md" fontWeight="semibold">
                Total Purchased/Self Retained RECs during AY Compliance Window:
                {" "}
                <Text as="span" fontSize="lg" color={deloitte_theme.ternary} fontWeight="bold" bg={deloitte_theme.primary} px={1} rounded="md">
                    {totalRecPurchased}
                </Text>
            </Text>

            {/* Previous history of REC purchasing */}
            <Flex
                direction="column"
                maxH="10rem"
                width="full"
                overflowY="auto"
                fontSize="sm"
                rounded="md"
                bgColor="gray.50"
                shadow="inner"
                pl={deloitte_theme.paddingY}
            >
                {
                    purchasedRECs?.data && purchasedRECs.data.length > 0 ?
                        purchasedRECs.data.map((rec, index) => (
                            <Box key={index} p={2} shadow="sm">
                                <Text>
                                    <Text as="span" fontWeight="bold">
                                        {rec.number_of_recs}
                                    </Text>{" "}
                                    RECs purchased on{" "}
                                    <Text as="span" fontStyle="italic">
                                        {new Date(rec.created_at).toLocaleDateString("en-GB")}
                                    </Text>
                                </Text>
                            </Box>
                        ))
                        : (
                            <Text color="gray.500" fontStyle="italic">
                                No RECs purchased yet.
                            </Text>
                        )
                }
            </Flex>

            {/* REC purchase form section */}
            {
                recButtonEnabled ?
                    <Button
                        width={"fit-content"}
                        backgroundColor={deloitte_theme.buttonPrimary}
                        color="white"
                        _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                        disabled={!selectedFY || shortfallAmount <= 0}
                        onClick={() => setRecButtonEnabled(!recButtonEnabled)}
                    >
                        Purchase RE Certificate
                    </Button>
                    :
                    <Flex direction={"column"} w="90%" gap={deloitte_theme.gap}>
                        <InputGroup>
                            <Input
                                type="integer"
                                placeholder="Amount (max target)"
                                value={recNumber}
                                onChange={(e) => setRecNumber(parseInt(e.target.value) || 0)}
                            />
                            <InputRightElement>
                                <Text fontSize="sm" color="gray.500">MWh</Text>
                            </InputRightElement>
                        </InputGroup>
                        <Input
                            type="date"
                            value={recDate}
                            onChange={(e) => setRecDate(e.target.value)}
                        />
                        <Button
                            backgroundColor={deloitte_theme.buttonPrimary}
                            color="white"
                            _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                            disabled={shortfallAmount <= 0 || recNumber <= 0 || recNumber > shortfallAmount}
                            onClick={handleRecSubmit}
                            isLoading={recBuying}
                        >
                            Submit Details
                        </Button>
                    </Flex>
            }
        </Flex>
    )
}

export default RECSection