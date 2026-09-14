import React from 'react';
import { Box, Text, VStack, Icon, Center } from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';
import deloitte_theme from '../theme';

function DowntimePage({
    title = "Website Unavailable",
    message = "Due to Scheduled Maintenance",
    expectedDowntime = "3-4 hours"
}) {
    return (
        <Center maxH="full">
            <Box
                bg={deloitte_theme.primary}
                p={8}
                borderRadius="lg"
                boxShadow="xl"
                textAlign="center"
                maxW="md"
                border={`2px solid ${deloitte_theme.secondary}`}
            >
                <VStack spacing={4}>
                    <Icon as={WarningIcon} w={12} h={12} color={deloitte_theme.secondary} />
                    <Text fontSize="2xl" fontWeight="bold" color={deloitte_theme.textPrimary}>
                        {title}
                    </Text>
                    <Text fontSize="lg" color={deloitte_theme.textSecondary}>
                        {message}
                    </Text>
                    <Text fontSize="md" color={deloitte_theme.textSecondary}>
                        We apologize for the inconvenience. Our team is working to improve the service.
                    </Text>
                    <Text fontSize="sm" color={deloitte_theme.textSecondary}>
                        Expected downtime: {expectedDowntime}
                    </Text>
                    <Text fontSize="sm" color={deloitte_theme.textSecondary}>
                        For urgent inquiries, please contact support email at RCO.support@beeindia.gov.in or call +91(11)26766750, 26766700
                    </Text>
                </VStack>
            </Box>
        </Center>
    );
}

export default DowntimePage;