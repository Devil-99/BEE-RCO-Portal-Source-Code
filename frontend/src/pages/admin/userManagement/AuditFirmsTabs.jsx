import React from "react";
import { Flex, Text, SimpleGrid } from "@chakra-ui/react";
import TableComponent from "../../../components/TableComponent";
import SkeletonComponent from "../../../components/SkeletonComponent";
import { useGetRegisteredAuditFirmsQuery } from "../../../redux/apiSlices/auditFirmControlApi";
import { useStateName } from "../../../Hooks/useLookUp";
import deloitte_theme from "../../../theme";
import StatusCard from "../../../components/StatusCard";

const AuditFirmTabs = ({ registerRefetch, tabId }) => {
  const { data: registeredFirms = [], isLoading, refetch } =
    useGetRegisteredAuditFirmsQuery();
    console.log("Audit Firm");
    

  const getStateName = useStateName();

  // Register refetch for this tab
  registerRefetch(tabId, refetch);

  // Stats
  const totalRegistrations = registeredFirms.length;

  const unsuccessfulRegistrations = registeredFirms.filter(
    (item) => !item.username || item.payment_flag === false
  ).length;

  const successfulRegistrations = registeredFirms.filter(
    (item) => item.payment_flag === true && !!item.username
  ).length;

  const firmConfig = [
    {
      name: "firm_name",
      header: "Firm Name",
      render: (row) => row.firm_name,
    },
    {
      name: "entity_reg_no",
      header: "Entity Reg No",
      render: (row) => row.entity_reg_no,
    },
    {
      name: "username",
      header: "Username",
      render: (row) => row.username,
    },
    {
      name: "full_name",
      header: "Contact Person",
      render: (row) => row.full_name || "N/A",
    },
    {
      name: "email",
      header: "Email",
      width: "250px",
      render: (row) => row.email || "N/A",
    },
    {
      name: "mobile",
      header: "Mobile",
      render: (row) => row.mobile || "N/A",
    },
    {
      name: "state_code",
      header: "State",
      render: (row) => getStateName(row.state_code) || "N/A",
    },
  ];

  if (isLoading) return <SkeletonComponent />;

  return (
    <Flex
      direction="column"
      gap={deloitte_theme.gap}
    >
      <Text fontSize="lg" fontWeight="semibold" color={deloitte_theme.textPrimary}>
        Registration Summary
      </Text>

      <Flex w="full" gap={deloitte_theme.gap} wrap="wrap">
        <StatusCard
          title="Total Registrations"
          value={totalRegistrations}
        />

        <StatusCard
          title="Unsuccessful Registrations"
          value={unsuccessfulRegistrations}
        />

        <StatusCard
          title="Successful Registrations"
          value={successfulRegistrations}
          highlight
        />
      </Flex>

      <TableComponent
        name="Registered Audit Firms"
        data={registeredFirms}
        config={firmConfig}
        isFilter
        isDownload
      />
    </Flex>
  );
};

export default AuditFirmTabs;