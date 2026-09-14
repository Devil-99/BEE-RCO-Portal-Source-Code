import { Flex, Heading, FormControl, FormLabel, Select, Button } from '@chakra-ui/react'
import deloitte_theme from '../../theme'
import TableComponent from '../../components/TableComponent'
import { useGetAeaEntitiesQuery, useGetAeaMappedFirmsQuery, useGetAllFirmsQuery, useMapAuditorFirmMutation } from '../../redux/apiSlices/aeaDashboardApi'
import { useState } from 'react'
import { useFY } from '../../Hooks/useLookUp'
import SkeletonComponent from '../../components/SkeletonComponent'

function Management() {
    const { data: entities = [], isLoading: entitiesLoading } = useGetAeaEntitiesQuery();
    const { data: mappedFirms = [], isLoading: mappedFirmsLoading } = useGetAeaMappedFirmsQuery();
    const { data: allFirms = [] } = useGetAllFirmsQuery();
    const getFYname = useFY();

    const [selectedFirm, setSelectedFirm] = useState('');
    const [mapAuditorFirm, { isLoading: mappingFirm }] = useMapAuditorFirmMutation();

    const handleFirmSelection = async () => {
        if (!selectedFirm) return;
        try {
            await mapAuditorFirm({
                firm_id: selectedFirm
            }).unwrap();
            setSelectedFirm('');
        } catch (error) {
            console.error("Error mapping firm", error);
        }
    };

    const mappedEntitiesColumns = [
        { header: 'Registration No', name: 'entity_reg_no', numeric: true, width: '300px', render: (row) => row.entity_reg_no },
        { header: 'Organization Name', name: 'entity_name', numeric: true, width: '300px', render: (row) => row.entity_name },
        { header: 'Entity Type', name: 'entity_type', numeric: true, width: '300px', render: (row) => row.entity_type },
        { header: 'Financial Year ID', name: 'fy_id', numeric: true, width: '150px', render: (row) => getFYname(row.fy || row.fy_id) }
    ];

    return (
        <Flex
            direction="column"
            gap={5}
            px={deloitte_theme.paddingX}
            py={deloitte_theme.paddingY}
        >
            {/* Mapped Entities Section */}
            <Flex w="full" direction="column" justifyContent="center" alignItems="center" gap={deloitte_theme.gap}>
                {
                    entitiesLoading ?
                        <SkeletonComponent />
                        :
                        <TableComponent
                            name="List of Mapped Entities"
                            data={entities}
                            config={mappedEntitiesColumns}
                        />
                }
            </Flex>

            {/* Mapped Audit Firm Section */}
            <Flex w="full" gap={deloitte_theme.gap} justifyContent="space-evenly" alignItems="center">
                {
                    mappedFirmsLoading ?
                        <SkeletonComponent />
                        :
                        <TableComponent
                            name="Mapped Empanelled Energy Auditing Firms"
                            data={mappedFirms.map(firm => ({
                                firm_name: firm.firm_name,
                                status: firm.status ? "Approved" : "Pending"
                            }))}
                        />
                }
                <Flex
                    direction="column"
                    justifyContent="center"
                    alignItems="center"
                    gap={deloitte_theme.gap}
                    bg="white"
                    w="full"
                    p={deloitte_theme.paddingX}
                >
                    <FormControl isRequired>
                        <FormLabel fontSize="lg" fontWeight="medium">Audit Firms</FormLabel>
                        <Select
                            size="sm"
                            value={selectedFirm}
                            onChange={(e) => setSelectedFirm(e.target.value)}
                            bg="white"
                            borderColor="gray.300"
                            _hover={{ borderColor: "gray.400" }}
                            borderRadius="md"
                        >
                            <option value="">Select Empanelled Energy Auditing Firm</option>
                            {allFirms.map((firm) => (
                                <option key={firm.firm_id} value={firm.firm_id}>
                                    {firm.firm_name}
                                </option>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        width="100%"
                        onClick={handleFirmSelection}
                        backgroundColor={deloitte_theme.buttonPrimary}
                        color="black"
                        _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                        isLoading={mappingFirm}
                        isDisabled={!selectedFirm}
                    >
                        Submit
                    </Button>
                </Flex>
            </Flex>
        </Flex>
    )
}

export default Management