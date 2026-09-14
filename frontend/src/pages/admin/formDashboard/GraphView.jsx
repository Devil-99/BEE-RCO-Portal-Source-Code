import React, { useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    LineChart, Line, LabelList
} from "recharts";
import { format, parseISO } from "date-fns";
import deloitte_theme from "../../../theme";
import { Flex } from "@chakra-ui/react";
import { useFY } from "../../../Hooks/useLookUp";

function GraphView({ submittedForms }) {
    const getFyCode = useFY();

    const stateWiseData = useMemo(() => {
        const stateMap = {};
        submittedForms.forEach(d => {
            stateMap[d.state_code] = (stateMap[d.state_code] || 0) + 1;
        });
        return Object.entries(stateMap).map(([state, count]) => ({ state, count }));
    }, [submittedForms]);

    const activityData = useMemo(() => {
        const groupedActivity = {};
        submittedForms.forEach((item) => {
            const date = format(parseISO(item.updated_at), "dd-MM-yy");
            groupedActivity[date] = (groupedActivity[date] || 0) + 1;
        });
        return Object.entries(groupedActivity)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [submittedForms]);

    const stageWiseData = useMemo(() => {
        const stageMap = {};
        submittedForms.forEach(d => {
            if(d.is_closed == '0') {
                const stage = d.stage || "Unknown";
                stageMap[stage] = (stageMap[stage] || 0) + 1;
            }
        });
        return Object.entries(stageMap).map(([stage, count]) => ({ stage, count }));
    }, [submittedForms]);

    const fyWiseData = useMemo(() => {
        const fyMap = {};

        submittedForms.forEach((item) => {
            const fy = getFyCode(item.fy_id);
            if (!fy) return;

            if (!fyMap[fy]) {
                fyMap[fy] = { fy, totalSubmission: 0, totalApproved: 0 };
            }

            fyMap[fy].totalSubmission += 1;
            if (item.is_closed) fyMap[fy].totalApproved += 1;
        });

        return Object.values(fyMap).sort((a, b) => {
            const aYear = Number((a.fy.match(/\d{4}/) || [0])[0]);
            const bYear = Number((b.fy.match(/\d{4}/) || [0])[0]);
            return aYear - bYear;
        });
    }, [submittedForms]);

    return (
        <Flex direction="column" gap={deloitte_theme.gap} p={deloitte_theme.paddingX}>
            <Flex direction="row" gap={deloitte_theme.gap} w="full" align="center">
                <div className="rounded-2xl shadow-md flex flex-col justify-between h-full w-full"
                    style={{
                        backgroundColor: deloitte_theme.white,
                        padding: deloitte_theme.paddingX,
                    }}
                >
                    <h3 className="text-center text-lg font-semibold text-gray-700">
                        State-wise Submission Report
                    </h3>
                    <div className="w-full h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stateWiseData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="state" />
                                <YAxis
                                    allowDecimals={false}
                                    label={{ value: 'Number', angle: -90, position: 'insideLeft', offset: 10 }}
                                />
                                <Tooltip />
                                <Bar dataKey="count" fill={deloitte_theme.ternary} stroke="none" >
                                    <LabelList
                                        dataKey="count"
                                        position="bottom"
                                        offset={-20}
                                        style={{
                                            fontSize: 16,
                                            fontWeight: 600,
                                            fill: deloitte_theme.white,
                                        }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="rounded-2xl shadow-md flex flex-col justify-between h-full w-full"
                    style={{
                        backgroundColor: deloitte_theme.white,
                        padding: deloitte_theme.paddingX,
                    }}
                >
                    <h3 className="text-center text-lg font-semibold text-gray-700">
                        Stage-wise Pending Submission Report
                    </h3>
                    <div className="w-full h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stageWiseData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="stage" />
                                <YAxis
                                    allowDecimals={false}
                                    label={{ value: 'Number', angle: -90, position: 'insideLeft', offset: 10 }}
                                />
                                <Tooltip />
                                <Bar dataKey="count" fill={deloitte_theme.buttonPrimary} stroke="none" >
                                    <LabelList
                                        dataKey="count"
                                        position="bottom"
                                        offset={-20}
                                        style={{
                                            fontSize: 16,
                                            fontWeight: 600,
                                            fill: deloitte_theme.black,
                                        }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Flex>

            <Flex direction="row" gap={deloitte_theme.gap} w="full" align="center">
                <div className="rounded-2xl shadow-md flex flex-col justify-between h-full w-full"
                    style={{
                        backgroundColor: deloitte_theme.white,
                        padding: deloitte_theme.paddingX,
                    }}
                >
                    <h3 className="text-center text-lg font-semibold text-gray-700">
                        Day-wise Submission Report
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

                <div className="rounded-2xl shadow-md flex flex-col justify-between h-full w-[50%]"
                    style={{
                        backgroundColor: deloitte_theme.white,
                        padding: deloitte_theme.paddingX,
                    }}
                >
                    <h3 className="text-center text-lg font-semibold text-gray-700">
                        FY-wise Submission Comparison
                    </h3>
                    <div className="w-full h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={fyWiseData}
                                barCategoryGap="40%"
                                barGap={4}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="fy" />
                                <YAxis
                                    allowDecimals={false}
                                    label={{ value: 'Number', angle: -90, position: 'insideLeft', offset: 10 }}
                                />
                                <Tooltip />
                                <Bar dataKey="totalSubmission" fill={deloitte_theme.buttonSecondary} radius={[8, 8, 0, 0]} barSize={20} />
                                <Bar dataKey="totalApproved" fill={deloitte_theme.ternary} radius={[8, 8, 0, 0]} barSize={25} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Flex>
        </Flex>
    )
}

export default GraphView
