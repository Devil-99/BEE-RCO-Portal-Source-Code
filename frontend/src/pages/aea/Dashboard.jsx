import React from 'react'
import { Divider, Flex, Heading, Stack } from "@chakra-ui/react"
import UserDetailCard from '../../components/UserDetailCard';
import { useSelector } from "react-redux";
import deloitte_theme from '../../theme';

function Dashboard() {
  const userDetails = useSelector(state => state.login);

  return (
    <Flex>
      <Stack spacing={deloitte_theme.gap}>
        <Heading as="h2"
          fontSize="lg"
          color={deloitte_theme.textPrimary}
          textAlign="center"
          py={deloitte_theme.paddingY}
        >
          User Details
        </Heading>
        <Divider />
        <UserDetailCard userDetails={userDetails} />
      </Stack>
    </Flex>
  )
}

export default Dashboard