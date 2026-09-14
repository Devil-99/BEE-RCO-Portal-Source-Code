import { useState, useMemo } from 'react'
import { Flex, Heading, Divider, Box, SkeletonCircle } from '@chakra-ui/react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import deloitte_theme from '../../theme'
import FinancialYearFilter from '../../components/FinancialYearFilter'
import StatusCard from '../../components/StatusCard'
import { useGetMopDashboardSummaryQuery } from '../../redux/apiSlices/mopDashboardApi'

function formatIndianCurrency(amount) {
    if (!amount) return "₹0";
    const num = Math.round(amount);
    const numStr = num.toString();
    const lastThree = numStr.slice(-3);
    const rest = numStr.slice(0, -3);
    if (rest) {
        return "₹" + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
    }
    return "₹" + lastThree;
}

function SummaryReport() {
    const [selectedFY, setSelectedFY] = useState('');
    const { data: summaryData, isLoading } = useGetMopDashboardSummaryQuery(
        { fy_id: selectedFY },
        { skip: !selectedFY }
    );

    const regSummary = summaryData?.registration_summary ?? {};
    const subSummary = summaryData?.submission_summary ?? {};

    const totalRegistrations =
        (regSummary?.total_entities ?? 0) +
        (regSummary?.total_audit_firms ?? 0) +
        (regSummary?.total_aeas ?? 0);
    const totalSubmissions =
        (subSummary?.total_discoms ?? 0) +
        (subSummary?.total_cpps ?? 0);

    const totalPaymentAmount = formatIndianCurrency(summaryData?.payment_summary?.total_amount ?? 0);

    const stateRegistrations = useMemo(() => {
        const data = regSummary?.state_wise ?? [];

        return data.map(item => ({
            ...item,
            state_label: item.state_code?.toUpperCase() || item.state_name,
        }));
    }, [regSummary]);
    const stateSubmissions = useMemo(() => subSummary?.state_wise ?? [], [subSummary]);

    return (
        <Flex
            direction="column"
            gap={deloitte_theme.gap}
            bg={deloitte_theme.white}
            p={deloitte_theme.paddingX}
        >
            <Flex justify="space-between" align="center">
                <Heading size="md" fontWeight="semibold">
                    Summary Report
                    {!selectedFY && (
                        <span className="text-sm text-red-500 font-normal ml-3">
                    Please select a Financial Year
                </span>
                    )}
                </Heading>
            </Flex>

            <Divider />

            <FinancialYearFilter
                selectedFY={selectedFY}
                setSelectedFY={setSelectedFY}
            />

            <Flex w="full" gap={deloitte_theme.gap} wrap="wrap">
                <StatusCard
                    title="Total Registrations"
                    value={totalRegistrations}
                    helpText={`Entities - ${regSummary?.total_entities ?? 0} | Audit Firms - ${regSummary?.total_audit_firms ?? 0} | AEAs - ${regSummary?.total_aeas ?? 0}`}
                />

                <StatusCard
                    title="Total Submissions"
                    value={totalSubmissions}
                    helpText={`DISCOMs - ${subSummary?.total_discoms ?? 0} | CPPs - ${subSummary?.total_cpps ?? 0}`}
                />

                <StatusCard
                    title="Total Payment Amount Received"
                    value={totalPaymentAmount}
                    highlight
                />
            </Flex>

            <Flex direction="row" gap={deloitte_theme.gap} w="full" wrap="wrap">

                {/* Registration Chart */}
                <Box
                    flex="1"
                    minW="420px"
                    h="450px"
                    bg={deloitte_theme.white}
                    borderWidth="1px"
                    borderRadius="xl"
                    boxShadow="sm"
                    p={5}
                >
                    <Heading
                        size="sm"
                        textAlign="center"
                        mb={5}
                        fontWeight="semibold"
                    >
                        State-wise Registrations
                    </Heading>

                    <Box w="100%" h="400px">
                        {isLoading ? (
                            <SkeletonCircle size="16" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={
                                        selectedFY && stateRegistrations.length > 0
                                            ? stateRegistrations
                                            : [{ state_label: "", entities: 0, audit_firms: 0 }]
                                    }
                                    margin={{
                                        top: 10,
                                        right: 15,
                                        left: -10,
                                        bottom: 55,
                                    }}
                                    barCategoryGap="18%"
                                >
                                    <CartesianGrid
                                        stroke="#E2E8F0"
                                        vertical={false}
                                    />

                                    <XAxis
                                        dataKey="state_label"
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                        tick={{ fontSize: 10 }}
                                    />

                                    <YAxis allowDecimals={false} />

                                    <Tooltip
                                        cursor={{ fill: "#F7FAFC" }}
                                    />

                                    <Legend verticalAlign="bottom" height={36} />

                                    <Bar
                                        dataKey="entities"
                                        name="Entities"
                                        fill={deloitte_theme.ternary}
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={28}
                                    />

                                    <Bar
                                        dataKey="audit_firms"
                                        name="Audit Firms"
                                        fill={deloitte_theme.secondary}
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={28}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </Box>
                </Box>

                {/* Submission Chart */}
                <Box
                    flex="1"
                    minW="420px"
                    h="450px"
                    bg={deloitte_theme.white}
                    borderWidth="1px"
                    borderRadius="xl"
                    boxShadow="sm"
                    p={5}
                >
                    <Heading
                        size="sm"
                        textAlign="center"
                        mb={5}
                        fontWeight="semibold"
                    >
                        State-wise Submissions
                    </Heading>

                    <Box w="100%" h="400px">
                        {isLoading ? (
                            <SkeletonCircle size="16" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={
                                        selectedFY && stateSubmissions.length > 0
                                            ? stateSubmissions
                                            : [{ state_code: "", discoms: 0, cpps: 0 }]
                                    }
                                    margin={{
                                        top: 10,
                                        right: 15,
                                        left: -10,
                                        bottom: 55,
                                    }}
                                    barCategoryGap="18%"
                                >
                                    <CartesianGrid
                                        stroke="#E2E8F0"
                                        vertical={false}
                                    />

                                    <XAxis
                                        dataKey="state_code"
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                        tick={{ fontSize: 10 }}
                                    />

                                    <YAxis allowDecimals={false} />

                                    <Tooltip
                                        cursor={{ fill: "#F7FAFC" }}
                                    />

                                    <Legend verticalAlign="bottom" height={36} />

                                    <Bar
                                        dataKey="discoms"
                                        name="DISCOMs"
                                        fill={deloitte_theme.ternary}
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={80}
                                    />

                                    <Bar
                                        dataKey="cpps"
                                        name="CPPs"
                                        fill={deloitte_theme.secondary}
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={100}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </Box>
                </Box>

            </Flex>
        </Flex>    )
}

export default SummaryReport
