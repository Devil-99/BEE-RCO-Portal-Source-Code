import { useState } from "react";
import { Flex, Heading, Button, IconButton } from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import TableComponent from "../../components/TableComponent";
import deloitte_theme from "../../theme";
import ConfirmModal from "../../components/ConfirmModal";
import AddEnergyAuditorModal from "./AddEnergyAuditorModal";
import { showToast } from "../../components/toastService";
import {
  useGetAEAQuery,
  useDeleteAEAMutation,
} from "../../redux/apiSlices/AEAControlApi";
import SkeletonComponent from "../../components/SkeletonComponent";
import UploadAEAModal from "./UploadAEAModal.jsx";

const AEAForm = () => {
  const { data: aeaRegs = [], isLoading, refetch } = useGetAEAQuery();
  const [deleteAea] = useDeleteAEAMutation();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const openAddModal = () => {
    setSelectedRow(null);
    setAddModalOpen(true);
  };

  const handleRowSelect = (row) => {
    setSelectedRow(row);
    setAddModalOpen(true);
  };

  const openDelete = (aeaId) => {
    setToDelete(aeaId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!toDelete) return;
    try {
      await deleteAea(toDelete).unwrap();
      refetch();
    } catch (error) {
      showToast({
        title: "Error",
        description: error?.data?.detail || "Failed to delete the record.",
        status: "error",
      });
    } finally {
      setToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const config = [
    {
      name: 'aea_id',
      header: 'AEA ID',
      numeric: false,
      render: (row) => row.aea_id,
    },
    {
      name: 'full_name',
      header: 'Auditor Name',
      numeric: false,
      width: '250px',
      render: (row) => row.full_name,
    },
    {
      name: 'email',
      header: 'Email',
      numeric: false,
      width: '250px',
      render: (row) => row.email,
    },
    {
      name: 'mobile',
      header: 'Mobile',
      numeric: true,
      render: (row) => row.mobile,
    },
    {
      name: 'valid_from',
      header: 'Valid From',
      numeric: true,
      render: (row) => row.valid_from,
    },
    {
      name: 'valid_to',
      header: 'Valid To',
      numeric: true,
      render: (row) => row.valid_to,
    },
    {
      name: 'source_type',
      header: 'Source Type',
      numeric: false,
      render: (row) => row.source_type,
    }
  ]

  const handleUploadExcel = () => {
    setUploadModalOpen(true);
  };

  return (
    <Flex direction="column" gap={deloitte_theme.gap}>
      {/* ------- HEADER -------- */}
      <Flex justify="space-between" alignItems="center">
        <Heading size="md">Accredited Energy Auditor Management</Heading>
        <Flex gap={deloitte_theme.gap}>
          <IconButton
            aria-label="Refresh Entities"
            icon={<RepeatIcon />}
            onClick={refetch}
            colorScheme="green"
            isRound
            boxShadow="md"
          />
          <Button
              bg={deloitte_theme.buttonPrimary}
              color={deloitte_theme.white}
              _hover={{
                bg: deloitte_theme.buttonHoverPrimary
              }}
              onClick={handleUploadExcel}
          >
            Upload Excel
          </Button>
          <Button bg={deloitte_theme.buttonSecondary} onClick={openAddModal}>
            Add AEA
          </Button>
        </Flex>
      </Flex>

      {/* -------- TABLE ---------- */}
      {
        isLoading ?
          <SkeletonComponent />
          :
          <TableComponent
            name="Registered AEA"
            config={config}
            data={aeaRegs}
            isFilter
            handleRowSelect={handleRowSelect}
            enableDelete

          />
      }

      {/* -------- MODALS -------- */}
      <AddEnergyAuditorModal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setSelectedRow(null);
        }}
        selectedRow={selectedRow}
        refetch={refetch}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirmed}
        title="Confirm Deletion"
        body="Are you sure you want to delete this record? This action cannot be undone."
      />
      <UploadAEAModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          refetch={refetch}
      />
    </Flex>
  );
};

export default AEAForm;
