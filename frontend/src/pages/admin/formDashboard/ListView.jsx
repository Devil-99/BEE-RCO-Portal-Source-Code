import React from 'react'
import {
    Flex,
    Heading,
    Spinner,
    Select,
    IconButton,
    Text,
} from '@chakra-ui/react';
import deloitte_theme from '../../../theme';
import SubmittedFormsComponent from '../../dashboards/SubmittedFormsComponent';
import { GrNext, GrPrevious } from "react-icons/gr";
import SkeletonComponent from '../../../components/SkeletonComponent';

function ListView({ filteredList, page, pageSize, totalCount, totalPages, setPage, setPageSize, isFetching, exportRows }) {
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
        <Flex w="100%" direction="column" gap={deloitte_theme.gap}>
            {isFetching ?
                <SkeletonComponent type="table" />
                :
                <>
                    <SubmittedFormsComponent
                        submittedForms={filteredList}
                        serverPagination
                        serialNumberOffset={(page - 1) * pageSize}
                        exportRows={exportRows}
                    />
                    <Flex justify="space-between" align="center" mt={3} flexWrap="wrap" gap={3}>
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
                </>
            }
        </Flex>
    )
}

export default ListView
