import React from 'react';
import { Badge, Flex, IconButton, Select, Text } from '@chakra-ui/react';
import { GrPrevious, GrNext } from 'react-icons/gr';
import TableComponent from '../../../components/TableComponent';
import { formatDateTime } from '../../../utils/formatter';
import deloitte_theme from '../../../theme';
import SkeletonComponent from '../../../components/SkeletonComponent';

function ListView({ payments, page, pageSize, totalCount, totalPages, setPage, setPageSize, isLoading }) {
    const today = new Date().toISOString().split("T")[0];
    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'SUCCESS': return 'green';
            case 'PENDING': return 'yellow';
            case 'BOOKED': return 'blue';
            case 'FAILED': return 'red';
            default: return 'gray';
        }
    };

    const paymentListConfig = [
        {
            name: 'order_id',
            header: 'Order ID',
            width: '300px',
            numeric: true,
            render: (row) => row.order_id,
            exportValue: (row) => row.order_id
        },
        {
            name: 'entity_name',
            header: 'Entity',
            width: '250px',
            render: (row) => row.entity_name,
            exportValue: (row) => row.entity_name
        },
        {
            name: 'user_name',
            header: 'User Name',
            width: '200px',
            render: (row) => row.user_name,
            exportValue: (row) => row.user_name
        },
        {
            name: 'mobile',
            header: 'User Mobile',
            width: '150px',
            numeric: true,
            render: (row) => row.mobile,
            exportValue: (row) => row.mobile
        },
        {
            name: 'category',
            header: 'Category',
            width: '150px',
            render: (row) => row.category,
            exportValue: (row) => row.category
        },
        {
            name: 'payment_amount',
            header: 'Amount',
            width: '120px',
            numeric: true,
            render: (row) => row.payment_amount,
            exportValue: (row) => row.payment_amount
        },
        {
            name: 'payment_status',
            header: 'Status',
            width: '120px',
            numeric: false,
            render: (row) => (
                <Badge colorScheme={getStatusColor(row.payment_status)} p={deloitte_theme.marginY} rounded="md">
                    {row.payment_status}
                </Badge>
            ),
            exportValue: (row) => row.payment_status
        },
        {
            name: 'gateway_status',
            header: 'Gateway Status',
            width: '180px',
            numeric: false,
            render: (row) => (
                <Badge colorScheme={getStatusColor(row.gateway_status)} p={deloitte_theme.marginY} rounded="md">
                    {row.gateway_status}
                </Badge>
            ),
            exportValue: (row) => row.gateway_status
        },
        {
            name: 'payment_mode',
            header: 'Mode',
            width: '100px',
            numeric: true,
            render: (row) => row.payment_mode || 'N/A',
            exportValue: (row) => row.payment_mode || 'N/A'
        },
        {
            name: 'transaction_ref_id',
            header: 'Transaction ID',
            width: '180px',
            numeric: true,
            render: (row) => row.transaction_ref_id || 'N/A',
            exportValue: (row) => row.transaction_ref_id || 'N/A'
        },
        {
            name: 'bank_ref_number',
            header: 'Bank Ref No.',
            width: '200px',
            numeric: true,
            render: (row) => row.bank_ref_number || 'N/A',
            exportValue: (row) => row.bank_ref_number || 'N/A'
        },
        {
            name: 'transaction_date',
            header: 'Transaction Date',
            width: '200px',
            render: (row) => row.transaction_date || 'N/A',
            exportValue: (row) => row.transaction_date || 'N/A'
        },
        {
            name: 'verified_at',
            header: 'Verified At',
            width: '150px',
            render: (row) => formatDateTime(row.verified_at),
            exportValue: (row) => row.verified_at || 'N/A'
        },
    ];

    const handlePrevPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage(page + 1);
    };

    const handleRowsChange = (e) => {
        setPageSize(Number(e.target.value));
        setPage(1);
    };


    return (
        <>
            {
                isLoading ?
                    <SkeletonComponent type="table" />
                    :
                    <div>
                        <TableComponent
                            name="Transaction List"
                            sheetName="transaction_list_transactiondate"
                            fileName={`transaction_list_${today}`}
                            config={paymentListConfig}
                            data={payments}
                            isDownload={true}
                            isFilter={false}
                            serverPagination={true}
                            serialNumberOffset={(page - 1) * pageSize}
                        />
                        <Flex
                            justify="space-between"
                            align="center"
                            mt={3}
                            flexWrap="wrap"
                            gap={3}
                        >
                            {/* Rows Per Page */}
                            <Flex align="center" gap={2}>
                                <Text fontSize="sm">Rows per page:</Text>

                                <Select
                                    w="70px"
                                    size="sm"
                                    value={pageSize}
                                    onChange={handleRowsChange}
                                >
                                    {[10, 25, 50, 100].map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </Select>
                            </Flex>

                            {/* Pagination */}
                            <Flex align="center" gap={2}>
                                <IconButton
                                    aria-label="Previous Page"
                                    icon={<GrPrevious />}
                                    size="sm"
                                    onClick={handlePrevPage}
                                    isDisabled={page <= 1}
                                />

                                <Text fontSize="sm" whiteSpace="nowrap">
                                    Page {Math.max(page, 1)} of {Math.max(totalPages, 1)} ({totalCount} total)
                                </Text>

                                <IconButton
                                    aria-label="Next Page"
                                    icon={<GrNext />}
                                    size="sm"
                                    onClick={handleNextPage}
                                    isDisabled={page >= totalPages || totalPages === 0}
                                />
                            </Flex>
                        </Flex>
                    </div>
            }
        </>
    )
}

export default ListView