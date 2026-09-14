import { useState, useMemo } from 'react';
import { Heading, Button, Flex, Box, Stack, Text, FormControl, FormLabel, Select, Divider, Badge } from '@chakra-ui/react';
import deloitte_theme from '../../theme';
import { useSelector } from 'react-redux';
import { useGetListedFirmsQuery, useGetRegisteredFirmsQuery, useRegisterFirmMutation } from '../../redux/apiSlices/entityDashboardApi';
import { useGetUserListQuery } from '../../redux/apiSlices/Admin/RbacApi';
import UserDetailCard from '../../components/UserDetailCard';
import { useFY } from '../../Hooks/useLookUp';
import AddUserForm from '../dashboards/AddUserForm';
import SkeletonComponent from '../../components/SkeletonComponent';
import TableComponent from '../../components/TableComponent';
import { motion } from 'framer-motion';
import { useGetMappedEntitiesListQuery, useGetAllEntitiesListQuery, useMapCorpChildEntityMutation } from '../../redux/apiSlices/corporate/corporateAPI';

function UserManagement() {
    const userDetails = useSelector(state => state.login);
    const isUser = userDetails?.role_code === 'USR';

    const { data: energyManagers = [], isLoading: energyManagersLoading } = useGetUserListQuery();
    const orderedEnergyManagers = useMemo(() => {
        const selfId = userDetails?.user_id;
        if (!energyManagers?.length || !selfId) return energyManagers;
        
        return [...energyManagers].sort((a, b) => {
            if (a.id === selfId) return -1;
            if (b.id === selfId) return 1;
            return 0;
        });
    }, [energyManagers, userDetails?.user_id]);

    const [viewFirmMapping, setViewFirmMapping] = useState(false);
    const [viewCorporateMapping, setViewCorporateMapping] = useState(false);
    const [showAddUserModal, setShowAddUserModal] = useState(false);

    const { data: registeredFirm = [] } = useGetRegisteredFirmsQuery(undefined, { skip: isUser });
    const { data: firmData = [] } = useGetListedFirmsQuery(undefined, { skip: isUser });

    const { financialYears } = useSelector((state) => state.commonState);
    const [selectedFY, setSelectedFY] = useState('');
    const [selectedCorpFY, setSelectedCorpFY] = useState('');

    const [selectedFirm, setSelectedFirm] = useState('');
    const [registerFirm, { isLoading: registering }] = useRegisterFirmMutation();

    const { data: mappedEntitiesList = [], isLoading: mappedEntitiesLoading } = useGetMappedEntitiesListQuery(undefined, { skip: isUser });

    const [selectedEntity, setSelectedEntity] = useState('');
    const { data: allEntitiesList = [] } = useGetAllEntitiesListQuery(undefined, { skip: isUser });

    const [mapEntity, { isLoading: mapping }] = useMapCorpChildEntityMutation();
    const mappingHandler = async () => {
        await mapEntity({ selected_entity_id: selectedEntity, fy_id: selectedCorpFY });
        setSelectedEntity('');
        setSelectedCorpFY('');
        setViewCorporateMapping();
    }

    const getFYname = useFY();

    const registeredFirmColumns = useMemo(() => [
        { name: 'firm_name', header: 'Firm Name', numeric: false, width: '200px', render: (row) => row.firm_name },
        { name: 'full_name', header: 'Firm Head Name', numeric: false, width: '200px', render: (row) => row.full_name || '-' },
        { name: 'address', header: 'Address', numeric: false, width: '300px', render: (row) => row.address },
        { name: 'fy', header: 'Financial Year', numeric: false, width: '150px', render: (row) => getFYname(row.fy || row.fy_id) },
    ], [getFYname]);

    return (
        <Flex direction="column" alignItems="center" gap={deloitte_theme.gap}>
            {/* Section for User Details */}
            <Flex w="full" direction="row" justifyContent="space-between" gap={deloitte_theme.gap}>
                <Heading as="h2"
                    fontSize="lg"
                    color={deloitte_theme.textPrimary}
                    pt={deloitte_theme.paddingX}
                >
                    User Details
                </Heading>
                {userDetails.role_code === "SLR" && (
                    <Button
                        fontWeight="semibold"
                        bg={deloitte_theme.buttonPrimary}
                        color="white"
                        px={deloitte_theme.paddingX}
                        py={deloitte_theme.paddingY}
                        _hover={{ bg: deloitte_theme.buttonHoverPrimary }}
                        onClick={() => setShowAddUserModal(true)}
                    >
                        Add Energy Manager
                    </Button>
                )}
            </Flex>

            <Divider borderColor="gray.400" />

            <Flex w="full" direction="row" justifyContent="start" alignItems="center" gap={deloitte_theme.gap}>
                {
                    energyManagersLoading ?
                        <SkeletonComponent />
                        :
                        orderedEnergyManagers
                            .map(user => (
                                <Flex key={user.id} direction="column" alignItems="flex-start" gap={2}>
                                    <UserDetailCard userDetails={user}/>
                                </Flex>
                            ))
                }
                {
                    energyManagers.length > 0 && orderedEnergyManagers.filter(user => user.id !== userDetails.user_id).length == 0 &&
                    <Box textAlign="center">
                        <Text fontSize="md">
                            No Energy Managers Found.
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                            Please add a Energy Manager to fill Compliance Form.
                        </Text>
                    </Box>
                }
            </Flex>

            {/* ------------------------------------------------------------------ */}

            {/* Section for Empanelled Energy Auditing Firm Registration */}
            {
                userDetails.role_code === "SLR" &&
                <Flex direction="column" w="full" gap={deloitte_theme.gap}>
                    <Flex justify="space-between" alignItems="end">
                        <Heading as="h2" size="md" color={deloitte_theme.textPrimary}>
                            Empanelled Energy Auditing Firm Details
                        </Heading>
                        <Button
                            backgroundColor={deloitte_theme.buttonPrimary}
                            color="white"
                            _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                            onClick={() => setViewFirmMapping(!viewFirmMapping)}
                        >
                            Map Audit Firm
                        </Button>
                    </Flex>

                    <Divider borderColor="gray.400" />

                    <Flex
                        w="full"
                        justifyContent="space-between"
                        gap={deloitte_theme.gap}
                        overflow="hidden"
                    >
                        <motion.div
                            animate={{ width: viewFirmMapping ? "69%" : "100%" }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="flex-shrink-0"
                        >
                            <Flex w="full" h="full">
                                <TableComponent
                                    name="List of Registered Empanelled Auditing Firms"
                                    config={registeredFirmColumns}
                                    data={registeredFirm}
                                />

                            </Flex>
                        </motion.div>

                        <motion.div
                            animate={{ width: viewFirmMapping ? "30%" : "0" }}
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
                                <FormControl w="fit-content" isRequired>
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
                                        maxW="200px"
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
                                        Empanelled Energy Auditing Firms</FormLabel>
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
                                        {firmData.map((firm) => (
                                            <option key={firm.firm_id} value={firm.firm_id}>
                                                {firm.firm_name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Button
                                    width="100%"
                                    onClick={() => registerFirm({ firm_id: selectedFirm, fy_id: selectedFY })}
                                    backgroundColor={deloitte_theme.buttonPrimary}
                                    color="black"
                                    _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                                    isLoading={registering}
                                    isDisabled={!selectedFirm || registering}
                                >
                                    Submit
                                </Button>
                            </Flex>
                        </motion.div>
                    </Flex>
                </Flex>
            }

            {/* ------------------------------------------------------------------ */}

            {/* Section for Corporate Entity mapping */}
            {
                userDetails.role_code === "SLR" &&
                <Flex direction="column" w="full" gap={deloitte_theme.gap}>
                    <Flex justify="space-between" alignItems="end">
                        <Heading as="h2" size="md" color={deloitte_theme.textPrimary}>
                            Corporate Entities Details
                        </Heading>
                        <Button
                            backgroundColor={deloitte_theme.buttonPrimary}
                            color="white"
                            _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                            onClick={() => setViewCorporateMapping(!viewCorporateMapping)}
                        >
                            Map Entity
                        </Button>
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
                                animate={{ width: viewCorporateMapping ? "69%" : "100%" }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                className="flex-shrink-0"
                            >
                                <Flex w="full">
                                    <TableComponent
                                        name="List of Associated Entities"
                                        data={mappedEntitiesList.map(entity => ({
                                            entity_name: entity.parent_entity_name,
                                            financial_year: getFYname(entity.fy_id),
                                            status: entity.status ?
                                                <p style={{ color: deloitte_theme.ternary }}>Approved</p>
                                                :
                                                <p style={{ color: deloitte_theme.textWarning }}>Pending</p>
                                            ,
                                            associated_at: new Date(entity.associated_at).toLocaleDateString("en-GB")
                                        }))}
                                    />
                                </Flex>
                            </motion.div>
                        }

                        {/* Add entity section */}
                        <motion.div
                            animate={{ width: viewCorporateMapping ? "30%" : "0" }}
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
                                        value={selectedCorpFY}
                                        onChange={(e) => setSelectedCorpFY(e.target.value)}
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
            }

            <AddUserForm isOpen={showAddUserModal} onClose={() => setShowAddUserModal(false)} />
        </Flex >
    );
}

export default UserManagement;
