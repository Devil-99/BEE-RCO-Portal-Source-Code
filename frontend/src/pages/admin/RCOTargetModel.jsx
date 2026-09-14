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
import { useAddRcoTargetMutation, useUpdateRcoTargetMutation } from "../../redux/apiSlices/rcoTargetControlApi";
import { useGetCategoriesQuery } from "../../redux/apiSlices/categoryApi";
import { useSelector } from "react-redux";

function RCOTargetModal({ isOpen, onClose, selectedRow }) {
  const [formData, setFormData] = useState({
    fy_id: "",
    category: "NORMAL",
    wind: "",
    hydro: "",
    distributed: "",
    other: "",
  });

  const { financialYears } = useSelector((state) => state.commonState);
  const { data: categories = [] } = useGetCategoriesQuery();
  const [addRCOTarget, { isLoading: isAdding }] = useAddRcoTargetMutation();
  const [updateRCOTarget, { isLoading: isUpdating }] = useUpdateRcoTargetMutation();

  useEffect(() => {
    if (selectedRow) {
      setFormData({
        fy_id: selectedRow.fy_id ?? "",
        category: selectedRow.category ?? "NORMAL",
        wind: selectedRow.wind ?? "",
        hydro: selectedRow.hydro ?? "",
        distributed: selectedRow.distributed ?? "",
        other: selectedRow.other ?? "",
      });
    } else {
      setFormData({ fy_id: "", category: "NORMAL", wind: "", hydro: "", distributed: "", other: "" });
    }
  }, [selectedRow, isOpen]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (
        !formData.fy_id ||
        !formData.category ||
        formData.wind === "" ||
        formData.hydro === "" ||
        formData.distributed === "" ||
        formData.other === ""
    ) {
      showToast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields.",
        status: "warning",
      });
      return;
    }
    const payload = {
      category: formData.category,
      Wind: Number(formData.wind) || 0,
      Hydro: Number(formData.hydro) || 0,
      Distributed: Number(formData.distributed) || 0,
      Others: Number(formData.other) || 0,
    };

    if (selectedRow) {
      const isUnchanged =
        Number(formData.wind) === Number(selectedRow.wind || 0) &&
        Number(formData.hydro) === Number(selectedRow.hydro || 0) &&
        Number(formData.distributed) === Number(selectedRow.distributed || 0) &&
        Number(formData.other) === Number(selectedRow.other || 0);

      if (isUnchanged) {
        showToast({
          title: "No changes detected",
          description: "The target values are identical to the existing data.",
          status: "info",
        });
        return;
      }
    }

    try {
      if (selectedRow) {
        await updateRCOTarget({
          fy_id: formData.fy_id,
          payload,
        }).unwrap();
      } else {
        await addRCOTarget({
          fy_id: formData.fy_id,
          payload,
        }).unwrap();
      }

      onClose();
      showToast({
        title: "Success",
        description: "Target saved successfully",
        status: "success",
      });
    } catch (error) {
      showToast({
        title: "Error",
        description: error?.data?.detail || "Unknown error",
        status: "error",
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent mx="auto">
        <ModalHeader>{selectedRow ? "Edit RCO Target" : "Add RCO Target"}</ModalHeader>
        <ModalBody>
          <Flex direction="column" gap={deloitte_theme.gap}>
            <FormControl isRequired>
              <FormLabel>Financial Year</FormLabel>
              <Select name="fy_id" value={formData.fy_id} onChange={handleChange} isDisabled={!!selectedRow}>
                <option value="">Select FY</option>
                {financialYears?.map((fy) => (
                  <option key={fy.id} value={fy.id}>
                    {fy.fy_code} ({fy.start_date} - {fy.end_date})
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Category</FormLabel>
              <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  isDisabled={!!selectedRow}
              >
                {categories?.map((cat) => (
                    <option key={cat.id} value={cat.category}>
                      {cat.category}
                    </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Wind (%)</FormLabel>
              <Input name="wind" type="number" value={formData.wind} onChange={handleChange} />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Hydro (%)</FormLabel>
              <Input name="hydro" type="number" value={formData.hydro} onChange={handleChange} />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Distributed (%)</FormLabel>
              <Input name="distributed" type="number" value={formData.distributed} onChange={handleChange} />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Other (%)</FormLabel>
              <Input name="other" type="number" value={formData.other} onChange={handleChange} />
            </FormControl>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} mr={3}>Cancel</Button>
          <Button bg={deloitte_theme.buttonPrimary} onClick={handleSubmit} isLoading={isAdding || isUpdating}>
            {selectedRow ? "Update" : "Add"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default RCOTargetModal;
