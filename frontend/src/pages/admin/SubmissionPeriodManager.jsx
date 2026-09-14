import { useState, useEffect } from "react";
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
  Select,
  FormErrorMessage,
} from "@chakra-ui/react";
import ConfirmModal from "../../components/ConfirmModal";
import TableComponent from "../../components/TableComponent";
import { useCreateSubmissionPeriodMutation, useDeleteSubmissionPeriodMutation } from "../../redux/apiSlices/submissionPeriodControlApi";
import { useSelector } from "react-redux";

const emptySubmissionPeriod = {
  id: "",
  period_code: "",
  fy_id: "",
  start_date: "",
  end_date: "",
};

const uniquePeriodCodes = ["Q1", "Q2", "Q3", "Q4", "ANNUAL"];

const SubmissionPeriodManager = () => {
  const [current, setCurrent] = useState(emptySubmissionPeriod);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAction, setDeleteAction] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const toast = useToast();

  //commonState for financial years and submission periods
  const { financialYears, submissionPeriods } = useSelector((state) => state.commonState);

  const [submitPeriod] = useCreateSubmissionPeriodMutation();
  const [deletePeriod] = useDeleteSubmissionPeriodMutation();

  const parseErrorMessage = (error) => {
    if (!error) return "Unknown error";
    if (typeof error === "string") return error;
    if (Array.isArray(error)) return error.join(", ");
    if (typeof error === "object") {
      for (const key in error) {
        if (Array.isArray(error[key])) return error[key].join(", ");
        if (typeof error[key] === "string") return error[key];
      }
    }
    return "An error occurred";
  };

  const openFormForEdit = (item) => {
    setCurrent({
      id: item.id,
      period_code: item.period_code,
      fy_id: item.financial_year?.id || "",
      start_date: item.start_date,
      end_date: item.end_date,
    });
    setEditId(item.id);
    setFormErrors({});
    onFormOpen();
  };

  const openFormForCreate = () => {
    setCurrent(emptySubmissionPeriod);
    setEditId(null);
    setFormErrors({});
    onFormOpen();
  };

  const handleSubmit = async () => {
    const { fy_id, period_code, start_date, end_date } = current;
    if (!fy_id || !period_code || !start_date || !end_date) {
      setFormErrors({
        fy_id: !fy_id ? "Financial Year is required" : "",
        period_code: !period_code ? "Period Code is required" : "",
        start_date: !start_date ? "Start Date is required" : "",
        end_date: !end_date ? "End Date is required" : "",
      });
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = { ...current };
      if (editId) payload.id = editId;

      await submitPeriod(payload).unwrap();
      toast({ title: editId ? "Updated successfully" : "Created successfully", status: "success", duration: 3000 });
      onFormClose();
      setCurrent(emptySubmissionPeriod);
      setEditId(null);
    } catch (error) {
      toast({
        title: "Submission Error",
        description: parseErrorMessage(error?.data?.detail) || "Unknown error",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePeriod(deleteId).unwrap();
      toast({ title: "Deleted successfully", status: "info", duration: 3000 });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: parseErrorMessage(error?.data?.detail) || "Unknown error",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  useEffect(() => {
    if (deleteAction && deleteId) {
      handleDelete();
      setDeleteAction(false);
    }
  }, [deleteAction, deleteId]);

  return (
    <Box p={6} mt={10}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Submission Period Management</Heading>
        <Button colorScheme="blue" onClick={openFormForCreate}>
          Add Submission Period
        </Button>
      </Flex>

      <TableComponent
        name="Submission Periods"
        data={submissionPeriods.map((item) => ({
          id: item.id,
          period_code: item.period_code,
          fy_code: item.financial_year?.fy_code || "-",
          start_date: item.start_date,
          end_date: item.end_date,
        }))}
        onEdit={openFormForEdit}
        onDelete={confirmDelete}
      />

      {/* Modal */}
      <Modal isOpen={isFormOpen} onClose={onFormClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editId ? "Edit Submission Period" : "Add Submission Period"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editId && (
              <FormControl mb={4} isDisabled>
                <FormLabel>ID</FormLabel>
                <Input value={current.id} isReadOnly />
              </FormControl>
            )}

            <FormControl mb={4} isRequired isInvalid={!!formErrors.fy_id}>
              <FormLabel>Financial Year (FY Code)</FormLabel>
              <Select
                placeholder="Select FY Code"
                value={current.fy_id}
                onChange={(e) => setCurrent((prev) => ({ ...prev, fy_id: e.target.value, period_code: "" }))}
              >
                {financialYears.map((fy) => (
                  <option key={fy.id} value={fy.id}>
                    {fy.fy_code}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl mb={4} isRequired isInvalid={!!formErrors.period_code}>
              <FormLabel>Period Code</FormLabel>
              <Select
                placeholder="Select period code"
                value={current.period_code}
                onChange={(e) => setCurrent((prev) => ({ ...prev, period_code: e.target.value }))}
                isDisabled={!current.fy_id}
              >
                {uniquePeriodCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl mb={4} isRequired isInvalid={!!formErrors.start_date}>
              <FormLabel>Start Date</FormLabel>
              <Input
                type="date"
                value={current.start_date}
                onChange={(e) => setCurrent((prev) => ({ ...prev, start_date: e.target.value }))}
              />
            </FormControl>

            <FormControl mb={4} isRequired isInvalid={!!formErrors.end_date}>
              <FormLabel>End Date</FormLabel>
              <Input
                type="date"
                value={current.end_date}
                onChange={(e) => setCurrent((prev) => ({ ...prev, end_date: e.target.value }))}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button mr={3} onClick={onFormClose} isDisabled={submitLoading}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit} isLoading={submitLoading}>
              {editId ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        setAction={setDeleteAction}
      />
    </Box>
  );
};

export default SubmissionPeriodManager;
