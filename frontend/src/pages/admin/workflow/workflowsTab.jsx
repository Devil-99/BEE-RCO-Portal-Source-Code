import React, { useState } from "react";
import {
  Box,
  Text,
  SimpleGrid,
  Flex,
  Button,
  Badge,
  Collapse,
  IconButton,
} from "@chakra-ui/react";
import {
  AddIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EditIcon,
} from "@chakra-ui/icons";

import {
  useGetWorkflowsQuery,
} from "../../../redux/apiSlices/workflowsTabApi";

import SkeletonComponent from "../../../components/SkeletonComponent";
import CreateWorkflowModal from "./createWorkflowModal";
import deloitte_theme from "../../../theme";

const WorkflowsTab = () => {
  const { data, isLoading } = useGetWorkflowsQuery();

  const [openCard, setOpenCard] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  const toggleCard = (id) => {
    setOpenCard(openCard === id ? null : id);
  };

  const handleEdit = (wf) => {
    setSelectedWorkflow(wf);
    setIsOpen(true);
  };

  const handleCreate = () => {
    setSelectedWorkflow(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedWorkflow(null);
  };

  if (isLoading) return <SkeletonComponent />;

  return (
    <Box
      px={deloitte_theme.paddingX}
      py={deloitte_theme.paddingY}
    >
      {/* HEADER */}
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Text fontSize="2xl" fontWeight="700" color="gray.800">
            Workflows
          </Text>
          <Text fontSize="sm" color="gray.500">
            Manage approval structures
          </Text>
        </Box>

        <Button
          leftIcon={<AddIcon />}
          onClick={handleCreate}
          bg={deloitte_theme.buttonHoverPrimary}
          color="white"
          _hover={{ bg: deloitte_theme.secondary }}
          borderRadius="8px"
          px={deloitte_theme.paddingX}
          py={deloitte_theme.paddingY}
        >
          Create Workflow
        </Button>
      </Flex>

      {/* CARDS */}
      <SimpleGrid columns={[1, 2, 3]} spacing={deloitte_theme.gap}>
        {data?.map((wf) => {
          const isExpanded = openCard === wf.id;

          return (
            <Box
              key={wf.id}
              bg="white"
              p={5}
              borderRadius="12px"
              border="1px solid"
              borderColor={deloitte_theme.bordercolor}
              boxShadow="sm"
              transition="all 0.2s ease"
              _hover={{ boxShadow: "md" }}
              height="fit-content"
            >
              {/* TOP */}
              <Flex justify="space-between" align="flex-start">
                <Flex direction="column" gap={deloitte_theme.gap} w="full">
                  <Flex justifyContent="space-between" alignItems="center">
                    <Text fontSize="md" fontWeight="600" color="gray.800">
                      {wf.name}
                    </Text>

                    <Badge
                      mt={2}
                      bg={deloitte_theme.secondary}
                      color="white"
                      borderRadius="full"
                      px={3}
                      py={1}
                      fontSize="0.7rem"
                    >
                      {wf.form_type || "Workflow"}
                    </Badge>
                  </Flex>

                  <Flex justifyContent="space-between" alignItems="center">
                    <Text fontSize="sm" color="gray.600">
                      FY: {wf.fy_code || "-"}
                    </Text>

                    {wf.default == 1 &&
                      <Text fontSize="xs">
                        Default
                      </Text>
                    }
                  </Flex>
                </Flex>

                <IconButton
                  icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleCard(wf.id)}
                />
              </Flex>

              {/* COLLAPSIBLE FLOW */}
              <Collapse in={isExpanded} animateOpacity>
                <Box mt={5} pt={4} borderTop="1px solid" borderColor="gray.100">

                  <Flex justify="space-between" align="center" mb={3}>
                    <Text fontSize="sm" fontWeight="600" color="gray.700">
                      Approval Flow
                    </Text>

                    <Button
                      size="xs"
                      leftIcon={<EditIcon />}
                      variant="ghost"
                      onClick={() => handleEdit(wf)}
                    >
                      Edit
                    </Button>
                  </Flex>

                  {/* FLOW */}
                  {wf.step_names && wf.step_names.length > 0 ? (
                    <Box>
                      {wf.step_names.map((role, index) => (
                        <Flex key={index} align="center" mb={3}>
                          <Box
                            bg={deloitte_theme.buttonPrimary}
                            color="white"
                            borderRadius="full"
                            w="22px"
                            h="22px"
                            fontSize="11px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            mr={3}
                            fontWeight="600"
                          >
                            {wf.steps_json[index]}
                          </Box>

                          <Text fontSize="sm" color="gray.700">
                            {role}
                          </Text>
                        </Flex>
                      ))}
                    </Box>
                  ) : (
                    <Text fontSize="xs" color="gray.400">
                      No approval steps defined
                    </Text>
                  )}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </SimpleGrid>

      {/* MODAL */}
      <CreateWorkflowModal
        isOpen={isOpen}
        onClose={handleClose}
        workflow={selectedWorkflow}
        isEdit={!!selectedWorkflow}
      />
    </Box>
  );
};

export default WorkflowsTab;