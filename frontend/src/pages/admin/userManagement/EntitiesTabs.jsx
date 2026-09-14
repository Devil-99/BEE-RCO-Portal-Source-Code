import React from "react";
import { Flex, Text, SimpleGrid } from "@chakra-ui/react";
import TableComponent from "../../../components/TableComponent";
import deloitte_theme from "../../../theme";
import {
  useGetAllRegisteredEntityUsersQuery,
} from "../../../redux/apiSlices/adminControlApi";
import SkeletonComponent from "../../../components/SkeletonComponent";
import { useStateName } from "../../../Hooks/useLookUp";
import StatusCard from "../../../components/StatusCard";

const EntitiesTab = ({ registerRefetch, tabId }) => {
  const { data: entities = [], isLoading, refetch } = useGetAllRegisteredEntityUsersQuery();
  const getStateName = useStateName();

  // Register refetch for this tab
  registerRefetch(tabId, refetch);

  // Stats
  const uniqueEntities = Array.from(
    new Map(
      entities.map((item) => [item.entity_reg_no, item])
    ).values()
  );

  const totalRegistrations = uniqueEntities.length;

  const unsuccessfulRegistrations = uniqueEntities.filter(
    (item) => !item.username || item.payment_flag === false
  ).length;

  const successfulRegistrations = uniqueEntities.filter(
    (item) => item.payment_flag === true && !!item.username
  ).length;

  const number_of_SLR = entities.filter(item =>
    item.payment_flag === true && !!item.username && item.role === "SLR"
  ).length;

  const number_of_USR = entities.filter(item =>
    item.payment_flag === true && !!item.username && item.role === "USR"
  ).length;

  const number_of_industry = uniqueEntities.filter(item =>
    item.payment_flag === true && !!item.username && item.entity_type === "INDUSTRY"
  ).length;

  const number_of_discom = uniqueEntities.filter(item =>
    item.payment_flag === true && !!item.username && item.entity_type === "DISCOM"
  ).length;

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
      render: (row) => getStateName(row.state_code) || "N/A",
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
      render: (row) => row.primary_email || "N/A",
    },
    {
      name: "secondary_email",
      header: "Secondary Email",
      width: "250px",
      render: (row) => row.secondary_email || "N/A",
    }
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
          helpText={`Successful - ${successfulRegistrations} | Unsuccessful - ${unsuccessfulRegistrations}`}
        />

        <StatusCard
          title="Total Obligated Users"
          value={number_of_SLR + number_of_USR}
          helpText={`SLR - ${number_of_SLR} | USR - ${number_of_USR}`}
        />

        <StatusCard
          title="Successful Registrations"
          value={successfulRegistrations}
          helpText={`Industry - ${number_of_industry} | Discom - ${number_of_discom}`}
          highlight
        />
      </Flex>

      <TableComponent
        name="Registered Entities"
        data={entities}
        config={entityConfig}
        isFilter
        isDownload
      />
    </Flex>
  );
};

export default EntitiesTab;