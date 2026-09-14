import React, { useState, useMemo } from "react";
import {
    Flex,
    Button,
    Text,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Tooltip,
    Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody,
    DrawerCloseButton, IconButton, VStack, Box, Spinner,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
    Textarea,
    Badge
} from "@chakra-ui/react";
import { useSelector, useDispatch } from "react-redux";
import deloitte_theme from "../../theme";
import { useNavigate } from "react-router-dom";
import {
    useFormActionByWorkflowMutation,
    useFormActionMutation,
    useGetSubmissionStageHistoryQuery,
} from "../../redux/apiSlices/formApi";
import {
    useGetWorkflowsQuery,
} from "../../redux/apiSlices/workflowsTabApi";

import { setSelectedFormDetails } from "../../redux/FormSlice";
import { useFY, usePeriodCode } from "../../Hooks/useLookUp";
import TableComponent from "../../components/TableComponent";
import { acronymLabels } from "../../constants/form_acronym";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import ViewFileModal from "./ViewFileModal";

function SubmittedFormsComponent({ submittedForms, selectedFY, serverPagination = false, serialNumberOffset = 0, exportRows = [], }) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const getPeriodCode = usePeriodCode();
    const getFY = useFY();
    const userDetails = useSelector((state) => state.login);
    const entityType = userDetails.entity_type;
    const roleCode = userDetails.role_code;

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'PENDING': return 'yellow';
            case 'APPROVED': return 'green';
            case 'REJECTED': return 'red';
            case 'SENT_BACK': return 'orange';
            default: return 'gray';
        }
    };

    const { data: workflows, isLoading: workflowsLoading } = useGetWorkflowsQuery();
    const [formAction, { isLoading: formLoading }] = useFormActionMutation();
    const [formActionByWorkflow, { isLoading: workflowLoading }] = useFormActionByWorkflowMutation();

    const [viewed, setViewed] = useState(false);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState(null); // "accept" or "reject"
    const [modalForm, setModalForm] = useState(null);
    const [modalWorkflowId, setModalWorkflowId] = useState(null); // for workflow accept
    const [remarks, setRemarks] = useState("");

    const handleView = (form) => {
        dispatch(setSelectedFormDetails({
            entity_id: form.entity_id,
            period_id: form.period_id,
            fy_id: form.fy_id
        }));
        setViewed(true);
        const entitytype = form.id ? form.entity_type : entityType;
        if (entitytype === "DISCOM") navigate("/discom-form");
        else navigate("/cpp-form");
    };

    const [viewFileModalOpen, setViewFileModalOpen] = useState(false);
    const handleViewFiles = (form) => {
        dispatch(setSelectedFormDetails({
            entity_id: form.entity_id,
            period_id: form.period_id,
            fy_id: form.fy_id
        }));
        setViewFileModalOpen(true);
    }

    const statusField = (form) => {
        switch (form.stage) {
            case "USR":
                return `Submission pending from ${form.position}`;
            default:
                return `Pending at ${form.position}`;
        }
    };

    const renderStatus = (form) => {
        if (!form.id && roleCode !== "USR") {
            return (
                <Text fontSize="md" fontWeight="normal" color={deloitte_theme.textSecondary}>
                    Not Submitted
                </Text>
            )
        }

        if (form.is_closed === 1) {
            return (
                <Text fontSize="md" fontWeight="bold" color={deloitte_theme.buttonPrimary}>
                    Submission Completed
                </Text>
            );
        }

        return (
            <Text fontSize="md" fontWeight="semibold" color={deloitte_theme.textPrimary}>
                {statusField(form)}
            </Text>
        );
    }

    // Open modal
    const openModal = (form, actionType, workflowId = null) => {
        setModalForm(form);
        setModalAction(actionType);
        setModalWorkflowId(workflowId);
        setRemarks("");
        setModalOpen(true);
    };

    // Confirm modal
    const confirmModal = () => {
        if (modalAction === "accept") {
            if (modalWorkflowId) {
                formActionByWorkflow({
                    form_id: modalForm.id,
                    workflow_id: modalWorkflowId,
                });
            } else {
                formAction({
                    form_id: modalForm.id,
                    action: "accept",
                    remarks: remarks || `Accepted by ${roleCode}`,
                });
            }
        } else if (modalAction === "reject") {
            formAction({
                form_id: modalForm.id,
                action: "reject",
                remarks: remarks || `Rejected by ${roleCode}`,
            });
        }
        setModalOpen(false);
    };

    const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
    const [isDrawerOpen, setDrawerOpen] = useState(false);

    const openHistory = (submission_id) => {
        setSelectedSubmissionId(submission_id);
        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setSelectedSubmissionId(null);
    };

    const { data: stageHistory, isLoading: historyLoading } =
        useGetSubmissionStageHistoryQuery(selectedSubmissionId, { skip: !selectedSubmissionId });

    const renderActions = (form) => {
        if (!form.id && roleCode === "USR") {
            return (
                <Button
                    w={28}
                    bg={deloitte_theme.buttonPrimary}
                    color="white"
                    px={deloitte_theme.paddingX}
                    py={deloitte_theme.paddingY}
                    _hover={{ bg: deloitte_theme.buttonHoverPrimary }}
                    onClick={() => handleView(form)}
                >
                    Open Form
                </Button>
            );
        }

        if (form.is_closed === 1) {
            return (
                <Flex w="full" justifyContent="center" alignItems="center" gap={2}>
                    <Button
                        w={20}
                        bg={deloitte_theme.buttonSecondary}
                        color="white"
                        onClick={() => handleView(form)}
                    >
                        View
                    </Button>
                    <Button
                        w={28}
                        bg={deloitte_theme.buttonSecondary}
                        color="white"
                        onClick={() => handleViewFiles(form)}
                    >
                        View Files
                    </Button>
                </Flex>
            );
        }

        if (form.stage === roleCode) {
            if (roleCode === "USR") {
                return (
                    <Flex w="full" justifyContent="space-between" alignItems="center" gap={2}>
                        <Button
                            w={20}
                            bg={deloitte_theme.buttonPrimary}
                            color="white"
                            onClick={() => handleView(form)}
                        >
                            Edit
                        </Button>
                        <Button
                            w={28}
                            bg={deloitte_theme.buttonSecondary}
                            color="white"
                            onClick={() => handleViewFiles(form)}
                        >
                            View Files
                        </Button>
                        <Button
                            w={28}
                            bg={deloitte_theme.buttonSecondary}
                            isLoading={formLoading}
                            onClick={() => openModal(form, "accept")}
                        >
                            Final Submit
                        </Button>
                    </Flex>
                );
            }

            if (roleCode === "SLR" && getPeriodCode(form.period_id) === "ANNUAL") {
                if (entityType === "DISCOM") {
                    return (
                        <Flex w="full" justifyContent="space-between" alignItems="center" gap={2}>
                            <Button
                                w={20}
                                bg={deloitte_theme.buttonSecondary}
                                color="white"
                                onClick={() => handleView(form)}
                            >
                                View
                            </Button>

                            {/* Temporary code for submitted files view - Will remove this Button later */}
                            <Button
                                w={28}
                                bg={deloitte_theme.buttonSecondary}
                                color="white"
                                onClick={() => handleViewFiles(form)}
                            >
                                View Files
                            </Button>

                            <Menu>
                                <MenuButton
                                    as={Button}
                                    w={24}
                                    bg={deloitte_theme.buttonPrimary}
                                    color="white"
                                    isLoading={workflowLoading}
                                >
                                    Accept
                                </MenuButton>
                                <MenuList>
                                    {workflows
                                        ?.filter((w) => w.form_type === "DISCOM" && !w.default && w.fy_id === selectedFY)
                                        .map((workflow, idx) => (
                                            <MenuItem
                                                key={idx}
                                                onClick={() => openModal(form, "accept", workflow.id)}
                                            >
                                                {workflow?.name}
                                            </MenuItem>
                                        ))}
                                </MenuList>
                            </Menu>

                            <Button
                                w={24}
                                variant="outline"
                                border="1px solid"
                                borderColor={deloitte_theme.buttonWarning}
                                isLoading={formLoading}
                                onClick={() => openModal(form, "reject")}
                            >
                                Reject
                            </Button>
                        </Flex>
                    );
                } else {
                    return (
                        <Flex w="full" justifyContent="space-between" alignItems="center" gap={2}>
                            <Button
                                w={20}
                                bg={deloitte_theme.buttonSecondary}
                                color="white"
                                onClick={() => handleView(form)}
                            >
                                View
                            </Button>

                            {/* Temporary code for submitted files view - Will remove this Button later */}
                            <Button
                                w={28}
                                bg={deloitte_theme.buttonSecondary}
                                color="white"
                                onClick={() => handleViewFiles(form)}
                            >
                                View Files
                            </Button>

                            <Button
                                w={24}
                                bg={deloitte_theme.buttonPrimary}
                                isLoading={formLoading}
                                onClick={() => {
                                    const workflowId = workflows?.find(
                                        w =>
                                            w.form_type === "INDUSTRY" &&
                                            w.default === 0 &&
                                            w.fy_id == selectedFY
                                    )?.id;

                                    if (!workflowId) {
                                        console.warn("Workflow not ready-", workflows);
                                        return;
                                    }

                                    openModal(form, "accept", workflowId);
                                }
                                }
                            >
                                Accept
                            </Button>

                            <Button
                                w={24}
                                variant="outline"
                                border="1px solid"
                                borderColor={deloitte_theme.buttonWarning}
                                isLoading={formLoading}
                                onClick={() => openModal(form, "reject")}
                            >
                                Reject
                            </Button>
                        </Flex >
                    );
                }
            }

            return (
                <Flex w="full" justifyContent="space-evenly" alignItems="center" gap={2}>
                    <Button
                        w={20}
                        bg={deloitte_theme.buttonSecondary}
                        color="white"
                        onClick={() => handleView(form)}
                    >
                        View
                    </Button>

                    {/* Temporary code for submitted files view - Will remove this Button later */}
                    <Button
                        w={28}
                        bg={deloitte_theme.buttonSecondary}
                        color="white"
                        onClick={() => handleViewFiles(form)}
                    >
                        View Files
                    </Button>

                    <Button
                        w={24}
                        bg={deloitte_theme.buttonPrimary}
                        isLoading={formLoading}
                        onClick={() => openModal(form, "accept")}
                    >
                        Accept
                    </Button>

                    <Button
                        w={24}
                        variant="outline"
                        border="1px solid"
                        borderColor={deloitte_theme.buttonWarning}
                        isLoading={formLoading}
                        onClick={() => openModal(form, "reject")}
                    >
                        Reject
                    </Button>
                </Flex>
            );
        }
    };

    const config = useMemo(() => {
        const baseConfig = [
            {
                name: 'entity_name',
                header: 'Entity Name',
                numeric: false,
                width: '250px',
                render: (row) => row.entity_name,
                exportValue: (row) => row.entity_name
            },
            {
                name: 'reg_no',
                header: 'Registration Number',
                numeric: false,
                width: '250px',
                render: (row) => row.reg_no,
                exportValue: (row) => row.reg_no
            },
            {
                name: 'pat_reg_number',
                header: 'PAT Number',
                numeric: false,
                width: '200px',
                render: (row) => row.pat_reg_number || '-',
                exportValue: (row) => row.pat_reg_number || '-'
            },
            {
                name: 'fy_id',
                header: 'Financial Year',
                numeric: true,
                width: '200px',
                render: (row) => getFY(row.fy_id),
                exportValue: (row) => getFY(row.fy_id)
            },
            {
                name: 'period_code',
                header: 'Period',
                numeric: true,
                render: (row) => getPeriodCode(row.period_id),
                exportValue: (row) => getPeriodCode(row.period_id)
            },
            {
                name: 'updated_at',
                header: 'Last Updated',
                numeric: true,
                width: '200px',
                render: (row) => {
                    if (!row?.updated_at) return 'N/A';
                    const d = new Date(row.updated_at);
                    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString("en-GB");
                },
                exportValue: (row) => {
                    if (!row?.updated_at) return 'N/A';
                    const d = new Date(row.updated_at);
                    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString("en-GB");
                }
            },
            {
                name: 'status',
                header: 'Status',
                numeric: true,
                exportValue: (row) => row.status,
                render: (row) => (
                    <Tooltip bg={deloitte_theme.primary} rounded="md" label={renderStatus(row) || "No comments"} placement="top" hasArrow>
                        <Button variant="unstyled">
                            {row.status}
                        </Button>
                    </Tooltip>
                )
            },
            {
                name: 'actions',
                header: 'Actions',
                numeric: true,
                width: '400px',
                render: (row) => renderActions(row)
            },
            {
                name: 'comments',
                header: 'Comments',
                numeric: true,
                render: (row) => (
                    row?.id &&
                    <Button variant="unstyled" onClick={() => openHistory(row.id)}>
                        View <InfoOutlineIcon />
                    </Button>
                ),
            },
        ];
        const hasDetails = submittedForms.some(form => form.details && Object.keys(form.details).length > 0);

        if (hasDetails) {
            Object.entries(acronymLabels).forEach(([key, label]) => {
                baseConfig.push({
                    name: key,
                    header: label,
                    numeric: true,
                    width: '250px',
                    exportValue: (row) => row.details?.[key] ?? 'N/A',
                    render: (row) => row.details?.[key] ?? 'N/A'
                });
            });
        }
        return baseConfig;
    }, [submittedForms, workflows, workflowsLoading]);

    return (
        <>
            {/* Remarks Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{modalAction === "accept" ? "Confirm Accept" : "Confirm Reject"}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text mb={2}>Do you want to {modalAction} this form?</Text>
                        <Textarea
                            placeholder="Add remarks (optional)"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme={modalAction === "accept" ? "blue" : "red"}
                            onClick={confirmModal}
                        >
                            {modalAction === "accept" ? "Accept" : "Reject"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* View File Modal. Temporary - Will remove this later */}
            <ViewFileModal isOpen={viewFileModalOpen} onClose={() => setViewFileModalOpen(false)} />

            {/* Stage History Drawer */}
            <Drawer isOpen={isDrawerOpen} placement="right" onClose={closeDrawer} size="sm">
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader>Submission Stage History</DrawerHeader>

                    <DrawerBody>
                        {historyLoading && (
                            <Flex justify="center" mt={10}>
                                <Spinner size="lg" />
                            </Flex>
                        )}

                        {!historyLoading && stageHistory?.length === 0 && (
                            <Text>No history available.</Text>
                        )}

                        {!historyLoading && stageHistory?.length > 0 && (
                            <VStack align="stretch" spacing={4}>
                                {stageHistory.map((stage, idx) => (
                                    <Box
                                        key={idx}
                                        px={deloitte_theme.paddingX}
                                        py={deloitte_theme.paddingY}
                                        borderRadius="md"
                                        shadow="md"
                                        bg={deloitte_theme.primary}
                                    >
                                        <Text fontSize="md">
                                            <Badge rounded="md" fontSize="sm" colorScheme={getStatusColor(stage.action_status)}>{stage.action_status}</Badge> by <b>{stage.role_name}</b>
                                        </Text>
                                        {stage.comments && (
                                            <Text py={deloitte_theme.paddingY}>
                                                Comments : <i>“{stage.comments}”</i>
                                            </Text>
                                        )}
                                        <Flex w="full" justify="end">
                                            <Text mt={1} fontSize="sm" color="gray.500">
                                                {new Date(stage.action_at).toLocaleString("en-GB")}
                                            </Text>
                                        </Flex>
                                    </Box>
                                ))}
                            </VStack>
                        )}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>

            <Box w="100%" overflowX="auto">
                <TableComponent
                    name="List of Submitted Forms"
                    config={config}
                    data={submittedForms}
                    serverPagination={serverPagination}
                    serialNumberOffset={serialNumberOffset}
                    isDownload={true}
                    exportRows={exportRows}
                />
            </Box>
        </>
    );
}

export default SubmittedFormsComponent;
