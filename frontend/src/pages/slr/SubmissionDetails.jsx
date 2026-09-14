import { useState, useMemo } from "react";
import {
  Flex,
  Wrap,
  WrapItem,
  Button,
  Text,
  Box
} from "@chakra-ui/react";
import deloitte_theme from "../../theme";
import { useSelector } from "react-redux";
import { useSubmittedFormsQuery } from "../../redux/apiSlices/formApi";
import SubmittedFormsComponent from "../dashboards/SubmittedFormsComponent";

function SubmissionDetails() {
    const userDetails = useSelector((state) => state.login)
    const { financialYears, submissionPeriods } = useSelector((state) => state.commonState);
    const [selectedFY, setSelectedFY] = useState('');
    const entity_id = userDetails.entity_id;

    const { data: submittedForms = [] } = useSubmittedFormsQuery();
    const mappedSubmittedForms = useMemo(() => {
        if (!submissionPeriods || !submittedForms) return [];

        return submissionPeriods.filter(p => p.fy_id == selectedFY).map(period => {
            const match = submittedForms?.find(
                f => f.period_id === period.id && f.entity_id === entity_id && f.fy_id === selectedFY
            );

            return match
                ? match
                : {
                    id: null,
                    entity_id: entity_id,
                    entity_name: userDetails.org_name,
                    entity_type: null,
                    period_id: period.id,
                    fy_id: period.fy_id,
                    reg_no: userDetails.entity_registration_number,
                    state_code: null,
                    status: null,
                    updated_at: null,
                    created_by: null,
                    stage: null,
                    position: null
                };
        });
    }, [submittedForms, submissionPeriods, selectedFY, entity_id]);

    return (
        <Flex
            direction="column"
            gap={5}
            px={deloitte_theme.paddingX}
            py={deloitte_theme.paddingY}
        >
            {/* Forms ection */}
            <Flex direction="column" gap={4}>
                {/* Section Header : Contains - FY selector */}
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


                {/* List of Submitted forms */}
                {selectedFY ?
                    <SubmittedFormsComponent submittedForms={mappedSubmittedForms} selectedFY={selectedFY}/>
                    :
                    <Text fontSize="md" fontWeight="bold" color={deloitte_theme.textSecondary} mt={deloitte_theme.paddingX}>
                        Please select a Financial Year to view submitted forms.
                    </Text>
                }
            </Flex>
        </Flex >
    )
}

export default SubmissionDetails