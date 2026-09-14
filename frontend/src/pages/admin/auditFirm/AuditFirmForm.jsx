import { useState } from "react";
import { Flex, Heading, Button, IconButton } from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import TableComponent from "../../../components/TableComponent";
import AddAuditFirmModal from "./AuditFirmModal";
import deloitte_theme from "../../../theme";
import { useGetAuditFirmsQuery } from "../../../redux/apiSlices/auditFirmControlApi";
import { useStateName } from "../../../Hooks/useLookUp";
import SkeletonComponent from "../../../components/SkeletonComponent";
import UploadAuditFirmModal from "./UploadAuditFirmModal";

const AuditFirmManager = () => {
    const { data: firms = [], isLoading, refetch } = useGetAuditFirmsQuery();
    const getStateName = useStateName();

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    const openAddModal = () => {
        setSelectedRow(null); // clear selection for ADD
        setAddModalOpen(true);
    };

    const handleRowSelect = (row) => {
        setSelectedRow(row); // set selected row for EDIT
        setAddModalOpen(true);
    };

    const config = [
        {
            name: 'firm_name',
            header: 'Firm Name',
            numeric: false,
            width: '250px',
            render: (row) => row.firm_name,
        },
        {
            name: 'full_name',
            header: 'Auditor Name',
            numeric: false,
            width: '250px',
            render: (row) => row.full_name,
        },
        {
            name: 'address',
            header: 'Address',
            numeric: false,
            width: '250px',
            render: (row) => row.address,
        },
        {
            name: 'mobile',
            header: 'Mobile',
            numeric: false,
            render: (row) => row.mobile,
        },
        {
            name: 'email',
            header: 'Email',
            numeric: false,
            render: (row) => row.email,
        },
        {
            name: 'state_name',
            header: 'State',
            numeric: false,
            render: (row) => row.state_name,
        },
        {
            name: 'valid_from',
            header: 'Valid From',
            numeric: true,
            render: (row) => row.valid_from,
        },
        {
            name: 'valid_to',
            header: 'Valid To',
            numeric: true,
            render: (row) => row.valid_to,
        },
        {
            name: 'source_type',
            header: 'Source Type',
            numeric: false,
            render: (row) => row.source_type,
        }
    ]

    const handleUploadExcel = () => {
        setUploadModalOpen(true);
    };

    return (
        <Flex direction="column" gap={deloitte_theme.gap}>
            <Flex justify="space-between" align="center">
                <Heading size="md">Audit Firm Management</Heading>
                <Flex gap={deloitte_theme.gap}>
                    <IconButton
                        aria-label="Refresh Entities"
                        icon={<RepeatIcon />}
                        onClick={refetch}
                        colorScheme="green"
                        isRound
                        boxShadow="md"
                    />
                    <Button
                        bg={deloitte_theme.buttonPrimary}
                        color={deloitte_theme.white}
                        _hover={{
                            bg: deloitte_theme.buttonHoverPrimary
                        }}
                        onClick={handleUploadExcel}
                    >
                        Upload Excel
                    </Button>

                    <Button
                        bg={deloitte_theme.buttonSecondary}
                        onClick={openAddModal}
                    >
                        Add Audit Firm
                    </Button>

                </Flex>
            </Flex>

            {
                isLoading ?
                    <SkeletonComponent />
                    :
                    <TableComponent
                        name="Audit Firms"
                        config={config}
                        data={firms.map(firm => ({
                            ...firm,
                            state_name: getStateName(firm.state_code)
                        }))}
                        isFilter
                        handleRowSelect={handleRowSelect}
                    />
            }

            <AddAuditFirmModal
                isOpen={addModalOpen}
                onClose={() => { setAddModalOpen(false); setSelectedRow(null); }}
                selectedRow={selectedRow}
                refetch={refetch} // optional: to reload table after add/edit
            />
            <UploadAuditFirmModal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                refetch={refetch}
            />
        </Flex>
    );
};

export default AuditFirmManager;
