import React, { useMemo } from 'react'
import {
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from "recharts";

import deloitte_theme from '../../../theme';
import { formatCurrency } from '../../../utils/formatter';
import { Flex, Heading, Skeleton, SkeletonCircle, Text } from '@chakra-ui/react';

const COLORS = ["#198529", "#86BC25", "#FFBB28", "#FF8042", "#0088FE"];

function GraphView({ analytics  }) {

    const statusData = useMemo(() => {
        if (!analytics?.status_breakdown) return [];

        return [
            {
                name: "Success",
                value: analytics.status_breakdown.SUCCESS || 0,
            },
            {
                name: "Pending",
                value: analytics.status_breakdown.PENDING || 0,
            },
            {
                name: "Failed",
                value: analytics.status_breakdown.FAILED || 0,
            },
        ].filter(item => item.value > 0);

    }, [analytics]);
    const monthlyTrendData = useMemo(() => {

        if (!analytics?.monthly_trend) return [];

        const monthNames = [
            "JAN","FEB","MAR","APR","MAY","JUN",
            "JUL","AUG","SEP","OCT","NOV","DEC"
        ];

        return analytics.monthly_trend.map(item => {

            const [year, month] = item.month.split("-");

            return {
                month:
                    monthNames[Number(month) - 1] +
                    "-" +
                    year.slice(-2),

                totalCount: item.total_count,

                successCount: item.success_count,

                pendingCount: item.pending_count,

                failedCount: item.failed_count,

                amount: item.amount,
            };
        });

    }, [analytics]);
    const paymentModeData = useMemo(() => {
        if (!analytics?.payment_mode_breakdown) return [];

        return Object.entries(
            analytics.payment_mode_breakdown
        ).map(([mode, value]) => ({
            name: mode,
            value,
        }));

    }, [analytics]);
    // const isLoading = analytics === undefined;
    return (
        <div className="flex flex-col w-full" style={{ padding: deloitte_theme.paddingY, gap: deloitte_theme.gap }}>
            <Flex w="full" gap={deloitte_theme.gap}>
                <div className="bg-white rounded-2xl shadow-md flex flex-col w-full justify-between min-h-[20rem]" style={{ padding: deloitte_theme.paddingX }}>
                    <Heading textAlign="center" fontSize="lg">
                        Payment Status Distribution
                    </Heading>
                    <div className="w-full h-72">
                        {statusData.length === 0 ? (
                            <SkeletonCircle height="100%" borderRadius="lg" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius="70%"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {statusData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend />
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-md flex flex-col w-full justify-between min-h-[20rem]" style={{ padding: deloitte_theme.paddingX }}>
                    <Heading textAlign="center" fontSize="lg">
                        Payment Mode Breakdown
                    </Heading>
                    <div className="w-full h-72">
                        {paymentModeData.length === 0 ? (
                            <SkeletonCircle height="100%" borderRadius="lg" />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={paymentModeData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="40%"
                                        outerRadius="70%"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {paymentModeData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend />
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </Flex>

            <div className="bg-white rounded-2xl shadow-md flex flex-col justify-between min-h-[20rem]" style={{ padding: deloitte_theme.paddingX, gap: deloitte_theme.gap }}>
                <Heading textAlign="center" fontSize="lg">
                    Monthly Payment Trend
                </Heading>
                <div className="w-full h-72">
                    {monthlyTrendData.length === 0 ? (
                        <SkeletonCircle height="100%" borderRadius="lg" />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyTrendData}>
                                <CartesianGrid strokeDasharray="3 3" />

                                <XAxis dataKey="month" />

                                <YAxis allowDecimals={false} />

                                <Tooltip
                                    formatter={(value, name) => {
                                        if (name === "Amount") {
                                            return [formatCurrency(value), name];
                                        }
                                        return [Math.round(value), name];
                                    }}
                                />
                                <Legend />

                                {/* Success Count */}
                                <Bar
                                    dataKey="successCount"
                                    name="Success"
                                    fill={deloitte_theme.ternary}
                                    radius={[4, 4, 0, 0]}
                                />

                                {/* Failed Count*/}
                                <Bar
                                    dataKey="failedCount"
                                    name="Failed"
                                    fill={deloitte_theme.buttonWarning}
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

        </div>
    )
}

export default GraphView