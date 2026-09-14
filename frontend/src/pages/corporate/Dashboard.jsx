import React from 'react'
import { Flex } from '@chakra-ui/react';
import EntityDetailCard from '../../components/EntityDetailCard';
import deloitte_theme from '../../theme';
import SubmissionDetails from './SubmissionDetails';

function Dashboard() {
    return (
        <Flex direction={"column"} gap={deloitte_theme.gap} >
            <EntityDetailCard />
            <SubmissionDetails />
        </Flex>
    )
}

export default Dashboard