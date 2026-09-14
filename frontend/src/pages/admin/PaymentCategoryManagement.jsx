import { useMemo, useState } from "react";
import {
    Box,
    Button,
    Flex,
    Heading,
    IconButton,
    Tooltip,
} from "@chakra-ui/react";
import { EditIcon, RepeatIcon } from "@chakra-ui/icons";
import deloitte_theme from "../../theme";
import TableComponent from "../../components/TableComponent";
import AddPaymentCategoryModal from "./AddPaymentCategoryModal";
import { useGetPaymentCategoriesQuery } from "../../redux/apiSlices/paymentCategoryApi";
import { useFY, useSectorName } from "../../Hooks/useLookUp";

const formatAmount = (val) => {
    if (val == null || val === "") return "—";
    return `₹ ${Number(val).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

function PaymentCategoryManagement() {
    const [addModal, setAddModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    const { data: categories = [], isLoading, refetch } = useGetPaymentCategoriesQuery();

    const getFYCode = useFY();
    const getSectorName = useSectorName();

    const handleEdit = (row) => {
        setSelectedRow(row);
        setAddModal(true);
    };

    const handleAdd = () => {
        setSelectedRow(null);
        setAddModal(true);
    };

    const config = useMemo(
        () => [
            {
                name: "category_code",
                header: "Category Code",
                numeric: false,
                width: "180px",
                render: (row) => row.category_code,
                exportValue: (row) => row.category_code,
            },
            {
                name: "title",
                header: "Title",
                numeric: false,
                width: "220px",
                render: (row) => row.title,
                exportValue: (row) => row.title,
            },
            {
                name: "fy_id",
                header: "Financial Year",
                numeric: true,
                width: "160px",
                render: (row) => getFYCode(row.fy_id),
                exportValue: (row) => getFYCode(row.fy_id),
            },
            {
                name: "sector_type",
                header: "Sector Type",
                numeric: false,
                width: "180px",
                render: (row) => getSectorName(row.sector_type) || "—",
                exportValue: (row) => getSectorName(row.sector_type) || "—",
            },
            {
                name: "entity_type",
                header: "Entity Type",
                numeric: false,
                width: "150px",
                render: (row) => row.entity_type || "—",
                exportValue: (row) => row.entity_type || "—",
            },
            {
                name: "amount",
                header: "Amount",
                numeric: true,
                width: "160px",
                render: (row) => formatAmount(row.amount),
                exportValue: (row) => row.amount,
            },
            {
                name: "is_default",
                header: "Default",
                numeric: false,
                width: "120px",
                render: (row) => (row.is_default ? "Yes" : "No"),
                exportValue: (row) => (row.is_default ? "Yes" : "No"),
            },
            {
                name: "is_active",
                header: "Status",
                numeric: false,
                width: "120px",
                render: (row) => (row.is_active ? "Active" : "Inactive"),
                exportValue: (row) => (row.is_active ? "Active" : "Inactive"),
            },
            {
                name: "actions",
                header: "Actions",
                numeric: true,
                width: "100px",
                sortable: false,
                render: (row) => (
                    <Tooltip label="Edit Payment Category" hasArrow>
                        <IconButton
                            aria-label="Edit Payment Category"
                            icon={<EditIcon />}
                            size="sm"
                            colorScheme="green"
                            variant="ghost"
                            onClick={() => handleEdit(row)}
                        />
                    </Tooltip>
                ),
            },
        ],
        [getFYCode, getSectorName]
    );

    return (
        <Flex direction="column" gap={deloitte_theme.gap}>
            <Flex justifyContent="space-between" alignItems="center">
                <Heading size="md" color={deloitte_theme.textPrimary}>
                    Payment Category Management
                </Heading>

                <Flex align="center" gap={deloitte_theme.gap}>
                    <IconButton
                        aria-label="Refresh Payment Categories"
                        icon={<RepeatIcon />}
                        colorScheme="green"
                        isRound
                        boxShadow="md"
                        onClick={refetch}
                        isLoading={isLoading}
                    />
                    <Button
                        backgroundColor={deloitte_theme.buttonSecondary}
                        color="black"
                        _hover={{
                            backgroundColor: deloitte_theme.white,
                        }}
                        onClick={handleAdd}
                    >
                        Add Payment Category
                    </Button>
                </Flex>
            </Flex>

            <Box w="full">
                <TableComponent
                    name="Payment Categories"
                    config={config}
                    data={categories}
                    isFilter
                    isDownload
                />
            </Box>

            <AddPaymentCategoryModal
                isOpen={addModal}
                onClose={() => setAddModal(false)}
                selectedRow={selectedRow}
            />
        </Flex>
    );
}

export default PaymentCategoryManagement;
