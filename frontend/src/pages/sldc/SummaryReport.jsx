import { useState, useMemo } from 'react'
import { Flex, Heading, Button, Divider, Box, SkeletonCircle } from '@chakra-ui/react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend
} from "recharts";

import deloitte_theme from '../../theme'
import FinancialYearFilter from '../../components/FinancialYearFilter'
import StatusCard from '../../components/StatusCard'

import { useGetDashboardSummaryReportQuery } from '../../redux/apiSlices/summary-dashboard/dashboardApi'

function SummaryReport({ setActiveSection }) {
    const [selectedFY, setSelectedFY] = useState('');
    const { data: summaryReport, isLoading } = useGetDashboardSummaryReportQuery({ fy_id: selectedFY }, { skip: !selectedFY })

    const registrationSummary = summaryReport?.registration_summary ?? {};
    const submissionSummary = summaryReport?.submission_summary ?? {};

    const totalRegistration =
        (registrationSummary?.discom_registration ?? 0);
    const totalSubmission =
        (submissionSummary?.discom_closed ?? 0) +
        (submissionSummary?.discom_pending ?? 0);

    const submissionReport = useMemo(() => {
        if (!submissionSummary) return [];

        const summaryArray = [
            {
                type: 'Discom',
                closed: submissionSummary.discom_closed,
                pending: submissionSummary.discom_pending
            }
        ]

        return summaryArray;
    }, [submissionSummary])

    return (
        <Flex direction="column"
            gap={deloitte_theme.gap}
            bg={deloitte_theme.white}
            p={deloitte_theme.paddingX}
        >
            <Flex
                justify="space-between"
                align="center"
            >
                <Heading
                    size="md"
                    fontWeight="semibold"
                >
                    Summary Report
                    {!selectedFY && <span className='text-sm text-red-500 font-normal ml-3'>Please select a Financial Year</span>}
                </Heading>
                <Button
                    size="sm"
                    bg={deloitte_theme.primary}
                    _hover={{ bg: deloitte_theme.secondary }}
                    borderRadius="md"
                    boxShadow="md"
                    fontSize="sm"
                    color={deloitte_theme.textPrimary}
                    onClick={() => setActiveSection('submissionDetails')}
                >
                    View Submission Details
                </Button>
            </Flex>

            <Divider />

            <FinancialYearFilter selectedFY={selectedFY} setSelectedFY={setSelectedFY} />

            <Flex w="full" gap={deloitte_theme.gap} wrap="wrap">
                <StatusCard
                    title="Total Registration"
                    value={totalRegistration}
                    helpText={`Discom - ${registrationSummary?.discom_registration ?? 0}`}
                />
                <StatusCard
                    title="Total Form Submission"
                    value={totalSubmission}
                    helpText={`Discom - ${(submissionSummary?.discom_closed ?? 0) + (submissionSummary?.discom_pending ?? 0)}`}
                />
            </Flex>

            <Flex w='25rem' direction='column' gap={deloitte_theme.gap} justifyContent='space-between' alignItems='center' rounded='lg'>
                <Heading textAlign="center" fontSize="lg">
                    Compliance Form Submission Report
                </Heading>
                <Box w='full' h={72}>
                    {
                        submissionReport.length > 0 ?
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={submissionReport}>
                                    <CartesianGrid strokeDasharray="3 3" />

                                    <XAxis dataKey="type" />

                                    <YAxis allowDecimals={false} />

                                    <Tooltip />

                                    <Legend />

                                    {/* Success Count */}
                                    <Bar
                                        dataKey="closed"
                                        name="Closed"
                                        fill={deloitte_theme.ternary}
                                        radius={[4, 4, 0, 0]}
                                    />

                                    {/* Failed Count*/}
                                    <Bar
                                        dataKey="pending"
                                        name="Pending"
                                        fill={deloitte_theme.buttonWarning}
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                            :
                            <SkeletonCircle />
                    }
                </Box>
            </Flex>

        </Flex>
    )
}

export default SummaryReport