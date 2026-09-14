import React, { useState } from "react";
import { Flex, Text, SimpleGrid } from "@chakra-ui/react";
import TableComponent from "../../../components/TableComponent";
import SkeletonComponent from "../../../components/SkeletonComponent";
import { useGetRegisteredAEAQuery } from "../../../redux/apiSlices/AEAControlApi";
import deloitte_theme from "../../../theme";
import StatusCard from "../../../components/StatusCard";
import UpdateUserModal from "./UpdateUserModal";

const AEATabs = ({ registerRefetch, tabId }) => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: registeredAea = [], isLoading, refetch } =
    useGetRegisteredAEAQuery();

  registerRefetch(tabId, refetch);

  const totalRegistrations = registeredAea.length;

  const handleEdit = (row) => {
    setSelectedRow(row);
    setIsModalOpen(true);
  };

  const aeaConfig = [
    {
      name: "aea_id",
      header: "AEA ID",
      render: (row) => row.aea_id,
    },
    {
      name: "full_name",
      header: "Auditor Name",
      width: "250px",
      render: (row) => row.full_name,
    },
    {
      name: "primary_email",
      header: "Email",
      width: "250px",
      render: (row) => row.primary_email,
    },
    {
      name: "mobile",
      header: "Mobile",
      render: (row) => row.mobile,
    },
    {
      name: "updated_at",
      header: "Registered At",
      render: (row) => {
        if (!row?.updated_at) return "N/A";
        const d = new Date(row.updated_at);
        return isNaN(d.getTime())
          ? "N/A"
          : d.toLocaleDateString("en-GB");
      },
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
      </Flex>

      <TableComponent
        name="Registered Energy Auditors"
        data={registeredAea}
        config={aeaConfig}
        isFilter
        isDownload
        handleRowSelect={handleEdit}
      />

      <UpdateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedUser={selectedRow}
        refetch={refetch}
      />
    </Flex>
  );
};

export default AEATabs;