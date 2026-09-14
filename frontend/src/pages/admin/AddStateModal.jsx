import { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
} from "@chakra-ui/react";
import deloitte_theme from "../../theme";
import { showToast } from "../../components/toastService";
import {
  useAddStateMutation,
  useEditStateMutation,
} from "../../redux/apiSlices/stateControlApi";
import { useGetCategoriesQuery } from "../../redux/apiSlices/categoryApi";

function AddStateModal({ isOpen, onClose, selectedRow }) {
  const { data: categories = [] } = useGetCategoriesQuery();

  const [formData, setFormData] = useState({
    state_code: "",
    state_name: "",
    category: "NORMAL",
  });

  useEffect(() => {
    setFormData({
      state_code: selectedRow?.state_code || "",
      state_name: selectedRow?.state_name || "",
      category: selectedRow?.category || "NORMAL",
    });
  }, [selectedRow, isOpen]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const [addState, { isLoading: isAdding }] = useAddStateMutation();
  const [editState, { isLoading: isEditing }] = useEditStateMutation();

  const handleSubmit = async () => {
    if (!formData.state_code || !formData.state_name || !formData.category) {
      showToast({
        title: "Missing Required Fields",
        description: "State Code, State Name, and Category are required.",
        status: "warning",
      });
      return;
    }

    try {
      if (selectedRow)
        await editState(formData).unwrap();
      else
        await addState(formData).unwrap();

      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent mx="auto">
        <ModalHeader>{selectedRow ? "Edit State" : "Add State"}</ModalHeader>

        <ModalBody>
          <Flex direction="column" gap={deloitte_theme.gap}>
            <FormControl isRequired>
              <FormLabel>State Code</FormLabel>
              <Input
                name="state_code"
                value={formData.state_code}
                onChange={handleChange}
                placeholder="e.g. MH"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>State Name</FormLabel>
              <Input
                name="state_name"
                value={formData.state_name}
                onChange={handleChange}
                placeholder="e.g. Maharashtra"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Category</FormLabel>
              <Select name="category" value={formData.category} onChange={handleChange}>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.category}>
                    {cat.category}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Flex>
        </ModalBody>

        <ModalFooter>
          <Flex>
            <Button mr={3} onClick={onClose}>
              Cancel
            </Button>

            <Button
              bg={deloitte_theme.buttonPrimary}
              onClick={handleSubmit}
              isLoading={isAdding || isEditing}
            >
              {selectedRow ? "Edit" : "Add"}
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default AddStateModal;
