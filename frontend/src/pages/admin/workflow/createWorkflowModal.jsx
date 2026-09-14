import React, { useState, useEffect } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalFooter, Button, Input, Checkbox,
  Select, Flex, Box, Text, IconButton, Divider
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import { useGetRolesQuery } from "../../../redux/apiSlices/Admin/RbacApi";
import {
  useGetFinancialYearsQuery,
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation
} from "../../../redux/apiSlices/workflowsTabApi";
import deloitte_theme from "../../../theme";

const CreateWorkflowModal = ({ isOpen, onClose, workflow, isEdit }) => {
  const { data: roles = [] } = useGetRolesQuery();
  const { data: financialYears = [] } = useGetFinancialYearsQuery();

  const [createWorkflow] = useCreateWorkflowMutation();
  const [updateWorkflow] = useUpdateWorkflowMutation();

  const [name, setName] = useState("");
  const [formType, setFormType] = useState("");
  const [isDefault, setIsDefault] = useState(0);
  const [fyId, setFyId] = useState("");
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    if (workflow) {
      setName(workflow.name || "");
      setFormType(workflow.form_type || "");
      setFyId(workflow.fy_id || "");
      setSteps(workflow.steps_json || []);
    }
  }, [workflow]);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setFormType("");
      setFyId("");
      setSteps([]);
    }
  }, [isOpen]);

  const handleAddRole = (value) => {
    const id = Number(value);
    if (!steps.includes(id)) {
      setSteps([...steps, id]);
    }
  };

  const handleRemove = (index) => {
    const updated = [...steps];
    updated.splice(index, 1);
    setSteps(updated);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(steps);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    setSteps(items);
  };

  const handleSubmit = async () => {
    if (!name || !formType || !fyId) {
      alert("Please fill all fields");
      return;
    }

    try {
      if (isEdit && workflow?.id) {
        await updateWorkflow({
          id: workflow.id,
          name,
          form_type: formType,
          fy_id: Number(fyId),
          default: isDefault,
          steps,
        }).unwrap();
      } else {
        await createWorkflow({
          name,
          form_type: formType,
          fy_id: Number(fyId),
          default: isDefault,
          steps,
        }).unwrap();
      }

      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />

      <ModalContent
        borderRadius="16px"
        p={deloitte_theme.paddingY}
        boxShadow="xl"
      >
        <ModalHeader fontSize="lg" fontWeight="600">
          {isEdit ? "Edit Workflow" : "Create Workflow"}
        </ModalHeader>

        <ModalBody>
          {/* BASIC DETAILS */}
          <Box mb={6}>
            <Text fontSize="sm" fontWeight="600" mb={3}>
              Basic Details
            </Text>

            <Input
              placeholder="Workflow Name"
              mb={3}
              borderRadius="8px"
              bg={deloitte_theme.primary}
              borderColor={deloitte_theme.bordercolor}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Select
              placeholder="Select Form Type"
              mb={3}
              borderRadius="8px"
              bg={deloitte_theme.primary}
              borderColor={deloitte_theme.bordercolor}
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
            >
              <option value="INDUSTRY">Industry</option>
              <option value="DISCOM">Discom</option>
            </Select>

            <Select
              placeholder="Select Financial Year"
              borderRadius="8px"
              bg={deloitte_theme.primary}
              borderColor={deloitte_theme.bordercolor}
              value={fyId}
              onChange={(e) => setFyId(e.target.value)}
            >
              {financialYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.fy_code}
                </option>
              ))}
            </Select>

            <Checkbox
              mt={4}
              ml={1}
              isChecked={isDefault === 1}
              onChange={(e) => setIsDefault(e.target.checked ? 1 : 0)}
            >
              Set as Default
            </Checkbox>
          </Box>

          <Divider />

          {/* APPROVAL FLOW */}
          <Box mt={6}>
            <Text fontSize="sm" fontWeight="600" mb={3}>
              Approval Flow (Drag to reorder)
            </Text>

            {/* ADD ROLE */}
            <Select
              placeholder="Add role"
              mb={4}
              borderRadius="8px"
              bg={deloitte_theme.primary}
              borderColor={deloitte_theme.bordercolor}
              onChange={(e) => handleAddRole(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.role_name}
                </option>
              ))}
            </Select>

            {/* DRAG LIST */}
            {steps.length > 0 ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="steps">
                  {(provided) => (
                    <Box ref={provided.innerRef} {...provided.droppableProps}>
                      {steps.map((id, index) => {
                        const role = roles.find((r) => r.id === id);

                        return (
                          <Draggable
                            key={id}
                            draggableId={String(id)}
                            index={index}
                          >
                            {(provided) => (
                              <Flex
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                align="center"
                                justify="space-between"
                                p={3}
                                border="1px solid"
                                borderColor={deloitte_theme.bordercolor}
                                borderRadius="10px"
                                mb={2}
                                bg="white"
                                _hover={{ bg: deloitte_theme.primary }}
                              >
                                <Flex align="center">
                                  <Box
                                    bg={deloitte_theme.buttonPrimary}
                                    color="white"
                                    borderRadius="full"
                                    w="24px"
                                    h="24px"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    fontSize="12px"
                                    mr={3}
                                  >
                                    {id}
                                  </Box>

                                  <Text fontSize="sm">
                                    {role?.role_name || "Unknown"}
                                  </Text>
                                </Flex>

                                <IconButton
                                  icon={<DeleteIcon />}
                                  size="xs"
                                  bg={deloitte_theme.buttonWarning}
                                  color="white"
                                  _hover={{
                                    bg: deloitte_theme.buttonHoverWarning,
                                  }}
                                  onClick={() => handleRemove(index)}
                                />
                              </Flex>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <Text fontSize="xs" color="gray.400">
                No steps added yet
              </Text>
            )}
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button mr={3} onClick={onClose}>
            Cancel
          </Button>

          <Button
            bg={deloitte_theme.buttonHoverPrimary}
            color="white"
            _hover={{ bg: deloitte_theme.secondary }}
            onClick={handleSubmit}
          >
            {isEdit ? "Update" : "Create"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateWorkflowModal;