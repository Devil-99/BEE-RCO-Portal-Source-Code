import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
    Button,
    Checkbox,
    Flex,
    Heading,
    IconButton,
    Input,
    Menu,
    MenuButton,
    MenuList,
    Select,
} from '@chakra-ui/react';
import { RepeatIcon } from "@chakra-ui/icons";
import { FaFilter } from "react-icons/fa"
import { useSubmittedFormsQuery, useGetSelectiveSubmissionDetailsQuery } from '../../../redux/apiSlices/formApi';
import { useGetRolesQuery } from '../../../redux/apiSlices/Admin/RbacApi';
import deloitte_theme from '../../../theme';
import { useDispatch, useSelector } from 'react-redux';
import { setSubmittedFormDetails } from '../../../redux/FormSlice';
import { getLabelForAcronym } from '../../../constants/form_acronym';
import { useDebounce } from '../../../Hooks/useDebounceHook';
import SkeletonComponent from '../../../components/SkeletonComponent';
import StatusCard from '../../../components/StatusCard';

const ListView = lazy(() => import('./ListView'));
const GraphView = lazy(() => import('./GraphView'));

const getFilterValue = (value) =>
    value && value !== "all" ? value : undefined;

const DISPLAY_MAPS = {
    entityType: {
        DISCOM: "DISCOM",
        INDUSTRY: "OA/CPP",
        NOBE: "Non Obligated",
    },
    status: {
        0: "Pending",
        1: "Closed",
    },
};

const FILTER_OPTIONS = {
    entityType: Object.keys(DISPLAY_MAPS.entityType),
    status: Object.keys(DISPLAY_MAPS.status),
};

const SEARCH_OPTIONS = [
    {
        label: "PAT Number",
        value: "pat",
    },
    {
        label: "Entity Name",
        value: "entity",
    },
];

const FilterButtonGroup = ({
    title,
    options,
    value,
    onSelect,
    labelMap,
}) => (
    <Flex
        direction="column"
        gap={2}
        w="full"
        px={deloitte_theme.paddingX}
        pt={deloitte_theme.paddingY}
    >
        <Heading size="sm">{title} :</Heading>

        <Flex gap={2} wrap="wrap">
            {options.map((opt) => (
                <Button
                    key={opt}
                    size="sm"
                    border="1px"
                    borderColor={deloitte_theme.primary}
                    bg={
                        value === opt
                            ? deloitte_theme.secondary
                            : deloitte_theme.glassBackground
                    }
                    color={deloitte_theme.white}
                    _hover={{
                        bg: deloitte_theme.buttonPrimary,
                    }}
                    onClick={() =>
                        onSelect(value === opt ? "all" : opt)
                    }
                >
                    {labelMap?.[opt] || opt}
                </Button>
            ))}
        </Flex>
    </Flex>
);
function FormDashboard() {
    const dispatch = useDispatch();

    const { data: submittedForms = [], refetch: refetchSubmittedForms } = useSubmittedFormsQuery();

    const { data: roles = [] } = useGetRolesQuery();

    const [viewMode, setViewMode] = useState("graph");

    const userDetails = useSelector(state => state.login);
    const { states, financialYears } = useSelector(state => state.commonState);

    const [stateFilter, setStateFilter] = useState("all");
    const [entityTypeFilter, setEntityTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("0");
    const [fyFilter, setFyFilter] = useState("all");
    const [stageFilter, setStageFilter] = useState("all");

    const [searchType, setSearchType] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const debouncedSearchQuery = useDebounce(searchQuery, 400);

    const stageOptions = useMemo(() => {
        if (!roles.length) return [];
        return roles
            .filter(role => role.is_stage)
            .map(role => role.role_code);
    }, [roles]);

    const [refreshing, setRefreshing] = useState(false);

    const handleResetFilters = () => {
        setEntityTypeFilter("all");
        setStateFilter("all");
        setStatusFilter("0");
        setFyFilter("all");
        setStageFilter("all");
        setSearchType("");
        setSearchQuery("");
        setPage(1);
    };
    const updateFilter = (setter, value) => {
        setter(value);
        setPage(1);
    };

    const queryParams = useMemo(
        () => ({
            entity_type: getFilterValue(entityTypeFilter),
            state_code: getFilterValue(stateFilter),
            status: getFilterValue(statusFilter),
            fy_id: getFilterValue(fyFilter),
            stage: getFilterValue(stageFilter),
            search: debouncedSearchQuery.trim() || undefined,
            search_type: searchType || undefined,
            page,
            page_size: rowsPerPage,
        }),
        [
            entityTypeFilter,
            stateFilter,
            statusFilter,
            fyFilter,
            stageFilter,
            searchType,
            debouncedSearchQuery,
            page,
            rowsPerPage,
        ]
    );
    const { data: selectiveSubmissionDetails = [], refetch: refetchFormDetails } = useGetSelectiveSubmissionDetailsQuery();
    const { data: pagedResponse = {}, isFetching: listFetching, refetch: refetchPagedForms } = useSubmittedFormsQuery(
        queryParams,
        { skip: viewMode !== 'list', keepPreviousData: true }
    );

    const exportParams = useMemo(() => {
        const { page: _page, page_size: _pageSize, ...rest } = queryParams;
        return rest;
    }, [queryParams]);

    const { data: exportFormsRaw = [] } = useSubmittedFormsQuery(
        exportParams,
        { skip: viewMode !== 'list' }
    );

    const exportForms = useMemo(() => {
        if (!exportFormsRaw.length) return [];

        const detailsMap = {};
        selectiveSubmissionDetails.forEach(item => {
            detailsMap[item.id] = item;
        });

        return exportFormsRaw.map(form => {
            const visibleAcronyms = getLabelForAcronym(form.entity_type);

            const details = detailsMap[form.id] || {};

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
    }, [exportFormsRaw, selectiveSubmissionDetails]);

    const pagedForms = pagedResponse?.items || [];
    const totalCount = pagedResponse?.total ?? 0;
    const totalPages = pagedResponse?.total_pages ?? 0;

    const filteredList = useMemo(() => {
        if (!pagedForms.length) return [];

        const detailsMap = {};
        selectiveSubmissionDetails.forEach(item => {
            detailsMap[item.id] = item;
        });

        return pagedForms.map(form => {
            const visibleAcronyms = getLabelForAcronym(form.entity_type);

            const details = detailsMap[form.id] || {};

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
    }, [pagedForms, selectiveSubmissionDetails]);

    const handleRefetch = async () => {
        setRefreshing(true);

        try {
            await Promise.all([
                refetchSubmittedForms(),
                refetchPagedForms(),
                refetchFormDetails(),
            ]);
        } finally {
            setRefreshing(false);
        }
    };
    useEffect(() => {
        if (totalPages > 0 && page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const kpis = useMemo(() => {
        const total = submittedForms.length;
        const approved = submittedForms.filter(f => f.is_closed == 1).length;
        const pending = total - approved;
        return { total, approved, pending };
    }, [submittedForms]);

    // For notification modal
    useEffect(() => {
        if (submittedForms.length > 0) {
            const forms = submittedForms.filter(form => form.is_closed == "0" && form.stage === userDetails?.role_code)
            dispatch(setSubmittedFormDetails(forms));
        }
    }, [userDetails?.role_code, submittedForms])

    const renderFilter = () => (
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
                <FilterButtonGroup
                    title="Entity Type"
                    options={FILTER_OPTIONS.entityType}
                    value={entityTypeFilter}
                    onSelect={(v) => updateFilter(setEntityTypeFilter, v)}
                    labelMap={DISPLAY_MAPS.entityType}
                />
                <Flex direction="column" gap={2} w="full" px={deloitte_theme.paddingX} pt={deloitte_theme.paddingY}>
                    <Heading size="sm">State :</Heading>
                    <Flex gap={2} wrap="wrap">
                        <Select
                            name="state_code"
                            value={stateFilter}
                            onMouseDown={(e) => e.stopPropagation()}
                            onChange={(e) =>
                                updateFilter(setStateFilter, e.target.value)
                            }
                            placeholder="Select State"
                            borderColor={deloitte_theme.primary}
                            color={deloitte_theme.black}
                            bg={deloitte_theme.glassBackground}
                        >
                            <option value="all">All</option>
                            {states?.map((opt) => (
                                <option key={opt.state_code} value={opt.state_code}>
                                    {opt.state_name} ({opt.state_code})
                                </option>
                            ))}
                        </Select>
                    </Flex>
                </Flex>
                <FilterButtonGroup
                    title="Stage"
                    options={stageOptions}
                    value={stageFilter}
                    onSelect={(v) => updateFilter(setStageFilter, v)}
                />
                <FilterButtonGroup
                    title="Status"
                    options={FILTER_OPTIONS.status}
                    value={statusFilter}
                    onSelect={(v) => updateFilter(setStatusFilter, v)}
                    labelMap={DISPLAY_MAPS.status}
                />
                <Flex direction="column" gap={2} w="full" px={deloitte_theme.paddingX} py={deloitte_theme.paddingY}>
                    <Heading size="sm">Financial Year :</Heading>
                    <Flex gap={2} wrap="wrap">
                        {financialYears?.map((opt) => (
                            <Button
                                key={opt.id}
                                size="sm"
                                border="1px"
                                borderColor={deloitte_theme.primary}
                                bg={
                                    fyFilter === opt.id
                                        ? deloitte_theme.secondary
                                        : deloitte_theme.glassBackground
                                }
                                color={deloitte_theme.white}
                                _hover={{ bg: deloitte_theme.buttonPrimary }}
                                onClick={() =>
                                    updateFilter(
                                        setFyFilter,
                                        fyFilter === opt.id ? "all" : opt.id
                                    )
                                }
                            >
                                {opt.fy_code}
                            </Button>
                        ))}
                    </Flex>
                    <Flex
                        direction="column"
                        gap={2}
                        w="full"
                        py={deloitte_theme.paddingY}
                    >
                        <Heading size="sm">Search :</Heading>
                        <Flex gap={4}>
                            {SEARCH_OPTIONS.map((opt) => (
                                <Checkbox
                                    key={opt.value}
                                    isChecked={searchType === opt.value}
                                    onChange={() => {
                                        updateFilter(
                                            setSearchType,
                                            searchType === opt.value ? "" : opt.value
                                        );
                                        setSearchQuery("");
                                    }}
                                >
                                    {opt.label}
                                </Checkbox>
                            ))}
                        </Flex>

                        {searchType && (
                            <Input
                                size="sm"
                                bg="white"
                                color="black"
                                placeholder={
                                    searchType === "pat"
                                        ? "Search by PAT Number..."
                                        : "Search by Entity Name..."
                                }
                                value={searchQuery}
                                onChange={(e) =>
                                    updateFilter(setSearchQuery, e.target.value)
                                }
                                _placeholder={{ color: "gray.500" }}
                                _focus={{ borderColor: deloitte_theme.primary }}
                            />
                        )}
                    </Flex>
                    <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={handleResetFilters}
                    >
                        Reset All Filters
                    </Button>
                </Flex>
            </MenuList>
        </Menu>
    );

    return (
        <Flex direction="column" gap={deloitte_theme.gap}>
            <Flex justifyContent="space-between" alignItems="center">
                <Heading size="md" color={deloitte_theme.textPrimary}>
                    Dashboard
                </Heading>
                <Flex direction="row" align="center" gap={deloitte_theme.gap}>
                    <IconButton
                        aria-label="Refresh Submitted Forms"
                        icon={<RepeatIcon />}
                        onClick={handleRefetch}
                        isLoading={refreshing}
                        colorScheme="green"
                        isRound
                        boxShadow="md"
                    />
                    {viewMode === 'list' && renderFilter()}
                    <Button
                        size="md"
                        bg={viewMode === 'graph' ? deloitte_theme.secondary : deloitte_theme.white}
                        color={viewMode === 'graph' ? deloitte_theme.white : deloitte_theme.black}
                        border="1px solid"
                        borderColor={deloitte_theme.secondary}
                        onClick={() => setViewMode('graph')}
                        _hover={{
                            bg: viewMode === 'graph' ? deloitte_theme.secondary : deloitte_theme.primary
                        }}
                    >
                        Graph View
                    </Button>
                    <Button
                        size="md"
                        bg={viewMode === 'list' ? deloitte_theme.secondary : deloitte_theme.white}
                        color={viewMode === 'list' ? deloitte_theme.white : deloitte_theme.black}
                        border="1px solid"
                        borderColor={deloitte_theme.secondary}
                        onClick={() => setViewMode('list')}
                        _hover={{
                            bg: viewMode === 'list' ? deloitte_theme.secondary : deloitte_theme.primary
                        }}
                    >
                        List View
                    </Button>
                </Flex>
            </Flex>

            <Flex w="full" gap={deloitte_theme.gap} wrap="wrap">
                <StatusCard title="Total Submissions" value={kpis.total} helpText="All submitted forms" />
                <StatusCard title="Total Approved" value={kpis.approved} helpText="Closed forms" valueColor="green.500" />
                <StatusCard title="Total Pending" value={kpis.pending} helpText="Open forms" valueColor="orange.500" />
            </Flex>

            {viewMode === 'graph' ? (
                <Suspense fallback={<SkeletonComponent />}>
                    <GraphView submittedForms={submittedForms} states={states} />
                </Suspense>
            ) : (
                <Suspense fallback={<SkeletonComponent />}>
                    <ListView
                        filteredList={filteredList}
                        page={page}
                        pageSize={rowsPerPage}
                        totalCount={totalCount}
                        totalPages={totalPages}
                        setPage={setPage}
                        setPageSize={setRowsPerPage}
                        isFetching={listFetching}
                        exportRows={exportForms}
                    />
                </Suspense>
            )}
        </Flex>
    )
}

export default FormDashboard
