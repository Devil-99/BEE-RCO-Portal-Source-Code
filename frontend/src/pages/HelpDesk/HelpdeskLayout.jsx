import { Outlet, NavLink } from "react-router-dom";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import deloitte_theme from "../../theme";

const Tab = ({ to, label }) => (
  <NavLink to={to} end>
    {({ isActive }) => (
      <Box
        px={deloitte_theme.paddingX}
        py={deloitte_theme.paddingY}
        rounded="md"
        bg={isActive ? deloitte_theme.formActiveNavbar : "transparent"}
        color={isActive ? deloitte_theme.white : deloitte_theme.textSecondary}
        fontWeight={isActive ? "600" : "normal"}
        _hover={{ bg: deloitte_theme.buttonPrimary }}
      >
        {label}
      </Box>
    )}
  </NavLink>
);

export default function HelpdeskLayout() {
  const { role_code } = useSelector((s) => s.login);

  return (
    <Flex
      direction="column"
      gap={deloitte_theme.gap}
      px={deloitte_theme.paddingX}
      py={deloitte_theme.paddingY}
    >
      <Flex direction="row" justifyContent="space-between">
        <Box>
          <Text fontSize="2xl" fontWeight="600" color={deloitte_theme.textPrimary}>
            Helpdesk
          </Text>
          <Text fontSize="sm" color={deloitte_theme.textSecondary}>
            Support & Issue Tracking System
          </Text>
        </Box>

        <Flex
          gap={deloitte_theme.gap}
          p={deloitte_theme.paddingY}
          bg={deloitte_theme.primary}
          rounded="lg"
          w="fit-content"
        >
          {
            role_code === "ADM" &&
            <Tab to="/helpdesk/overview" label="Overview" />
          }
          <Tab to="/helpdesk" label="Create Ticket" />
          <Tab to="/helpdesk/my-tickets" label="My Tickets" />
          {
            role_code !== "ADM" &&
            <Tab to="/helpdesk/need-assistance" label="Need Assistance" />
          }
        </Flex>
      </Flex>

      <Box>
        <Outlet />
      </Box>
    </Flex>
  );
}
