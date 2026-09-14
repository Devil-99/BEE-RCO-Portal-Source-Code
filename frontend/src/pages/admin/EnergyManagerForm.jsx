import { useState, useMemo, useEffect } from "react";
import {
    Flex,
    Heading,
    Button,
    IconButton,
    Select,
    Text,
    Center,
} from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import SearchBar from "../../components/SearchBar";
import AddEnergyManagerModal from "./AddEnergyManagerModal";
import { useGetEnergyManagersQuery } from "../../redux/apiSlices/Admin/EnergyManagerApi";
import TableComponent from "../../components/TableComponent";
import deloitte_theme from "../../theme";
import SkeletonComponent from "../../components/SkeletonComponent.jsx";
import {useDebounce} from "../../Hooks/useDebounceHook.js";

const EnergyManagerForm = () => {
    const [selectedRow, setSelectedRow] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [searchFilterToggle, setSearchFilterToggle] = useState(false);
    const [inputSearch, setInputSearch] = useState("");
    const debouncedSearch = useDebounce(inputSearch, 300);
    const search = debouncedSearch.trim();
    const debouncedPage = useDebounce(page,200)

    const { data, isLoading, isError, error, refetch } = useGetEnergyManagersQuery({
            page: debouncedPage,
            page_size: pageSize,
            search,
        });
    const handleRefresh = () => {
            refetch();
            setPage(1);
    };


    useEffect(() => {
        setPage(1);
    }, [search]);

    const energyManagers = data?.items || [];
    const total = data?.total || 0;
    const totalPages = data?.total_pages || 0;

    const tableConfig = useMemo(() => [
        { name: "registration_number", header: "Registration Number", sortable: true, width: "200px", render: (row) => row.registration_number },
        { name: "name", header: "Name", sortable: true, width: "300px", render: (row) => row.name },
    ], []);

    const handleAdd = () => {
        setSelectedRow(null);
        setIsModalOpen(true);
    };

    const handleEdit = (row) => {
        setSelectedRow(row);
        setIsModalOpen(true);
    };

    return (
        <Flex direction="column" gap={deloitte_theme.gap}>
            <Flex justify="space-between" align="center">
                <Heading size="md">Energy Manager Management</Heading>
                <Flex gap={deloitte_theme.gap} align="center">
                    <SearchBar
                        value={inputSearch}
                        onChange={setInputSearch}
                        placeholder="Search by name or reg. no..."
                        isOpen={searchFilterToggle}
                        onToggle={() => setSearchFilterToggle(!searchFilterToggle)}
                    />
                    <IconButton
                        aria-label="Refresh Energy Managers"
                        icon={<RepeatIcon />}
                        onClick={handleRefresh}
                        colorScheme="green"
                        isRound
                        boxShadow="md"
                    />
                    <Button bg={deloitte_theme.buttonSecondary} onClick={handleAdd}>
                        Add Energy Manager
                    </Button>
                </Flex>
            </Flex>

            {isLoading ? (
                <Center py={10}>
                    <SkeletonComponent  size="xl" />
                </Center>
            ) : isError ? (
                <Center py={10}>
                    <Text color="red.500">Error: {error?.data?.detail || "Failed to load energy managers"}</Text>
                </Center>
            ) : energyManagers.length === 0 ? (
                <Center py={10}>
                    <Text color="gray.500">No energy managers found.</Text>
                </Center>
            ) : (
                <>
                    <TableComponent
                        name="Energy Managers"
                        data={energyManagers}
                        config={tableConfig}
                        handleRowSelect={handleEdit}
                        serverPagination={true}
                        serialNumberOffset={(page - 1) * pageSize}
                    />

                    <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                        <Flex align="center" gap={2}>
                            <Text fontSize="sm">Rows per page:</Text>
                            <Select
                                w="70px"
                                size="sm"
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                            >
                                {[10, 25, 50, 100].map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </Select>
                        </Flex>

                        <Flex align="center" gap={2}>
                            <Text fontSize="sm">
                                Page {page} of {totalPages} ({total} total)
                            </Text>
                            <IconButton
                                icon={<FiChevronLeft />}
                                size="sm"
                                isDisabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            />
                            <IconButton
                                icon={<FiChevronRight />}
                                size="sm"
                                isDisabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            />
                        </Flex>
                    </Flex>
                </>
            )}

            <AddEnergyManagerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedRow={selectedRow}
            />
        </Flex>
    );
};

export default EnergyManagerForm;
