import { useState } from 'react';
import {
    Flex,
    Button,
    Heading,
    Text,
    Wrap,
    WrapItem,
    IconButton,
    Select
} from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import deloitte_theme from '../../theme';
import { useSelector } from 'react-redux';
import {
    useGetFirmEntitiesQuery,
    useGetFirmAuditorsQuery,
    useMapEntityAuditorMutation,
    useApproveAuditorMutation,
    useRejectAuditorMutation
} from '../../redux/apiSlices/firmDashboardApi';
import SkeletonComponent from '../../components/SkeletonComponent';

function UserManagement() {
    const userDetails = useSelector((state) => state.login);
    const { financialYears } = useSelector(state => state.commonState);
    const [selectedFY, setSelectedFY] = useState(financialYears?.[0]?.id || '');

    const { data: entities = [], isLoading: isEntitiesLoading, refetch: refetchEntities } = useGetFirmEntitiesQuery({
        fy_id: selectedFY
    });

    const { data: auditors = [], isLoading: isAuditorsLoading, refetch: refetchAuditors } = useGetFirmAuditorsQuery();

    const handleRefetch = () => {
        refetchEntities();
        refetchAuditors();
    }

    const [mapEntityAuditor, { isLoading: mapping }] = useMapEntityAuditorMutation();
    const [selectedAuditorMap, setSelectedAuditorMap] = useState({});

    const [approveAuditor, { isLoading: approving }] = useApproveAuditorMutation();
    const [rejectAuditor, { isLoading: rejecting }] = useRejectAuditorMutation();

    return (
        <Flex direction="column" gap={deloitte_theme.gap}>
            {/* Financial Year Selection */}
            <Flex w="full" justifyContent="space-between" alignItems="center">
                <Flex direction="column" gap={4}>
                    <Text fontSize="md" fontWeight="bold" color={deloitte_theme.textPrimary} mb={2}>
                        Select Financial Year:
                    </Text>
                    <Wrap spacing={3}>
                        {financialYears?.map((fy) => (
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
                <IconButton
                    aria-label="Refresh"
                    icon={<RepeatIcon />}
                    onClick={handleRefetch}
                    colorScheme="green"
                    isRound
                    boxShadow="md"
                />
            </Flex>

            {/* Entities Mapping Section */}
            <Flex w="full" direction="column" gap={deloitte_theme.gap} mt={5}>
                <Flex alignItems="center" gap={4} wrap="wrap">
                    <Heading as="h2" fontSize="xl">
                        List of Entities Mapped to You:
                    </Heading>
                </Flex>
                {isEntitiesLoading && <SkeletonComponent />}
                <Flex w="90%" direction="column" p={deloitte_theme.paddingX} shadow="md">
                    {entities.length > 0 ? (
                        entities.map((entity, index) => (
                            <Flex
                                key={index}
                                bg={index % 2 ? "white" : "gray.100"}
                                gap={deloitte_theme.gap}
                                justifyContent="space-between"
                                p={deloitte_theme.paddingX}
                                alignItems="center"
                            >
                                <Flex direction="column">
                                    <Text fontSize="lg" fontWeight="bold" color={deloitte_theme.textPrimary}>
                                        {index + 1}. {entity.entity_name}
                                    </Text>
                                </Flex>

                                {entity.auditor_name ? (
                                    <Text ml={2} fontSize="md" fontWeight="semibold" color="green.500">
                                        Mapped to: {entity.auditor_name}
                                    </Text>
                                ) : (
                                    <Flex gap={deloitte_theme.gap}>
                                        <Select
                                            size="md"
                                            value={selectedAuditorMap[entity.entity_id] || ''}
                                            onChange={(e) =>
                                                setSelectedAuditorMap({
                                                    ...selectedAuditorMap,
                                                    [entity.entity_id]: e.target.value
                                                })
                                            }
                                            bg="white"
                                            borderColor="gray.300"
                                            _hover={{ borderColor: "gray.400" }}
                                            borderRadius="md"
                                        >
                                            <option value="">Select Accredited Energy Auditor</option>
                                            {auditors
                                                .filter(auditor => auditor.status === true)
                                                .map((auditor) => (
                                                    <option key={auditor.id} value={auditor.id}>
                                                        {auditor.aea_id} - {auditor.full_name}
                                                    </option>
                                                ))}
                                        </Select>
                                        <Button
                                            key={entity.entity_id}
                                            onClick={() =>
                                                mapEntityAuditor({
                                                    auditor_id: selectedAuditorMap[entity.entity_id],
                                                    entity_id: entity.entity_id,
                                                    fy_id: selectedFY
                                                })
                                            }
                                            backgroundColor={deloitte_theme.buttonPrimary}
                                            color="black"
                                            _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                                            isLoading={mapping}
                                            isDisabled={!selectedAuditorMap[entity.entity_id]}
                                        >
                                            Submit
                                        </Button>
                                    </Flex>
                                )}
                            </Flex>
                        ))
                    ) : (
                        <Text fontSize="md" fontWeight="semibold" color={deloitte_theme.textSecondary}>
                            No Entities Mapped
                        </Text>
                    )}
                </Flex>
            </Flex>

            {/* Auditors List */}
            <Flex w="full" direction="column" gap={deloitte_theme.gap} mt={4}>
                <Heading as="h2" fontSize="xl">
                    List of mapped Accredited Energy Auditors:
                </Heading>
                {isAuditorsLoading && <SkeletonComponent />}
                <Flex w="90%" direction="column" p={deloitte_theme.paddingX} shadow="md">
                    {auditors.length > 0 ? (
                        auditors.map((auditor, index) => (
                            <Flex
                                key={index}
                                bg={auditor.status ? deloitte_theme.primary : "white"}
                                gap={deloitte_theme.gap}
                                justifyContent="space-between"
                                p={deloitte_theme.paddingX}
                                alignItems="center"
                            >
                                <Flex gap={deloitte_theme.gap} alignItems="center">
                                    <Text fontSize="md" fontWeight="semibold" color={deloitte_theme.textSecondary}>
                                        {index + 1}.
                                    </Text>
                                    <Text fontSize="lg" fontWeight="bold" color={deloitte_theme.textPrimary}>
                                        {auditor.aea_id} - {auditor.full_name}
                                    </Text>
                                </Flex>
                                {auditor.status ? (
                                    <Button bg={deloitte_theme.buttonPrimary}>Approved</Button>
                                ) : (
                                    <Flex gap={2}>
                                        <Button
                                            onClick={() =>
                                                approveAuditor({
                                                    auditor_id: auditor.aea_id
                                                })
                                            }
                                            border="1px solid"
                                            borderColor={deloitte_theme.buttonPrimary}
                                            color="black"
                                            _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                                            isLoading={approving}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            variant="outline"
                                            border="1px solid"
                                            borderColor={deloitte_theme.buttonWarning}
                                            onClick={() =>
                                                rejectAuditor({
                                                    auditor_id: auditor.aea_id
                                                })
                                            }
                                            isLoading={rejecting}
                                        >
                                            Reject
                                        </Button>
                                    </Flex>
                                )}
                            </Flex>
                        ))
                    ) : (
                        <Text fontSize="lg" fontWeight="bold" color={deloitte_theme.textPrimary}>
                            No Auditor Mapped
                        </Text>
                    )}
                </Flex>
            </Flex>
        </Flex>
    );
}

export default UserManagement;
