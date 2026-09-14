import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
    useGetMappedEntitiesListQuery,
    useGetAllEntitiesListQuery,
    useMapCorpChildEntityMutation,
    useCorpMappingRequestActionMutation
} from '../../redux/apiSlices/corporate/corporateAPI';
import { useFY } from '../../Hooks/useLookUp';

import { Divider, Flex, Heading, FormControl, FormLabel, Select, Button, Text, IconButton } from '@chakra-ui/react';
import { RepeatIcon } from "@chakra-ui/icons";
import TableComponent from '../../components/TableComponent';
import SkeletonComponent from '../../components/SkeletonComponent';
import deloitte_theme from '../../theme';
import ConfirmModal from '../../components/ConfirmModal'
import { motion } from "framer-motion";

function Management() {
    const { data: mappedEntitiesList = [], isLoading: mappedEntitiesLoading, refetch: refetchMappedEntities } = useGetMappedEntitiesListQuery();
    const [viewMapping, setViewMapping] = useState(false);

    const getFyCode = useFY();

    const { financialYears } = useSelector((state) => state.commonState);
    const [selectedFY, setSelectedFY] = useState('');

    const [selectedEntity, setSelectedEntity] = useState('');
    const { data: allEntitiesList = [], refetch: refetchAllEntities } = useGetAllEntitiesListQuery();

    const [mapEntity, { isLoading: mapping }] = useMapCorpChildEntityMutation();
    const mappingHandler = async () => {
        await mapEntity({ selected_entity_id: selectedEntity, fy_id: selectedFY });
        setSelectedEntity('');
        setSelectedFY('');
        setViewMapping();
    }

    const handleRefetch = () => {        // Refetch both queries to get the updated data
        refetchMappedEntities();
        refetchAllEntities();
    }

    const [selectedRow, setSelectedRow] = useState('');
    const [actionType, setActionType] = useState('');
    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [requestAction, { isLoading: actionPerforming }] = useCorpMappingRequestActionMutation();
    const handleActionSelection = (id, action) => {
        setSelectedRow(id);
        setActionType(action);
        setOpenConfirmModal(true);
    }

    const actionHandler = async () => {
        await requestAction({
            mapping_id: selectedRow,
            action: actionType
        });
        setOpenConfirmModal(false);
    }


    const corporateMappingConfig = [
        {
            name: 'entity_name',
            header: 'Entity Name',
            numeric: false,
            render: (row) => row.child_entity_name,
        },
        {
            name: 'financial_year',
            header: 'Financial Year',
            numeric: true,
            render: (row) => getFyCode(row.fy_id),
        },
        {
            name: 'associated_at',
            header: 'Mapped On',
            numeric: true,
            render: (row) => {
                if (!row?.associated_at) return 'N/A';
                const d = new Date(row.associated_at);
                return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString("en-GB");
            },
        },
        {
            name: 'status',
            header: 'Status',
            numeric: true,
            render: (row) => (row.status ?
                <Text color={deloitte_theme.ternary}>Approved</Text>
                :
                <Flex justifyContent="space-evenly">
                    <Button
                        w={20}
                        h="fit-content"
                        py="0.5rem"
                        bg={deloitte_theme.buttonPrimary}
                        _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                        onClick={() => handleActionSelection(row.id, "approve")}
                    >
                        Approve
                    </Button>
                    <Button
                        w={20}
                        h="fit-content"
                        py="0.5rem"
                        _hover={{ backgroundColor: deloitte_theme.buttonWarning, color: "white" }}
                        onClick={() => handleActionSelection(row.id, "reject")}
                    >
                        Reject
                    </Button>
                </Flex>
            ),
        },
    ]

    return (
        <>
            <Flex direction="column" gap={deloitte_theme.gap}>
                <Flex justify="space-between">
                    <Heading as="h2" size="md">
                        Entities Mapping
                    </Heading>
                    <Flex gap={deloitte_theme.gap}>
                        <IconButton
                            aria-label="Refresh"
                            icon={<RepeatIcon />}
                            onClick={handleRefetch}
                            colorScheme="green"
                            isRound
                            boxShadow="md"
                        />
                        <Button
                            backgroundColor={deloitte_theme.buttonPrimary}
                            color="white"
                            _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                            onClick={() => setViewMapping(!viewMapping)}
                        >
                            Map Entity
                        </Button>
                    </Flex>
                </Flex>
                <Divider />

                <Flex
                    w="full"
                    justifyContent="space-between"
                    gap={deloitte_theme.gap}
                    overflow="hidden"
                >
                    {/* Entities List section */}
                    {mappedEntitiesLoading ? <SkeletonComponent /> :
                        <motion.div
                            animate={{ width: viewMapping ? "69%" : "100%" }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="flex-shrink-0"
                        >
                            <Flex w="full">
                                <TableComponent
                                    name="List of Associated Entities"
                                    config={corporateMappingConfig}
                                    data={mappedEntitiesList}
                                />
                            </Flex>
                        </motion.div>
                    }

                    {/* Add entity section */}
                    <motion.div
                        animate={{ width: viewMapping ? "30%" : "0" }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                        <Flex
                            direction="column"
                            gap={deloitte_theme.gap}
                            p={deloitte_theme.paddingX}
                            bg="white"
                            border="1px solid"
                            borderColor={deloitte_theme.bordercolor}
                            rounded="md"
                        >
                            <FormControl isRequired>
                                <FormLabel
                                    fontSize="lg"
                                    fontWeight="medium"
                                    w="20rem"
                                    overflow="hidden"
                                >
                                    Financial Year
                                </FormLabel>
                                <Select
                                    w="fit-content"
                                    bg="white"
                                    borderColor="gray.300"
                                    _hover={{ borderColor: "gray.400" }}
                                    size="sm"
                                    borderRadius="md"
                                    value={selectedFY}
                                    onChange={(e) => setSelectedFY(e.target.value)}
                                    placeholder="Select FY"
                                >
                                    {financialYears.map((fy) => (
                                        <option key={fy.id} value={fy.id}>{fy.fy_code}</option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel
                                    fontSize="lg"
                                    fontWeight="medium"
                                    w="20rem"
                                    overflow="hidden"
                                >
                                    Registered Entities
                                </FormLabel>
                                <Select
                                    size="sm"
                                    value={selectedEntity}
                                    onChange={(e) => setSelectedEntity(e.target.value)}
                                    bg="white"
                                    borderColor="gray.300"
                                    _hover={{ borderColor: "gray.400" }}
                                    borderRadius="md"
                                >
                                    <option value="">Select Entity</option>
                                    {allEntitiesList.map((entity) => (
                                        <option key={entity.id} value={entity.id}>
                                            {entity.org_name}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <Button
                                width="100%"
                                backgroundColor={deloitte_theme.buttonPrimary}
                                color="black"
                                _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                                isLoading={mapping}
                                isDisabled={!selectedEntity || mapping}
                                onClick={mappingHandler}
                            >
                                Submit
                            </Button>
                        </Flex>
                    </motion.div>
                </Flex>
            </Flex>
            <ConfirmModal
                isOpen={openConfirmModal}
                onClose={() => setOpenConfirmModal(false)}
                onConfirm={actionHandler}
                isLoading={actionPerforming}
            />
        </>
    )
}

export default Management