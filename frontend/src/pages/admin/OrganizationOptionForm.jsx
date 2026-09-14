// src/pages/Organization/OrganizationManager.js
import { Flex, Heading, Button, Spinner } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import TableComponent from "../../components/TableComponent";
import AddOrganizationModal from "./AddOrganizationModal";
import deloitte_theme from "../../theme";
import SkeletonComponent from "../../components/SkeletonComponent";
import { useSectorName, useStateName } from "../../Hooks/useLookUp";

const OrganizationManager = () => {
  const { states, sectorTypes, organizationOptions } = useSelector(
    (state) => state.commonState
  );
  const getStateName = useStateName();
  const getSectorName = useSectorName();

  const [addModal, setAddModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const handleRowSelect = (row) => {
    setSelectedRow(row);
    setAddModal(true);
  };

  const handleAddModal = () => {
    setSelectedRow(null);
    setAddModal(true);
  };

  const orgOptionsConfig = [
    {
      header: "Entity Type",
      name: "entity_type",
      numeric: false,
      width: "200px",
      render: (row) => row.entity_type,
    },
    {
      header: "State Code",
      name: "state_code",
      numeric: false,
      width: "200px",
      render: (row) => getStateName(row.state_code),
    },
    {
      header: "Organization Name",
      name: "organization_name",
      numeric: false,
      width: "300px",
      render: (row) => row.organization_name,
    },
    {
      header: "Organization Code",
      name: "organization_code",
      numeric: false,
      width: "200px",
      render: (row) => row.organization_code,
    },
    {
      header: "Sector Type",
      name: "sector_type",
      numeric: false,
      width: "200px",
      render: (row) => getSectorName(row.sector_type),
    },
    {
      header: "Address",
      name: "address",
      numeric: false,
      width: "300px",
      render: (row) => row.address,
    }
  ];

  if (!states.length || !sectorTypes.length || !organizationOptions.length) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <SkeletonComponent />
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap={deloitte_theme.gap}>
      <Flex justifyContent="space-between" alignItems="center">
        <Heading size="md">Organization Options Management</Heading>
        <Button bg={deloitte_theme.buttonSecondary} onClick={handleAddModal}>
          Add Organization
        </Button>
      </Flex>

      <TableComponent
        name="Organizations"
        data={organizationOptions}
        config={orgOptionsConfig}
        isFilter
        isDownload
        handleRowSelect={handleRowSelect}
        isLoading={!organizationOptions.length}
      />

      <AddOrganizationModal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        selectedRow={selectedRow}
      />
    </Flex>
  );
};

export default OrganizationManager;
