import React from 'react'
import { Flex, Text, Wrap, WrapItem, Button } from '@chakra-ui/react'
import { useSelector } from 'react-redux';
import deloitte_theme from '../theme';

function FinancialYearFilter({selectedFY, setSelectedFY}) {
    const { financialYears } = useSelector((state) => state.commonState);
    return (
        <Flex gap={deloitte_theme.gap}>
            <Text fontSize="md" fontWeight="bold" color={deloitte_theme.textPrimary} mb={2}>
                Financial Year :
            </Text>

            <Wrap spacing={3}>
                {financialYears.map((fy) => (
                    <WrapItem key={fy.id}>
                        <Button
                            size="sm"
                            variant={selectedFY === fy.id ? "solid" : "outline"}
                            backgroundColor={selectedFY === fy.id ? deloitte_theme.buttonPrimary : "white"}
                            color={selectedFY === fy.id ? "black" : "gray.700"}
                            borderColor="gray.300"
                            _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                            onClick={() => setSelectedFY(fy.id)}
                        >
                            {fy.fy_code}
                        </Button>
                    </WrapItem>
                ))}
            </Wrap>
        </Flex>
    )
}

export default FinancialYearFilter