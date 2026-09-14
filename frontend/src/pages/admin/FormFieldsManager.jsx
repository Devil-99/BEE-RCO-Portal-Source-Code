import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  Flex,
  Text,
  useDisclosure,
  useToast,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import instance from "../../api_instance";
import ConfirmModal from "../../components/ConfirmModal";
import TableComponent from "../../components/TableComponent";

function FormFieldsManager() {
  const toast = useToast();
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [typeOptions, setTypeOptions] = useState([]);
  const [fieldForm, setFieldForm] = useState({
    acronym: "",
    field_name: "",
    type: "",
    serial: "",
    unit: "MU",
    part: "",
  });
  const [editingFieldId, setEditingFieldId] = useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [confirmAction, setConfirmAction] = useState(null);
  const [fieldToDeleteId, setFieldToDeleteId] = useState(null);

  // New loading state for submit button
  const [submitting, setSubmitting] = useState(false);

  const { data: fieldsData, isLoading: loadingFieldsData, refetch: refetchFields } = useGetFieldsQuery('form');

  useEffect(() => {
    setLoadingFields(loadingFieldsData);
    if (fieldsData) {
      setFields(fieldsData || []);
      if (!editingFieldId && fieldsData?.length) {
        const maxSerial = Math.max(...fieldsData.map((f) => f.serial || 0));
        setFieldForm((prev) => ({ ...prev, serial: maxSerial + 1 }));
      }
    }
  }, [fieldsData, loadingFieldsData, editingFieldId]);

  const fetchTypeOptions = async () => {
    try {
      const res = await instance.get("/form/field-types");
      setTypeOptions(res.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchFields();
    fetchTypeOptions();
  }, []);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFieldForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrUpdateField = async () => {
    if (!fieldForm.acronym || !fieldForm.field_name) {
      toast({
        title: "Please fill acronym and field name",
        status: "warning",
        isClosable: true,
      });
      return;
    }

    if (!editingFieldId && fieldForm.serial) {
      const isDuplicateSerial = fields.some(
        (f) => f.serial === Number(fieldForm.serial)
      );
      if (isDuplicateSerial) {
        toast({
          title: "Serial already exists. Please use a different one.",
          status: "error",
          isClosable: true,
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      if (editingFieldId) {
        await instance.put(`/form/fields/${editingFieldId}`, {
          ...fieldForm,
          serial: Number(fieldForm.serial),
        });
        toast({
          title: "Form field updated",
          status: "success",
          isClosable: true,
        });
        setEditingFieldId(null);
      } else {
        await instance.post("/form/fields", {
          ...fieldForm,
          serial: Number(fieldForm.serial),
        });
        toast({
          title: "Form field added",
          status: "success",
          isClosable: true,
        });
      }

      setFieldForm({
        acronym: "",
        field_name: "",
        type: "",
        serial: "",
        unit: "MU",
        part: "",
      });
      // fields are automatically fetched by RTK Query; ensure type options still loaded
      fetchTypeOptions();
    } catch (error) {
      toast({
        title: error.response?.data.detail || "Failed to process request",
        status: "error",
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteField = async (id) => {
    try {
      await instance.delete(`/form/fields/${id}`);
      toast({
        title: "Field deleted successfully",
        status: "success",
        isClosable: true,
      });
      // Refetch fields after mutation
      refetchFields();
    } catch (error) {
      toast({
        title: error.response?.data.detail || "Failed to delete form field",
        status: "error",
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    if (confirmAction === true && fieldToDeleteId !== null) {
      handleDeleteField(fieldToDeleteId);
      setConfirmAction(null);
      setFieldToDeleteId(null);
    }
  }, [confirmAction]);

  return (
    <Box maxW="900px" mx="auto" p={6} fontFamily="Inter, sans-serif">
      <Heading
        mb={6}
        fontWeight="extrabold"
        fontSize="3xl"
        color="teal.700"
        letterSpacing="wide"
        textAlign="center"
      >
        Form Fields Management
      </Heading>

      <Box mb={10} p={5} borderWidth={1} borderRadius="md" borderColor="gray.200">
        <Heading fontSize="xl" mb={4}>
          Add New / Edit Form Field
        </Heading>
        <Stack spacing={4}>
          <FormControl>
            <FormLabel>Serial</FormLabel>
            <Input
              name="serial"
              type="number"
              value={fieldForm.serial}
              onChange={handleFieldChange}
              placeholder="Auto assigned if blank"
              min={1}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Field Name</FormLabel>
            <Input
              name="field_name"
              value={fieldForm.field_name}
              onChange={handleFieldChange}
              placeholder="Descriptive Field Name"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Acronym</FormLabel>
            <Input
              name="acronym"
              value={fieldForm.acronym}
              onChange={handleFieldChange}
              placeholder="nomenclature"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Unit</FormLabel>
            <Input
              name="unit"
              value={fieldForm.unit}
              onChange={handleFieldChange}
              placeholder="e.g. MU"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Part</FormLabel>
            <Input
              name="part"
              value={fieldForm.part}
              onChange={handleFieldChange}
              placeholder="A , B, C etc."
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Type</FormLabel>
            <Input
              name="type"
              list="type-options"
              value={fieldForm.type}
              onChange={handleFieldChange}
              placeholder="Select or enter a type"
            />
            <datalist id="type-options">
              {typeOptions.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
          </FormControl>

          <Flex justify="flex-end">
            <Button
              colorScheme="teal"
              onClick={handleAddOrUpdateField}
              isLoading={submitting}
              loadingText={editingFieldId ? "Updating..." : "Adding..."}
            >
              {editingFieldId ? "Update Field" : "Add Field"}
            </Button>
          </Flex>
        </Stack>
      </Box>


     <Box mb={10} p={5} borderWidth={1} borderRadius="md" borderColor="gray.200">
        <Heading fontSize="xl" mb={4}>
          Existing Form Fields
        </Heading>

        {loadingFields ? (
          <Text>Loading...</Text>
        ) : (
          <TableComponent
            name="Existing Form Fields"
            data={fields.map((field) => ({
              serial: field.serial,
              field_name: field.field_name,
              acronym: field.acronym,
              unit: field.unit,
              part: field.part,
              type: field.type,
            }))}
            isFilter
            noDataMessage="No form fields added yet."
            tableProps={{ variant: "striped", colorScheme: "gray", size: "md" }}
          />
        )}
      </Box>





      {/* ✅ Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isOpen}
        onClose={onClose}
        setAction={setConfirmAction}
      />
    </Box>
  );
}

export default FormFieldsManager;
