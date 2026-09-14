import React from 'react'
import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
    Flex,
    Wrap,
    WrapItem,
    Button,
    Text,
    Box
} from "@chakra-ui/react";
import deloitte_theme from '../../theme';
import { useGetMappedEntitiesDetailsQuery } from '../../redux/apiSlices/corporate/corporateAPI';
import TableComponent from '../../components/TableComponent';
import SkeletonComponent from '../../components/SkeletonComponent';

function SubmissionDetails() {
    const { financialYears } = useSelector((state) => state.commonState);
    const [selectedFY, setSelectedFY] = useState('');

    // Fetch mapped entities details when FY is selected
    const { data: mappedEntitiesData = [], isLoading: isMappedEntitiesLoading, isError, error } = useGetMappedEntitiesDetailsQuery(
        selectedFY ? parseInt(selectedFY) : null,
        { skip: !selectedFY }
    );

    const config = useMemo(() => {
        return [
            {
                name: 'reg_no',
                header: 'Registration No.',
                numeric: false,
                width: '180px',
                render: (row) => row.reg_no,
            },
            {
                name: 'org_name',
                header: 'Entity Name',
                numeric: false,
                width: '250px',
                render: (row) => row.org_name,
            },
            {
                name: 'entity_type',
                header: 'Entity Type',
                numeric: true,
                render: (row) => row.entity_type,
            },
            {
                name: 'status',
                header: 'Submission Status',
                numeric: true,
                width: '200px',
                render: (row) => row.status ? (row.is_closed === 1 ? 'Closed' : `Pending from ${row.status}`) : null,
            },
            {
                name: 'buyout_request',
                header: 'Buyout Status',
                numeric: true,
                width: '200px',
                render: (row) => row.buyout_request === null ? null : (row.buyout_request ? 'Requested' : 'Not Requested'),
            },
            {
                name: 'surplus_deficit',
                header: 'Surplus/Deficit',
                numeric: true,
                width: '180px',
                render: (row) => row.surplus_deficit,
            },
            {
                name: 'total_recs',
                header: 'Total RECs bought',
                numeric: true,
                width: '150px',
                render: (row) => row.total_recs,
            },
            {
                name: 'surplus_deficit_percentage',
                header: 'Surplus/Deficit %',
                numeric: true,
                width: '200px',
                render: (row) => row.surplus_deficit_percentage !== null ? `${row.surplus_deficit_percentage?.toFixed(2)}%` : null,
            }
        ];
    }, [mappedEntitiesData, selectedFY]);

    return (
        <Flex direction="column" gap={deloitte_theme.gap}>
            {/* Section Header : Contains - FY selector */}
            <Flex gap={deloitte_theme.gap}>
                <Text fontSize="md" fontWeight="bold" color={deloitte_theme.textPrimary} mb={2}>
                    Financial Year :
                </Text>

                <Wrap spacing={3}>
                    {financialYears.map((fy) => (
                        <WrapItem key={fy.id}>
                            <Button
                                size="sm"
                                variant={selectedFY === fy.id ? "solid" : "outline"}
                                backgroundColor={selectedFY === fy.id ? deloitte_theme.buttonPrimary : "white"}
                                color={selectedFY === fy.id ? "black" : "gray.700"}
                                borderColor="gray.300"
                                _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                                onClick={() => setSelectedFY(fy.id)}
                            >
                                {fy.fy_code}
                            </Button>
                        </WrapItem>
                    ))}
                </Wrap>
            </Flex>

            <Box>
                {
                    isMappedEntitiesLoading ?
                        <SkeletonComponent /> :
                        <TableComponent name="Mapped Entities Details" config={config} data={mappedEntitiesData} />
                }
            </Box>

        </Flex>
    )
}

export default SubmissionDetails