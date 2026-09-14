import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useFormActionMutation, useSubmittedFormsQuery, useGetSelectiveSubmissionDetailsQuery } from '../../redux/apiSlices/formApi';
import {
    Box,
    Button,
    Divider,
    Flex,
    Heading,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    IconButton,
    Select,
} from '@chakra-ui/react';
import { RepeatIcon } from "@chakra-ui/icons";
import { FaFilter } from "react-icons/fa"
import deloitte_theme from '../../theme';
import { useDispatch, useSelector } from 'react-redux';
import { setSubmittedFormDetails } from '../../redux/FormSlice';
import { getLabelForAcronym } from '../../constants/form_acronym';
import SkeletonComponent from '../../components/SkeletonComponent';

const SubmittedFormsComponent = lazy(() => import('../dashboards/SubmittedFormsComponent'));
const DashboardCharts = lazy(() => import('./DashboardCharts'));

function FormManager() {
    const dispatch = useDispatch();

    const { data: submittedForms = [], refetch: refetchSubmittedForms } = useSubmittedFormsQuery();
    const { data: selectiveSubmissionDetails = [], refetch: refetchFormDetails } = useGetSelectiveSubmissionDetailsQuery();

    const [submittedFormsWithDetails, setSubmittedFormsWithDetails] = useState([]);

    const [formAction] = useFormActionMutation();

    const userDetails = useSelector(state => state.login);
    const { states, financialYears } = useSelector(state => state.commonState);
    const [stateFilter, setStateFilter] = useState("all");
    const [entityTypeFilter, setEntityTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("0");
    const [fyFilter, setFyFilter] = useState("all");

    const availableStates = useMemo(() => {
        const stateSet = new Set(submittedForms.map(form => form.state_code));
        const filteredStates = states.filter(state => stateSet.has(state.state_code));
        return filteredStates;
    }, [states, submittedForms]);

    useEffect(() => {
        if (!submittedForms.length || !selectiveSubmissionDetails.length) return;

        // Convert details array to map for fast lookup
        // detailsMap: { [form_id]: { rco_target: value, compliance: value, ... } }
        const detailsMap = {};
        selectiveSubmissionDetails.forEach(item => {
            detailsMap[item.id] = item;
        });

        const merged = submittedForms.map(form => {
            const visibleAcronyms = getLabelForAcronym(form.entity_type);

            const details = detailsMap[form.id] || {};

            // Pick only required acronyms
            const filteredDetails = {};

            Object.entries(visibleAcronyms).forEach(([label, acronym]) => {
                if (acronym in details) {
                    filteredDetails[label] = details[acronym] ?? null;
                }
            });

            return {
                ...form,
                details: filteredDetails
            };
        });
        setSubmittedFormsWithDetails(merged);

    }, [submittedForms, selectiveSubmissionDetails]);

    const handleRefetch = () => {
        refetchSubmittedForms();
        refetchFormDetails();
    };

    const filteredList = submittedFormsWithDetails.filter(form => {
        if (entityTypeFilter !== "all" && form.entity_type !== entityTypeFilter)
            return false;
        if (stateFilter !== "all" && form.state_code !== stateFilter)
            return false;
        // if statusFilter is pending (0), show forms with stage equal to user role and is_closed != 0
        if (statusFilter === "0" && (form.is_closed != "0" || form.stage != userDetails?.role_code))
            return false;
        // if statusFilter is closed (1), show forms with is_closed = 1, if statusFilter is all, show all forms
        if (statusFilter === "1" && form.is_closed != "1")
            return false;
        if (fyFilter !== "all" && form.fy_id != fyFilter)
            return false;
        return true;
    })

    useEffect(() => {
        if (submittedForms.length > 0) {
            const forms = submittedForms.filter(form => form.is_closed == "0" && form.stage == userDetails?.role_code)
            dispatch(setSubmittedFormDetails(forms));
        }
    }, [userDetails?.role_code, submittedForms])

    return (
        <Flex direction="column" gap={deloitte_theme.gap}>
            {/* Heading section */}
            <Flex justifyContent="space-between" alignItems="center">
                <Heading size="md" color={deloitte_theme.textPrimary}>
                    Dashboard
                </Heading>
                <Flex direction="row" align="center" gap={deloitte_theme.gap}>
                    <IconButton
                        aria-label="Refresh Submitted Forms"
                        icon={<RepeatIcon />}
                        onClick={handleRefetch}
                        colorScheme="green"
                        isRound
                        boxShadow="md"
                    />
                    {/* Filter Button */}
                    <Menu>
                        <MenuButton
                            as={Button}
                            leftIcon={<FaFilter />}
                            border="1px"
                            borderColor={deloitte_theme.secondary}
                            color={deloitte_theme.black}
                            bg="transparent"
                            _hover={{ bg: deloitte_theme.secondary }}
                            _active={{ bg: deloitte_theme.secondary }}
                            borderRadius="md"
                            boxShadow="md"
                            fontSize="sm"
                        >
                            Filters
                        </MenuButton>
                        <MenuList sx={deloitte_theme.glass} w="25rem">
                            {/* Entity Type Filter */}
                            <Flex direction="column" gap={2} w="full" px={deloitte_theme.paddingX} pt={deloitte_theme.paddingY}>
                                <Heading size="sm">
                                    Entity Type :
                                </Heading>
                                <Flex gap={2} wrap="wrap">
                                    {[
                                        { label: "DISCOM", value: "DISCOM" },
                                        { label: "OA/CPP", value: "INDUSTRY" },
                                        { label: "Non Obligated", value: "NOBE" },
                                    ].map((opt) => (
                                        <Button
                                            key={opt.value}
                                            size="sm"
                                            border="1px"
                                            borderColor={deloitte_theme.primary}
                                            bg={
                                                entityTypeFilter === opt.value
                                                    ? deloitte_theme.secondary // active
                                                    : deloitte_theme.glassBackground // inactive
                                            }
                                            color={deloitte_theme.white}
                                            _hover={{ bg: deloitte_theme.buttonPrimary }}
                                            onClick={() =>
                                                setEntityTypeFilter(
                                                    entityTypeFilter === opt.value ? "all" : opt.value
                                                )
                                            }
                                        >
                                            {opt.label}
                                        </Button>
                                    ))}
                                </Flex>
                            </Flex>
                            {/* State Filter */}
                            <Flex direction="column" gap={2} w="full" px={deloitte_theme.paddingX} pt={deloitte_theme.paddingY}>
                                <Heading size="sm">
                                    State :
                                </Heading>
                                <Flex gap={2} wrap="wrap">
                                    <Select
                                        name="state_code"
                                        value={stateFilter}
                                        onMouseDown={(e) => e.stopPropagation()} // prevent Menu from closing
                                        onChange={(e) =>
                                            setStateFilter(e.target.value || "all")
                                        }
                                        placeholder="Select State"
                                        borderColor={deloitte_theme.primary}
                                        color={deloitte_theme.black}
                                        bg={deloitte_theme.glassBackground}
                                    >
                                        <option value="all">All</option>
                                        {availableStates?.map((opt) => (
                                            <option key={opt.state_code} value={opt.state_code}>
                                                {opt.state_name} ({opt.state_code})
                                            </option>
                                        ))}
                                    </Select>
                                </Flex>
                            </Flex>
                            {/* Status Filter */}

                            <Flex direction="column" gap={2} w="full" px={deloitte_theme.paddingX} pt={deloitte_theme.paddingY}>
                                <Heading size="sm">
                                    Status :
                                </Heading>
                                <Flex gap={2} wrap="wrap">
                                    {[
                                        { label: "Pending", value: "0" },
                                        { label: "Closed", value: "1" },
                                    ].map((opt) => (
                                        <Button
                                            key={opt.value}
                                            size="sm"
                                            border="1px"
                                            borderColor={deloitte_theme.primary}
                                            bg={
                                                statusFilter === opt.value
                                                    ? deloitte_theme.secondary // active
                                                    : deloitte_theme.glassBackground // inactive
                                            }
                                            color={deloitte_theme.white}
                                            _hover={{ bg: deloitte_theme.buttonPrimary }}
                                            onClick={() =>
                                                setStatusFilter(
                                                    statusFilter === opt.value ? "all" : opt.value
                                                )
                                            }
                                        >
                                            {opt.label}
                                        </Button>
                                    ))}
                                </Flex>
                            </Flex>
                            {/* FY Filter */}

                            <Flex direction="column" gap={2} w="full" px={deloitte_theme.paddingX} py={deloitte_theme.paddingY}>
                                <Heading size="sm">
                                    Financial Year :
                                </Heading>
                                <Flex gap={2} wrap="wrap">
                                    {financialYears?.map((opt) => (
                                        <Button
                                            key={opt.id}
                                            size="sm"
                                            border="1px"
                                            borderColor={deloitte_theme.primary}
                                            bg={
                                                fyFilter === opt.id
                                                    ? deloitte_theme.secondary // active
                                                    : deloitte_theme.glassBackground // inactive
                                            }
                                            color={deloitte_theme.white}
                                            _hover={{ bg: deloitte_theme.buttonPrimary }}
                                            onClick={() =>
                                                setFyFilter(
                                                    fyFilter === opt.id ? "all" : opt.id
                                                )
                                            }
                                        >
                                            {opt.fy_code}
                                        </Button>
                                    ))}
                                </Flex>
                            </Flex>
                        </MenuList>
                    </Menu>
                </Flex>
            </Flex>

            <Flex direction='column' h='63vh' gap={deloitte_theme.gap} overflowY="auto" >
                {/* Charts Section */}
                <Suspense fallback={<SkeletonComponent />}>
                    <DashboardCharts data={submittedForms} states={states} />
                </Suspense>

                <Divider borderColor="gray.400" mt={deloitte_theme.paddingX} mb={deloitte_theme.paddingX} />

                {/* Body section */}
                <Suspense fallback={<SkeletonComponent />}>
                    <Flex w="100%" direction="column" gap={deloitte_theme.gap}>
                        <Heading fontSize="xl" color={deloitte_theme.textPrimary}>List of Submitted Forms</Heading>
                        <SubmittedFormsComponent submittedForms={filteredList} formAction={formAction} />
                    </Flex>
                </Suspense>
            </Flex>
        </Flex>
    )
}

export default FormManager