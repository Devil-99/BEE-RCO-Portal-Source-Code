import React from 'react'
import { Flex } from "@chakra-ui/react"
import EntityDetailCard from '../../components/EntityDetailCard';
import SummaryReport from "../mop/SummaryReport.jsx";
import deloitte_theme from "../../theme.js";

function Dashboard() {
    return (
        <Flex direction="column" gap={deloitte_theme.gap}>
            <EntityDetailCard />
            <SummaryReport  />
        </Flex>
    )
}

export default Dashboard