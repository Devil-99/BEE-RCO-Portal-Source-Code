import React from 'react'
import { Skeleton, Flex, Box, SkeletonCircle, Table, Thead, Tr, Td, Th, Tbody } from '@chakra-ui/react'
import deloitte_theme from '../theme'

const TableSkeleton = ({ rows = 3, columns = 4 } = {}) => {
    return (
        <Box
            border="1px"
            borderColor="gray.300"
            rounded="md"
            p={deloitte_theme.paddingX}
            overflowX="auto"
        >
            <Table variant="simple" size="md">
                <Thead>
                    <Tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <Th key={i}>
                                <Skeleton height="30px" borderRadius="md" />
                            </Th>
                        ))}
                    </Tr>
                </Thead>

                <Tbody>
                    {Array.from({ length: rows }).map((_, row) => (
                        <Tr key={row}>
                            {Array.from({ length: columns }).map((_, col) => (
                                <Td key={col}>
                                    <Skeleton height="20px" mx={2} borderRadius="md"/>
                                </Td>
                            ))}
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    )
}

const DefaultSkeleton = () => {
    return (
        <Flex direction="column" gap={5}>
            <Flex w="fit-content" align="center" gap={5} border="1px" borderColor="gray.300" p={5} rounded="md">
                <SkeletonCircle size="28" />
                <Box>
                    <Skeleton height="30px" width="25rem" borderRadius="md" />
                    <Skeleton height="20px" width="15rem" borderRadius="md" mt={2} />
                </Box>
            </Flex>
            <Flex w="full" gap={deloitte_theme.gap} wrap="wrap">
                <Box border="1px" borderColor="gray.300" p={5} rounded="md">
                    <SkeletonCircle size="72" />
                </Box>
                <Flex direction="column" gap={5} border="1px" borderColor="gray.300" p={5} rounded="md">
                    {Array(3)
                        .fill(0)
                        .map((_, idx) => (
                            <Skeleton key={idx} height="100px" width="50rem" borderRadius="lg" />
                        ))}
                </Flex>
            </Flex>
        </Flex>
    )
}

const SkeletonComponent = ({ type }) => {
    switch (type) {
        case 'table':
            return <TableSkeleton />
        default:
            return <DefaultSkeleton />
    }
}

export default SkeletonComponent