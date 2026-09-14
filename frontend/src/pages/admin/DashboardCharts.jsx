import React, { useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import { format, parseISO } from "date-fns";
import deloitte_theme from "../../theme";
import { Flex } from "@chakra-ui/react";

function DashboardCharts({ data, states }) {

    // 🎯 1. State-wise submission count
    const stateWiseData = useMemo(() => {
        const stateMap = {};
        data.forEach(d => {
            stateMap[d.state_code] = (stateMap[d.state_code] || 0) + 1;
        });
        return Object.entries(stateMap).map(([state, count]) => ({ state, count }));
    }, [data]);

    // 🎯 2. Entity-type wise submission
    const entityTypeData = useMemo(() => {
        const typeMap = {};
        data.forEach(d => {
            typeMap[d.entity_type] = (typeMap[d.entity_type] || 0) + 1;
        });
        return Object.entries(typeMap).map(([type, count]) => ({ type, count }));
    }, [data]);

    // 🎯 3. Open vs Closed forms
    const statusData = useMemo(() => {
        const openCount = data.filter(d => d.is_closed === 0).length;
        const closedCount = data.filter(d => d.is_closed === 1).length;
        return [
            { name: "Open", value: openCount },
            { name: "Closed", value: closedCount },
        ];
    }, [data]);

    const groupedActivity = {};
    data.forEach((item) => {
        const date = format(parseISO(item.updated_at), "dd-MM-yy");
        groupedActivity[date] = (groupedActivity[date] || 0) + 1;
    });
    const activityData = Object.entries(groupedActivity)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));


    // stage wise distribution
    const stageWiseData = useMemo(() => {
        const stageMap = {};
        data.forEach(d => {
            stageMap[d.stage] = (stageMap[d.stage] || 0) + 1;
        });
        return Object.entries(stageMap).map(([stage, count]) => ({ stage, count }));
    }, [data]);

    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

    return (
        <Flex direction="column" gap={deloitte_theme.gap} p={deloitte_theme.paddingX}>
            <Flex direction="row" gap={deloitte_theme.gap} w="full" align="center">
                {/* 🟦 State-wise submissions */}
                <div className="rounded-2xl shadow-md flex flex-col justify-between h-full w-full"
                    style={{
                        backgroundColor: deloitte_theme.white,
                        padding: deloitte_theme.paddingX,
                    }}
                >
                    <h3 className="text-center text-lg font-semibold text-gray-700">
                        State-wise Submissions
                    </h3>
                    <div className="w-full h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stateWiseData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="state"
                                />
                                <YAxis
                                    allowDecimals={false}
                                    label={{ value: 'Number', angle: -90, position: 'insideLeft', offset: 10 }}
                                />
                                <Tooltip />
                                <Bar dataKey="count" fill={deloitte_theme.ternary} stroke="none" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 🟠 Recent Activity (Last 7 Days) */}
                <div className="rounded-2xl shadow-md flex flex-col justify-between h-full w-full"
                    style={{
                        backgroundColor: deloitte_theme.white,
                        padding: deloitte_theme.paddingX,
                    }}
                >
                    <h3 className="text-center text-lg font-semibold text-gray-700">
                        Recent Activity (Last 7 Days)
                    </h3>
                    <div className="w-full h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={activityData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis allowDecimals={false} label={{ value: 'Number', angle: -90, position: 'insideLeft', offset: 10 }} />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#00C49F"
                                    strokeWidth={3}
                                    dot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </Flex>

            <Flex direction="row" gap={deloitte_theme.gap} w="full" align="center">
                {/* 🟢 Entity-type wise submissions */}
                <div className="rounded-2xl shadow-md flex flex-col justify-between h-full w-full"
                    style={{
                        backgroundColor: deloitte_theme.white,
                        padding: deloitte_theme.paddingX,
                    }}
                >
                    <h3 className="text-center mb-4 text-lg font-semibold text-gray-700">
                        Entity Type Distribution
                    </h3>
                    <div className="w-full h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={entityTypeData}
                                    dataKey="count"
                                    nameKey="type"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius="70%"
                                    label
                                >
                                    {entityTypeData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend />
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 🟣 Open vs Closed forms */}
                <div className="rounded-2xl shadow-md flex flex-col justify-between h-full w-full"
                    style={{
                        backgroundColor: deloitte_theme.white,
                        padding: deloitte_theme.paddingX,
                    }}
                >
                    <h3 className="text-center mb-4 text-lg font-semibold text-gray-700">
                        Form Status (Open vs Closed)
                    </h3>
                    <div className="w-full h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="40%"
                                    outerRadius="70%"
                                    label
                                >
                                    {statusData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend />
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 🟣 Stage-wise distribution */}
                {/* <div className="rounded-2xl shadow-md flex flex-col justify-between h-full w-full"
                    style={{
                        backgroundColor: deloitte_theme.white,
                        padding: deloitte_theme.paddingX,
                    }}
                >
                    <h3 className="text-center mb-4 text-lg font-semibold text-gray-700">
                        Stage-wise Distribution
                    </h3>
                    <div className="w-full h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stageWiseData}
                                    dataKey="count"
                                    nameKey="stage"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius="70%"
                                    label
                                >
                                    {stageWiseData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend />
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div> */}

            </Flex>
        </Flex>
    )
}

export default DashboardCharts