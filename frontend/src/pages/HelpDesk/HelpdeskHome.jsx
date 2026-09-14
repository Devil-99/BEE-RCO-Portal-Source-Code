import {
  Box,
  SimpleGrid,
  Text,
  Spinner,
  Badge,
  Flex,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import deloitte_theme from "../../theme";

import {
  useGetDashboardStatsQuery,
  useGetRecentTicketsQuery,
} from "../../redux/apiSlices/helpdesk/helpdeskApi";
import SkeletonComponent from "../../components/SkeletonComponent";

const MotionBox = motion.create(Box);

export default function HelpdeskHome() {
  const { data: stats, isLoading: statsLoading } =
    useGetDashboardStatsQuery();

  const { data: recent = [], isLoading: recentLoading } =
    useGetRecentTicketsQuery();

  if (statsLoading || recentLoading) {
    return (
      <SkeletonComponent/>
    );
  }

  return (
    <Flex direction="column" gap={deloitte_theme.gap} px={deloitte_theme.paddingX} py={deloitte_theme.paddingY}>

      {/* STATS */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <StatCard label="Open" value={stats?.Open} color="#e53e3e" />
        <StatCard label="In Progress" value={stats?.["In Progress"]} color="#dd6b20" />
        <StatCard label="Resolved" value={stats?.Resolved} color="#38a169" />
      </SimpleGrid>

      {/* RECENT */}
      <Flex direction="column" gap={deloitte_theme.gap}>
        <Text fontSize="lg" fontWeight="600" color={deloitte_theme.textPrimary}>
          Latest Ticket Updates (Top 5)
        </Text>

        {recent.length === 0 ? (
          <Text color={deloitte_theme.textSecondary}>
            No recent activity
          </Text>
        ) : (
          <Flex
            direction="column"
            gap={deloitte_theme.gap}
            height="70vh"
            overflowY="auto"
          >
            {recent.map((t, idx) => (
              <MotionBox
                key={idx}
                display="flex"
                flexDirection="column"
                gap={1}
                p={deloitte_theme.paddingX}
                borderRadius="lg"
                bg={deloitte_theme.primary}
                border="1px solid"
                borderColor={deloitte_theme.bordercolor}
                boxShadow="sm"
                _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
                transition="0.2s"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                <Flex justify="space-between" align="center">
                  <Text color={deloitte_theme.textPrimary}>
                    <strong>{t.title}</strong> * {t.category} / {t.subcategory}
                  </Text>

                  <Badge fontSize="md" rounded="md" colorScheme={statusColor(t.priority)}>
                    {t.priority}
                  </Badge>
                </Flex>
                <Text color={deloitte_theme.textSecondary}>
                  <strong>Description:</strong> {t.description}
                </Text>
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color={deloitte_theme.textSecondary}>
                    {new Date(t.created_at).toLocaleString()}
                  </Text>

                  <Text fontSize="sm" color={deloitte_theme.textSecondary}>
                    {t.user_id}
                  </Text>
                </Flex>
              </MotionBox>
            ))}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

function StatCard({ label, value, color }) {
  return (
    <Box
      p={deloitte_theme.paddingY}
      bg={deloitte_theme.white}
      borderRadius="xl"
      border="1px solid"
      borderColor={deloitte_theme.bordercolor}
      borderLeft="6px solid"
      borderLeftColor={color}
      boxShadow="sm"
    >
      <Flex direction="column" gap={2}>
        <Text fontSize="sm" color={deloitte_theme.textSecondary}>
          {label}
        </Text>

        <Text fontSize="2xl" fontWeight="600" color={deloitte_theme.textPrimary}>
          {value ?? 0}
        </Text>
      </Flex>
    </Box>
  );
}

function statusColor(status) {
  switch (status) {
    case "High": return "red";
    case "Medium": return "orange";
    case "Low": return "blue";
    default: return "gray";
  }
}