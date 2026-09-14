import { useState } from "react";
import {
    Flex,
    Heading,
    Button,
    Select,
    Text,
    IconButton,
} from "@chakra-ui/react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import AddPatModal from "./AddPatModal";
import { useGetPatNumbersQuery } from "../../redux/apiSlices/patControlApi";
import TableComponent from "../../components/TableComponent";
import deloitte_theme from "../../theme";
import SkeletonComponent from "../../components/SkeletonComponent";

const PATManager = () => {
    const [selectedRow, setSelectedRow] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data, isLoading: isPatNumbersLoading } = useGetPatNumbersQuery({
        page,
        page_size: pageSize,
    });

    const patNumbers = data?.items || [];
    const total = data?.total || 0;
    const totalPages = data?.total_pages || 0;

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
                <Heading size="md">PAT Management</Heading>
                <Button bg={deloitte_theme.buttonSecondary} onClick={handleAdd}>
                    Add PAT
                </Button>
            </Flex>
            {isPatNumbersLoading ? (
                <SkeletonComponent type="table" />
            ) :
                <TableComponent
                    name="PAT Registrations"
                    data={patNumbers}
                    handleRowSelect={handleEdit}
                    isFilter
                    serverPagination={true}
                    serialNumberOffset={(page - 1) * pageSize}
                />
            }

            <Flex justify="space-between" align="center" mt={3}>
                <Flex align="center" gap={2}>
                    <Text fontSize="sm">Rows per page:</Text>
                    <Select
                        w="70px"
                        size="sm"
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                    >
                        {[10, 25, 50, 100].map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </Select>
                </Flex>

                <Flex align="center" gap={2}>
                    <IconButton
                        icon={<FiChevronLeft />}
                        size="sm"
                        aria-label="Previous"
                        isDisabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    />

                    <Text fontSize="sm">
                        Page {page} of {totalPages} ({total} total)
                    </Text>

                    <IconButton
                        icon={<FiChevronRight />}
                        size="sm"
                        aria-label="Next"
                        isDisabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    />
                </Flex>
            </Flex>

            <AddPatModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedRow={selectedRow}
            />
        </Flex>
    );
};

export default PATManager;