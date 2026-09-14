import React, {useState, useMemo, lazy, Suspense, useEffect} from "react";
import {
    Flex,
    Heading,
    Button,
    Input,
    FormControl,
    FormLabel,
    Menu,
    MenuButton,
    MenuList,
    IconButton,
    Checkbox,
    Select,
} from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import { FaFilter } from "react-icons/fa";
import deloitte_theme from "../../../theme";
import { useGetPaymentAnalyticsQuery, useGetPaymentListQuery } from "../../../redux/apiSlices/paymentAnalyticsApi";
import SkeletonComponent from "../../../components/SkeletonComponent";
import StatusCard from "../../../components/StatusCard";
import { formatCurrency } from "../../../utils/formatter";
import {useSelector} from "react-redux";
import { useDebounce } from "../../../Hooks/useDebounceHook.js";

const ListView = lazy(() => import("./ListView"));
const GraphView = lazy(() => import('./GraphView'));

const DISPLAY_MAPS = {
    entityType: {
        DISCOM: "DISCOM",
        INDUSTRY: "OA/CPP",
        NOBE: "Non Obligated",
    },
    paymentMode: {
        NB: "NB",
        CC: "Credit Card",
        DC: "Debit Card",
        UPI: "UPI",
        OFFLINE: "Challan",
    },
    status: {
        SUCCESS: "Success",
        FAILED: "Failed",
        PENDING: "Pending",
        ABORTED: "Aborted",
    },
    paymentCategory: {
        REGISTRATION: "Registration",
        BUYOUT: "Buyout",
    },
};

const FILTER_OPTIONS = {
    entityType: Object.keys(DISPLAY_MAPS.entityType),
    paymentMode: Object.keys(DISPLAY_MAPS.paymentMode),
    status: Object.keys(DISPLAY_MAPS.status),
    paymentCategory: Object.keys(DISPLAY_MAPS.paymentCategory),
};

const SEARCH_OPTIONS = [
    { label: "Entity Name", value: "entity" },
    { label: "Username", value: "username" },
    { label: "Transaction ID", value: "txn_id" },
    { label: "Bank Ref No", value: "bank_ref" },
];

const FilterButtonGroup = ({ title, options, value, onSelect, labelMap }) => (
    <Flex direction="column" gap={2} w="full" px={deloitte_theme.paddingX} pt={deloitte_theme.paddingY}>
        <Heading size="sm">{title} :</Heading>
        <Flex gap={2} wrap="wrap">
            {options.map((opt) => (
                <Button
                    key={opt}
                    size="sm"
                    border="1px"
                    borderColor={deloitte_theme.primary}
                    bg={value === opt ? deloitte_theme.secondary : deloitte_theme.glassBackground}
                    color={deloitte_theme.white}
                    _hover={{ bg: deloitte_theme.buttonPrimary }}
                    onClick={() => onSelect(value === opt ? "all" : opt)}
                >
                    {labelMap?.[opt] || opt}
                </Button>
            ))}
        </Flex>
    </Flex>
);

const getFilterValue = (value) =>
    value && value !== "all" ? value : undefined;

const PaymentAnalytics = () => {
    const [selectedEntity, setSelectedEntity] = useState("");
    const [viewMode, setViewMode] = useState("graph");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentModeFilter, setPaymentModeFilter] = useState("all");
    const [entityTypeFilter, setEntityTypeFilter] = useState("all");
    const [paymentCategoryFilter, setPaymentCategoryFilter] = useState("all");
    const [stateFilter, setStateFilter] = useState("all");

    const [searchType, setSearchType] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const updateFilter = (setter, value) => {
        setter(value);
        setPage(1);
    };

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const queryParams = useMemo(() => ({
        entity_id: selectedEntity || undefined,
        entity_type: getFilterValue(entityTypeFilter),
        payment_mode: getFilterValue(paymentModeFilter),
        payment_status: getFilterValue(statusFilter),
        category: getFilterValue(paymentCategoryFilter),
        state_code: getFilterValue(stateFilter),
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search: debouncedSearchQuery.trim() || undefined,
        search_type: searchType || undefined,
        page,
        page_size: pageSize,
    }), [
        selectedEntity,
        entityTypeFilter,
        paymentModeFilter,
        statusFilter,
        paymentCategoryFilter,
        stateFilter,
        startDate,
        endDate,
        debouncedSearchQuery,
        searchType,
        page,
        pageSize,
    ]);

    const { data: listData, isFetching: isListFetching, isError: isListError, error: listError, refetch: listRefetch } = useGetPaymentListQuery(queryParams, { skip: viewMode !== 'list' });
    const { data: analytics,refetch: analyticsRefetch} = useGetPaymentAnalyticsQuery({
        entity_id: selectedEntity,
        start_date: startDate,
        end_date: endDate,
    });

    const payments = listData?.payments || [];
    const totalCount = listData?.total_count || 0;
    const totalPages = listData?.total_pages || 0;

    useEffect(() => {
        if (totalPages > 0 && page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const { states } = useSelector(state => state.commonState);

    const handleRefresh = () => {
        listRefetch();
        analyticsRefetch();
    };

    const handleResetFilters = () => {
        setSelectedEntity("");
        setStartDate("");
        setEndDate("");
        setStatusFilter("all");
        setPaymentModeFilter("all");
        setEntityTypeFilter("all");
        setPaymentCategoryFilter("all");
        setStateFilter("all");
        setSearchType("");
        setSearchQuery("");
        setPage(1);
    };
    useEffect(() => {
        setPage(1);
    }, [
        selectedEntity,
        entityTypeFilter,
        paymentModeFilter,
        statusFilter,
        paymentCategoryFilter,
        stateFilter,
        startDate,
        endDate,
        searchType,
        debouncedSearchQuery,
    ]);

    const renderSummaryCards = () => {
        if (!analytics) return null;
        const totalBuyoutAmount = analytics?.total_buyout_amount || 0;
        const totalRegistrationAmount = analytics?.total_amount - totalBuyoutAmount;

        return (
            <Flex w="full" gap={deloitte_theme.gap} wrap="wrap">
                <StatusCard
                    title="Total Entities"
                    value={analytics?.total_payments || 0}
                    helpText="Unique entities"
                />

                <StatusCard
                    title="Total Amount"
                    value={formatCurrency(analytics?.total_amount || 0)}
                    helpText={`Registration: ${formatCurrency(totalRegistrationAmount)} | Buyout: ${formatCurrency(totalBuyoutAmount)}`}
                    valueColor={deloitte_theme.ternary}
                />

                <StatusCard
                    title="Success Rate"
                    value={
                        analytics?.total_payments > 0
                            ? `${(
                                (analytics.success_count / analytics.total_payments) * 100
                            ).toFixed(1)}%`
                            : "0%"
                    }
                    helpText={`${analytics?.success_count || 0} entities`}
                    valueColor="green.500"
                />

                <StatusCard
                    title="Failed Payments"
                    value={analytics?.failed_count || 0}
                    helpText={
                        analytics?.total_payments > 0
                            ? `${(
                                (analytics.failed_count / analytics.total_payments) * 100
                            ).toFixed(1)}%`
                            : "0%"
                    }
                    valueColor="red.500"
                />
            </Flex>
        );
    };

    const renderFilter = () => (
        <Menu closeOnSelect={false}>
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

            <MenuList sx={deloitte_theme.glass} w="25rem" maxH="70vh" overflowY="auto">
                <FilterButtonGroup title="Entity Type" options={FILTER_OPTIONS.entityType} value={entityTypeFilter} onSelect={(v) => updateFilter(setEntityTypeFilter, v)} labelMap={DISPLAY_MAPS.entityType} />
                <FilterButtonGroup title="Payment Category" options={FILTER_OPTIONS.paymentCategory} value={paymentCategoryFilter} onSelect={(v) => updateFilter(setPaymentCategoryFilter, v)} labelMap={DISPLAY_MAPS.paymentCategory} />
                <FilterButtonGroup title="Payment Mode" options={FILTER_OPTIONS.paymentMode} value={paymentModeFilter} onSelect={(v) => updateFilter(setPaymentModeFilter, v)} labelMap={DISPLAY_MAPS.paymentMode} />
                <FilterButtonGroup title="Payment Status" options={FILTER_OPTIONS.status} value={statusFilter} onSelect={(v) => updateFilter(setStatusFilter, v)} labelMap={DISPLAY_MAPS.status} />

                {/* Date Range */}
                <Flex direction="column" gap={2} w="full" px={deloitte_theme.paddingX} pt={deloitte_theme.paddingY}>
                    <Heading size="sm">Date Range :</Heading>
                    <Flex gap={2} wrap="wrap">
                        <FormControl maxW="150px" size="sm">
                            <FormLabel fontSize="sm" color={deloitte_theme.white}>Start Date</FormLabel>
                            <Input type="date" size="sm" value={startDate} max={endDate || undefined} onChange={(e) => updateFilter(setStartDate, e.target.value)} borderColor={deloitte_theme.bordercolor} />
                        </FormControl>
                        <FormControl maxW="150px" size="sm">
                            <FormLabel fontSize="sm" color={deloitte_theme.white}>End Date</FormLabel>
                            <Input type="date" size="sm" value={endDate} min={startDate || undefined} onChange={(e) => updateFilter(setEndDate, e.target.value)} borderColor={deloitte_theme.bordercolor} />
                        </FormControl>
                    </Flex>
                </Flex>

                {/* State  */}
                <Flex direction="column" gap={2} w="full" px={deloitte_theme.paddingX} pt={deloitte_theme.paddingY}>
                    <Heading size="sm">State :</Heading>
                    <Select
                        size="sm"
                        value={stateFilter}
                        onChange={(e) => updateFilter(setStateFilter, e.target.value)}
                        borderColor={deloitte_theme.primary}
                        color={deloitte_theme.black}
                        bg={deloitte_theme.glassBackground}
                    >
                        <option value="all" style={{ color: "white", backgroundColor: "#2D3748" }}>
                            All States
                        </option>

                        {states?.map((state) => (
                            <option
                                key={state.state_code}
                                value={state.state_code}
                            >
                                {state.state_name} ({state.state_code})
                            </option>
                        ))}
                    </Select>
                </Flex>
                {/* Search */}
                <Flex direction="column" gap={2} w="full" px={deloitte_theme.paddingX} py={deloitte_theme.paddingY}>
                    <Heading size="sm">Search :</Heading>
                    <Flex gap={3} wrap="wrap">
                        {SEARCH_OPTIONS.map((opt) => (
                            <Checkbox
                                key={opt.value}
                                isChecked={searchType === opt.value}
                                onChange={() => { updateFilter(setSearchType, searchType === opt.value ? "" : opt.value); setSearchQuery(""); }}
                                size="sm"
                            >
                                {opt.label}
                            </Checkbox>
                        ))}
                    </Flex>
                    {searchType && (
                        <Input
                            mt={2}
                            size="sm"
                            bg="white"
                            color="black"
                            placeholder={`Search by ${SEARCH_OPTIONS.find(o => o.value === searchType)?.label || ""}...`}
                            value={searchQuery}
                            onChange={(e) => updateFilter(setSearchQuery, e.target.value)}
                            _placeholder={{ color: "gray.500" }}
                            _focus={{ borderColor: deloitte_theme.primary }}
                        />
                    )}
                </Flex>

                <Flex px={deloitte_theme.paddingX} pb={deloitte_theme.paddingY}>
                    <Button size="sm" variant="ghost" colorScheme="red" onClick={handleResetFilters}>
                        Reset All Filters
                    </Button>
                </Flex>
            </MenuList>
        </Menu>
    );

    return (
        <Flex direction="column" gap={deloitte_theme.gap}>
            <Flex
                justify="space-between"
                align="center"
                flexWrap="wrap"
            >
                <Heading size="md" color={deloitte_theme.textPrimary}>
                    Payment Analytics
                </Heading>

                <Flex direction="row" align="center" gap={deloitte_theme.gap}>
                    <IconButton
                        aria-label="Refresh Entities"
                        icon={<RepeatIcon />}
                        colorScheme="green"
                        isRound
                        boxShadow="md"
                        onClick={handleRefresh}
                        isLoading={isListFetching}
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

            {renderSummaryCards()}

            {viewMode === 'graph' ?
                <Suspense fallback={<SkeletonComponent />}>
                    <GraphView analytics={analytics} />
                </Suspense>
                :
                <Suspense fallback={<SkeletonComponent />}>
                    <ListView
                        payments={payments}
                        page={page}
                        pageSize={pageSize}
                        totalCount={totalCount}
                        totalPages={totalPages}
                        setPage={setPage}
                        setPageSize={setPageSize}
                        isLoading={isListFetching}
                        isError={isListError}
                        error={listError}
                    />
                </Suspense>
            }
        </Flex>
    );

};

export default PaymentAnalytics;
