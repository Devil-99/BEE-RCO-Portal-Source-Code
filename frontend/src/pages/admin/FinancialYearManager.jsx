import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  useToast,
} from "@chakra-ui/react";

import ConfirmModal from "../../components/ConfirmModal";
import SubmissionPeriodManager from "./SubmissionPeriodManager"; 
import TableComponent from "../../components/TableComponent";
import { useSelector } from "react-redux";
import {
  useAddFinancialYearMutation,
  useUpdateFinancialYearMutation,
  useDeleteFinancialYearMutation,
} from "../../redux/apiSlices/finanicalYearControlApi";

const emptyFinancialYear = {
  id: "",
  fy_code: "",
  start_date: "",
  end_date: "",
};

const FinancialYearManager = () => {
  const [currentFY, setCurrentFY] = useState(emptyFinancialYear);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAction, setDeleteAction] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();

  //Getting financial years from Redux state instead of API
  const { financialYears } = useSelector((state) => state.commonState);

  const [addFinancialYear] = useAddFinancialYearMutation();
  const [updateFinancialYear] = useUpdateFinancialYearMutation();
  const [deleteFinancialYear] = useDeleteFinancialYearMutation();

  const openFormForEdit = (fy) => {
    setCurrentFY({
      id: fy.id,
      fy_code: fy.fy_code,
      start_date: fy.start_date,
      end_date: fy.end_date,
    });
    setEditId(fy.id);
    onFormOpen();
  };

  const openFormForCreate = () => {
    setCurrentFY(emptyFinancialYear);
    setEditId(null);
    onFormOpen();
  };

  const handleSubmit = async () => {
    const { fy_code, start_date, end_date } = currentFY;

    if (!fy_code || !start_date || !end_date) {
      return toast({
        title: "All fields are required",
        status: "warning",
      });
    }

    const diff = (new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24);
    if (diff < 0)
      return toast({ title: "End Date must be after Start Date", status: "warning" });
    if (diff > 366)
      return toast({ title: "Duration must not exceed 366 days", status: "warning" });

    const payload = { fy_code, start_date, end_date };
    setSubmitting(true);

    try {
      if (editId) {
        await updateFinancialYear({ id: editId, ...payload }).unwrap();
        toast({ title: "Updated successfully", status: "success" });
      } else {
        await addFinancialYear(payload).unwrap();
        toast({ title: "Created successfully", status: "success" });
      }

      onFormClose();
      setCurrentFY(emptyFinancialYear);
      setEditId(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error?.data?.detail || error?.error || "Unknown error",
        status: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteFinancialYear(deleteId).unwrap();
      toast({ title: "Deleted successfully", status: "success" });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error?.data?.detail || error?.error,
        status: "error",
      });
    } finally {
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  useEffect(() => {
    if (deleteAction && deleteId !== null) {
      handleDelete();
      setDeleteAction(false);
    }
  }, [deleteAction, deleteId]);

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Financial Year Management</Heading>
        <Button colorScheme="blue" onClick={openFormForCreate}>
          Add Financial Year
        </Button>
      </Flex>

      {/* Table using Redux state */}
      <TableComponent
        name="Financial Years"
        data={financialYears}
        isFilter
        noDataMessage="No financial years found."
        onEdit={openFormForEdit}
        onDelete={confirmDelete}
        columns={[
          { key: "fy_code", label: "FY Code" },
          { key: "start_date", label: "Start Date" },
          { key: "end_date", label: "End Date" },
        ]}
      />

      {/* Create / Edit Modal */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editId ? "Edit Financial Year" : "Add Financial Year"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editId && (
              <FormControl mb={4} isDisabled>
                <FormLabel>ID</FormLabel>
                <Input value={currentFY.id} readOnly />
              </FormControl>
            )}

            <FormControl mb={4}>
              <FormLabel>FY Code</FormLabel>
              <Input
                placeholder="2025-26"
                value={currentFY.fy_code}
                onChange={(e) => setCurrentFY((prev) => ({ ...prev, fy_code: e.target.value }))}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Start Date</FormLabel>
              <Input
                type="date"
                value={currentFY.start_date}
                onChange={(e) => setCurrentFY((prev) => ({ ...prev, start_date: e.target.value }))}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>End Date</FormLabel>
              <Input
                type="date"
                value={currentFY.end_date}
                onChange={(e) => setCurrentFY((prev) => ({ ...prev, end_date: e.target.value }))}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button onClick={onFormClose} mr={3}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={submitting}
              loadingText={editId ? "Updating" : "Creating"}
            >
              {editId ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        setAction={setDeleteAction}
      />

      {/* Submission Period Manager */}
      <Box mt={10}>
        <SubmissionPeriodManager />
      </Box>
    </Box>
  );
};

export default FinancialYearManager;
