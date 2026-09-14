import React from "react";
import { Flex, Text, Box, Heading, Divider } from "@chakra-ui/react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Cell,
} from "recharts";
import TableComponent from "../../../components/TableComponent";
import deloitte_theme from "../../../theme";
import {
    useGetAllRegisteredNobeUsersQuery,
} from "../../../redux/apiSlices/adminControlApi";
import SkeletonComponent from "../../../components/SkeletonComponent";
import { useStateName } from "../../../Hooks/useLookUp";
import StatusCard from "../../../components/StatusCard";

const ROLE_COLOR = deloitte_theme.ternary;

const NonObligatedTab = ({ registerRefetch, tabId }) => {
    const {
        data: users = [],
        isLoading,
        refetch,
    } = useGetAllRegisteredNobeUsersQuery();

    const getStateName = useStateName();

    // Register refetch for this tab
    registerRefetch(tabId, refetch);

    // Stats
    const uniqueEntities = Array.from(
        new Map(
            users.map((item) => [item.entity_reg_no, item])
        ).values()
    );

    const totalRegistrations = uniqueEntities.length;

    const unsuccessfulRegistrations = uniqueEntities.filter(
        (item) => !item.username || item.payment_flag === false
    ).length;

    const successfulRegistrations = uniqueEntities.filter(
        (item) => item.payment_flag === true && !!item.username
    ).length;

    // NOBE ROLE COUNTS
    const roleCounts = users.length > 0 && users.reduce((acc, item) => {
        acc[item.role] = (acc[item.role] || 0) + 1;
        return acc;
    }, {});

    // TOTAL SUCCESSFUL NOBE USERS
    const totalNobeUsers = users.length
    // TOTAL ROLES HAVING AT LEAST ONE SUCCESSFUL USER
    const totalNobeRoles = Object.keys(roleCounts).length;

    // ROLE BREAKDOWN
    const roleBreakdown = Object.entries(roleCounts).map(([role, count]) => ({
        role,
        count,
    }));

    const entityConfig = [
        {
            name: "entity_reg_no",
            header: "Entity Reg. No",
            width: "220px",
            render: (row) => row.entity_reg_no,
        },
        {
            name: "org_name",
            header: "Organization",
            width: "250px",
            render: (row) => row.org_name,
        },
        {
            name: "state_code",
            header: "State",
            render: (row) =>
                getStateName(row.state_code) || "N/A",
        },
        {
            name: "role",
            header: "Role",
            render: (row) => row.role || "N/A",
        },
        {
            name: "full_name",
            header: "Name",
            width: "220px",
            render: (row) => row.full_name,
        },
        {
            name: "mobile",
            header: "Mobile",
            render: (row) => row.mobile || "N/A",
        },
        {
            name: "primary_email",
            header: "Primary Email",
            width: "250px",
            render: (row) =>
                row.primary_email || "N/A",
        },
        {
            name: "secondary_email",
            header: "Secondary Email",
            width: "250px",
            render: (row) =>
                row.secondary_email || "N/A",
        },
    ];

    if (isLoading) {
        return <SkeletonComponent />;
    }

    return (
        <Flex
            direction="column"
            gap={deloitte_theme.gap}
        >
            {/* Registration Summary */}

            <Text
                fontSize="lg"
                fontWeight="semibold"
                color={deloitte_theme.textPrimary}
            >
                Registration Summary
            </Text>

            <Flex gap={5} px={5}>
                <Flex
                    direction="column"
                    w="30%"
                    gap={deloitte_theme.gap}
                    wrap="wrap"
                >
                    {/* Total NOBE Registrations */}

                    <StatusCard
                        title="Total NOBE Registration"
                        value={totalRegistrations}
                        helpText={`Successful - ${successfulRegistrations} | Unsuccessful - ${unsuccessfulRegistrations}`}
                    />

                    {/* Total NOBE Users */}

                    <StatusCard
                        title="Total NOBE Users"
                        value={totalNobeUsers}
                        helpText={`Across ${totalNobeRoles} roles`}
                        highlight
                    />

                </Flex>

                {/* ROLE-WISE BAR GRAPH */}
                {roleBreakdown.length > 0 && (
                    <Box
                        w="full"
                        h="300px"
                        bg="white"
                        p={deloitte_theme.paddingX}
                    >
                        <Heading textAlign="center" fontSize="lg">
                            Entity Type Breakdown
                        </Heading>
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <BarChart
                                data={roleBreakdown}
                                margin={{
                                    top: 25,
                                    right: 20,
                                    left: 10,
                                    bottom: 20,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />

                                {/* X Axis - Roles */}

                                <XAxis
                                    dataKey="role"
                                    tick={{
                                        fill: "#4A5568",
                                        fontSize: 12,
                                        fontWeight: 500,
                                    }}
                                    tickLine={{
                                        stroke: "#CBD5E0",
                                    }}
                                    axisLine={{
                                        stroke: "#CBD5E0",
                                    }}
                                />

                                {/* Y Axis - Users */}

                                <YAxis
                                    type="number"
                                    allowDecimals={false}
                                    tick={{
                                        fill: "#4A5568",
                                        fontSize: 12,
                                    }}
                                    tickLine={{
                                        stroke: "#CBD5E0",
                                    }}
                                    axisLine={{
                                        stroke: "#CBD5E0",
                                    }}
                                />

                                <Tooltip
                                    cursor={{
                                        fill: "rgba(0,0,0,0.04)",
                                    }}
                                    contentStyle={{
                                        borderRadius: "8px",
                                        border: "none",
                                        boxShadow:
                                            "0 2px 8px rgba(0,0,0,0.12)",
                                    }}
                                    formatter={(value) => [
                                        value,
                                        "Users",
                                    ]}
                                />

                                {/* Vertical Bars */}

                                <Bar
                                    dataKey="count"
                                    name="Users"
                                    radius={[
                                        4,
                                        4,
                                        0,
                                        0,
                                    ]}
                                    maxBarSize={55}
                                    label={{
                                        position: "top",
                                        fill: "#ffffff",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        offset: -20
                                    }}
                                >
                                    {roleBreakdown.map(
                                        (_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={ROLE_COLOR}
                                            />
                                        )
                                    )}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                )}
            </Flex>

            <Divider py={deloitte_theme.paddingY} borderColor="gray.400" />

            <TableComponent
                name="Registered NOBE Users"
                data={users}
                config={entityConfig}
                isFilter
                isDownload
            />
        </Flex>
    );
};

export default NonObligatedTab;