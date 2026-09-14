import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Input,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Flex,
  Heading,
  Textarea,
  Text,
  Badge,
  VStack,
  HStack,
  Tooltip,
  IconButton,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  Grid,
} from "@chakra-ui/react";
import { CheckIcon, CloseIcon, RepeatIcon, EditIcon } from "@chakra-ui/icons";
import { FaFilter } from "react-icons/fa";
import { AiFillFilePdf, AiFillFileImage } from "react-icons/ai";
import ConfirmModal from "../../components/ConfirmModal"; // Ensure this path is correct
import { showToast } from "../../components/toastService";
import deloitte_theme from "../../theme";
import { useSectorName, useStateName } from "../../Hooks/useLookUp";
import { useDocumentApproveMutation, useGetEntitiesListQuery, useGetAllEntitiesQuery, useOpenFileMutation, useUpdateEntityMutation, } from "../../redux/apiSlices/adminControlApi";
import SkeletonComponent from "../../components/SkeletonComponent";
import { useDebounce } from "../../Hooks/useDebounceHook";

//------------------ Helper Functions ----------------------------------
const getFileType = (filename) => {
  if (!filename) return null;
  const ext = filename.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};


const EntityManagement = () => {
  const [remarks, setRemarks] = useState({});
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [docStatusFilter, setDocStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [entitySearchType, setEntitySearchType] = useState("");
  const [entitySearchQuery, setEntitySearchQuery] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: null,
    entityId: null,
    flag: null,
  });

  const [updateEntity] = useUpdateEntityMutation();
  const [editingId, setEditingId] = useState(null);
  const [expandedDocs, setExpandedDocs] = useState({});

  const [editForm, setEditForm] = useState({
    full_name: "",
    primary_email: "",
    secondary_email: "",
    mobile: "",
  });

  const getStateName = useStateName();
  const getSectorName = useSectorName();

  const debouncedEntitySearch = useDebounce(entitySearchQuery, 300);

  const [page, setPage] = useState(1);
  const pageSize = 5;

  const { data, isLoading: entitiesLoading, isFetching, refetch } = useGetEntitiesListQuery({
    page,
    pageSize,
    entity_type: entityTypeFilter !== "all" ? entityTypeFilter : undefined,
    document_flag: docStatusFilter !== "all" ? Number(docStatusFilter) : undefined,
    payment_flag: paymentStatusFilter !== "all" ? (paymentStatusFilter === "paid" ? true : false) : undefined,
    org_name: entitySearchType === "org" ? debouncedEntitySearch.trim() || undefined : undefined,
    username: entitySearchType === "username" ? debouncedEntitySearch.trim() || undefined : undefined,
    pat_reg_number: entitySearchType === "pat" ? debouncedEntitySearch.trim() || undefined : undefined,
    entity_reg_no: entitySearchType === "reg_no" ? debouncedEntitySearch.trim() || undefined : undefined,
  });
  const entities = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;

  const [handleDocumentApproval, { isLoading: approving }] = useDocumentApproveMutation();

  const [openFile] = useOpenFileMutation();
  const handleOpenFile = (filepath) => {
    if (!filepath) {
      showToast({
        title: "No file available",
        status: "warning",
      });
      return;
    }
    openFile(filepath);
  }

  const handleRefresh = () => {
    setPage(1);
    setEntityTypeFilter("all");
    setDocStatusFilter("all");
    setPaymentStatusFilter("all");
    setEntitySearchType("");
    setEntitySearchQuery("");
    refetch();
  }

  const handleEdit = (entity) => {
    setEditingId(entity.id);

    setEditForm({
      full_name: entity.full_name || "",
      primary_email: entity.primary_email || "",
      secondary_email: entity.secondary_email || "",
      mobile: entity.mobile || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);

    setEditForm({
      full_name: "",
      primary_email: "",
      secondary_email: "",
      mobile: "",
    });
  };

  //------------------ Entity Details Edit Handler ----------------------------------
  const handleSaveEdit = async (id) => {
    try {

      const originalEntity = entities.find(
        (e) => e.user_id === id
      );

      if (!originalEntity) return;

      const payload = {
        id,
      };
      // Only include fields that have changed
      if (editForm.full_name !== originalEntity.full_name) {
        payload.full_name = editForm.full_name;
      }

      if (editForm.primary_email !== originalEntity.primary_email) {
        payload.primary_email = editForm.primary_email;
      }

      if (editForm.secondary_email !== originalEntity.secondary_email) {
        payload.secondary_email = editForm.secondary_email;
      }

      if (editForm.mobile !== originalEntity.mobile) {
        payload.mobile = editForm.mobile;
      }
      //no changes made
      if (Object.keys(payload).length === 1) {
        showToast({
          title: "No changes detected",
          status: "info",
        });

        return;
      }

      await updateEntity(payload).unwrap();
      setEditingId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const confirmAndExecute = async () => {
    const { action, entityId, flag } = confirmModal;
    try {
      if (action === "approve" || action === "reject") {
        await handleDocumentApproval({
          id: entityId,
          document_flag: flag,
          remarks: remarks[entityId] || ""
        }).unwrap();
      }
      setConfirmModal({
        isOpen: false,
        action: null,
        entityId: null,
        flag: null,
      });
    } catch ({ error }) {
      console.log(error);
    }
  };

  //------------------ Filter Functionality ----------------------------------
  useEffect(() => {
    setPage(1);
  }, [entityTypeFilter, docStatusFilter, paymentStatusFilter, entitySearchType, debouncedEntitySearch]);


  const renderFilter = () => {
    return (
      <Menu>
        <MenuButton
          as={Button}
          leftIcon={<FaFilter />}
          border="1px"
          borderColor={deloitte_theme.secondary}
          color={deloitte_theme.black}
          bg="transparent"
          _hover={{ bg: deloitte_theme.secondary }}
          _active={{ bg: deloitte_theme.secondary }}
          borderRadius="md"
          boxShadow="md"
          fontSize="sm"
        >
          Filters
        </MenuButton>

        <MenuList sx={deloitte_theme.glass} w="22rem">

          {/* Entity Type */}
          <Flex direction="column" gap={deloitte_theme.gap} w="full" px={deloitte_theme.paddingX} pt={deloitte_theme.paddingY}>
            <Heading size="sm">
              Entity Type :
            </Heading>
            <Flex gap={deloitte_theme.gap} wrap="wrap">
              {[
                { label: "DISCOM", value: "DISCOM" },
                { label: "OA/CPP", value: "INDUSTRY" },
                { label: "Non Obligated", value: "NOBE" },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  border="1px"
                  borderColor={deloitte_theme.primary}
                  bg={
                    entityTypeFilter === opt.value
                      ? deloitte_theme.secondary // active
                      : deloitte_theme.glassBackground // inactive
                  }
                  color={deloitte_theme.white}
                  _hover={{ bg: deloitte_theme.buttonPrimary }}
                  onClick={() =>
                    setEntityTypeFilter(
                      entityTypeFilter === opt.value ? "all" : opt.value
                    )
                  }
                >
                  {opt.label}
                </Button>
              ))}
            </Flex>
          </Flex>

          {/* Document Status */}
          <Flex direction="column" gap={deloitte_theme.gap} w="full" px={deloitte_theme.paddingX} pt={deloitte_theme.paddingY}>
            <Heading size="sm">
              Document Status :
            </Heading>
            <Flex gap={deloitte_theme.gap} wrap="wrap">
              {[
                { label: "Pending", value: "0" },
                { label: "Approved", value: "1" },
                { label: "Rejected", value: "2" },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  border="1px"
                  borderColor={deloitte_theme.primary}
                  bg={
                    docStatusFilter === opt.value
                      ? deloitte_theme.secondary // active
                      : deloitte_theme.glassBackground // inactive
                  }
                  color={deloitte_theme.white}
                  _hover={{ bg: deloitte_theme.buttonPrimary }}
                  onClick={() =>
                    setDocStatusFilter(
                      docStatusFilter === opt.value ? "all" : opt.value
                    )
                  }
                >
                  {opt.label}
                </Button>
              ))}
            </Flex>
          </Flex>

          {/* Payment Status */}
          <Flex direction="column" gap={deloitte_theme.gap} w="full" px={deloitte_theme.paddingX} py={deloitte_theme.paddingY}>
            <Heading size="sm">
              Payment Status :
            </Heading>
            <Flex gap={deloitte_theme.gap} wrap="wrap">
              {[
                { label: "Paid", value: "paid" },
                { label: "Unpaid", value: "unpaid" },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  border="1px"
                  borderColor={deloitte_theme.primary}
                  bg={
                    paymentStatusFilter === opt.value
                      ? deloitte_theme.secondary
                      : deloitte_theme.glassBackground
                  }
                  color={deloitte_theme.white}
                  _hover={{ bg: deloitte_theme.buttonPrimary }}
                  onClick={() =>
                    setPaymentStatusFilter(
                      paymentStatusFilter === opt.value ? "all" : opt.value
                    )
                  }
                >
                  {opt.label}
                </Button>
              ))}
            </Flex>
          </Flex>

          {/* Search */}
          <Flex direction="column" gap={2} w="full" px={deloitte_theme.paddingX} py={deloitte_theme.paddingY}>
            <Heading size="sm">Search :</Heading>
            <Flex gap={deloitte_theme.gap} wrap="wrap">
              <Checkbox
                isChecked={entitySearchType === "org"}
                onChange={() => {
                  setEntitySearchType(entitySearchType === "org" ? "" : "org");
                  setEntitySearchQuery("");
                }}
              >
                Organization Name
              </Checkbox>
              <Checkbox
                isChecked={entitySearchType === "username"}
                onChange={() => {
                  setEntitySearchType(entitySearchType === "username" ? "" : "username");
                  setEntitySearchQuery("");
                }}
              >
                User Name
              </Checkbox>
              <Checkbox
                isChecked={entitySearchType === "pat"}
                onChange={() => {
                  setEntitySearchType(entitySearchType === "pat" ? "" : "pat");
                  setEntitySearchQuery("");
                }}
              >
                PAT Number
              </Checkbox>
              <Checkbox
                isChecked={entitySearchType === "reg_no"}
                onChange={() => {
                  setEntitySearchType(entitySearchType === "reg_no" ? "" : "reg_no");
                  setEntitySearchQuery("");
                }}
              >
                Entity Reg No
              </Checkbox>
            </Flex>
            {entitySearchType && (
              <Input
                mt={2}
                size="sm"
                bg="white"
                color="black"
                placeholder={
                  entitySearchType === "org"
                    ? "Search by Organization Name..."
                    : entitySearchType === "username"
                    ? "Search by User Name..."
                    : entitySearchType === "pat"
                    ? "Search by PAT Number..."
                    : "Search by Entity Reg No..."
                }
                value={entitySearchQuery}
                onChange={(e) => setEntitySearchQuery(e.target.value)}
                _placeholder={{ color: "gray.500" }}
                _focus={{ borderColor: deloitte_theme.primary }}
              />
            )}
          </Flex>
        </MenuList>
      </Menu>
    )
  }

  const renderLoading = () => {
    if (!entitiesLoading && !isFetching) return null;
    return <SkeletonComponent />;
  };

  const renderEmpty = () => {
    if (entitiesLoading || entities.length !== 0) return null;

    return (
      <Text textAlign="center" color="gray.500" mt={10} fontSize="lg">
        No entities match the current filters.
      </Text>
    );
  };

  const renderLoadMore = () => {
    if (page >= totalPages) return null;

    return (
      <Box
        textAlign="center"
        mt={4}
        cursor="pointer"
        color="gray.500"
        onClick={() => setPage((prev) => prev + 1)}
      >
        {isFetching
          ? "Loading more..."
          : `---- Load more (Page ${page}/${totalPages}) ----`}
      </Box>
    );
  };

  const renderEntityCards = () => {
    return (
      <Grid
        templateColumns="repeat(1, 1fr)"
        gap={deloitte_theme.gap}
        px={deloitte_theme.paddingX}
      >
        {
          entities.map((entity) => {
            const isPending = entity.document_flag === 0;
            const isApprovedDoc = entity.document_flag === 1;
            const isPaid = entity.payment_flag === true;

            const badgeConfig = isPending
              ? { color: "orange", text: "Document Approval Pending" }
              : isApprovedDoc
                ? !isPaid
                  ? { color: "blue", text: "Document Approved, Payment Pending" }
                  : entity.entity_type === "NOBE" ?
                    { color: "green", text: "Approved" }
                    : { color: "green", text: "Approved & Paid" }
                : { color: "red", text: "Document Rejected" };

            return (
              <Card
                key={entity.id}
                boxShadow="md"
                borderRadius="lg"
                variant="outline"
              >

                {/* HEADER */}
                <CardHeader px={deloitte_theme.paddingX} py={deloitte_theme.paddingY}>
                  {/* Top Row */}
                  <Flex
                    justify="space-between"
                    align="flex-start"
                  >
                    <Heading
                      size="lg"
                      color="teal.700"
                      isTruncated
                      maxW="75%"
                    >
                      {entity.org_name || "N/A"}
                    </Heading>

                    <HStack align="end" spacing={2}>

                      {
                        editingId !== entity.id && (
                          <IconButton
                            icon={<EditIcon />}
                            size="sm"
                            aria-label="Edit Entity"
                            onClick={() => handleEdit(entity)}
                          />
                        )
                      }

                      <Badge
                        colorScheme={badgeConfig.color}
                        p={deloitte_theme.paddingY}
                        borderRadius="lg"
                      >
                        <Flex direction="column" align="center">

                          <Text
                            fontWeight="semibold"
                            fontSize="sm"
                            lineHeight="1.2"
                          >
                            {badgeConfig.text}
                          </Text>

                          {entity.updated_at && (
                            <Text fontSize="xs" opacity={0.75}>
                              {formatDate(entity.updated_at)}
                            </Text>
                          )}

                        </Flex>
                      </Badge>

                    </HStack>
                  </Flex>
                </CardHeader>

                <Divider />

                <CardBody px={deloitte_theme.paddingX} py={deloitte_theme.paddingY}>
                  {/* Two Column Info */}
                  <Flex
                    direction={{ base: "column", lg: "row" }}
                    gap={deloitte_theme.gap}
                    align="flex-start"
                    w="full"
                  >

                    {/* LEFT SIDE */}
                    <VStack
                      align="start"
                      spacing={2}
                      flex="1"
                      minW="300px"
                    >

                      <Text fontSize="md">
                        <strong>Entity Registration No:</strong>{" "}
                        {entity.entity_reg_no || "N/A"} |{" "}
                        <strong>Year:</strong>{" "}
                        {entity.registration_year || "N/A"}
                      </Text>

                      <Text fontSize="md" >
                        <strong>PAT Number:</strong>{" "}
                        {entity.pat_reg_number || "N/A"}
                      </Text>

                      <Text fontSize="sm" color="gray.600">
                        <strong>State:</strong>{" "}
                        {getStateName(entity.state_code) || "N/A"} |{" "}
                        <strong>Sector:</strong>{" "}
                        {getSectorName(entity.sector_code) || "N/A"} |{" "}
                        <strong>Entity Type:</strong>{" "}
                        {entity.entity_type || "N/A"}
                      </Text>

                      <Text color="gray.600">
                        <strong>Address:</strong>{" "}
                        {entity.address || "N/A"}
                      </Text>

                      <Text fontSize="sm" color="yellow.600">
                        <strong>Created:</strong>{" "}
                        {entity.created_at
                          ? formatDate(entity.created_at)
                          : "N/A"}
                      </Text>

                    </VStack>

                    {/* RIGHT SIDE */}
                    <VStack
                      align="start"
                      spacing={2}
                      flex="1"
                      minW="300px"
                    >
                      <Text fontSize="md">
                        <strong>User Name:</strong>{" "}
                        {entity.username || "N/A"}
                      </Text>

                      <Flex align="center" gap={2} wrap="wrap">
                        <Text fontWeight="bold">
                          Full Name:
                        </Text>

                        {
                          editingId === entity.id ? (
                            <Input
                              size="sm"
                              w="190px"
                              value={editForm.full_name}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  full_name: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            <Text>{entity.full_name || "N/A"}</Text>
                          )
                        }
                      </Flex>

                      <Flex align="center" gap={2} wrap="wrap">
                        <Text fontWeight="bold">
                          Primary Email:
                        </Text>

                        {
                          editingId === entity.id ? (
                            <Input
                              size="sm"
                              w="190px"
                              value={editForm.primary_email}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  primary_email: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            <Text>{entity.primary_email || "N/A"}</Text>
                          )
                        }
                      </Flex>

                      <Flex align="center" gap={2} wrap="wrap" color="gray.600">
                        <Text fontWeight="bold">
                          Secondary Email:
                        </Text>

                        {
                          editingId === entity.id ? (
                            <Input
                              size="sm"
                              w="190px"
                              value={editForm.secondary_email}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  secondary_email: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            <Text>{entity.secondary_email || "N/A"}</Text>
                          )
                        }
                      </Flex>

                      <Flex align="center" gap={2} wrap="wrap">
                        <Text fontWeight="bold">
                          Phone:
                        </Text>

                        {
                          editingId === entity.id ? (
                            <Input
                              size="sm"
                              w="190px"
                              value={editForm.mobile}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  mobile: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            <Text>{entity.mobile || "N/A"}</Text>
                          )
                        }
                      </Flex>

                      {
                        editingId === entity.id && (
                          <Flex gap={2} pt={2}>
                            <Button
                              size="sm"
                              colorScheme="green"
                              onClick={() => handleSaveEdit(entity.user_id)}
                            >
                              Save
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                          </Flex>
                        )
                      }

                    </VStack>

                  </Flex>
                </CardBody>

                <Divider />

                <CardFooter display="flex" gap={deloitte_theme.gap} px={deloitte_theme.paddingX} py={deloitte_theme.paddingY}>
                  {/* DOCUMENTS */}
                  <Accordion allowToggle flex="1" w="100%">
                    <AccordionItem>
                      <AccordionButton>
                        <Text fontWeight="semibold">
                          Documents
                        </Text>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel>
                        <Flex wrap="wrap" gap={4}>
                          {(() => {
                            const docSlots = [
                              { label: "Doc One", url: entity.doc_one },
                              { label: "Doc Two", url: entity.doc_two },
                              { label: "Other Doc", url: entity.other_doc }
                            ];

                            const extraDocsSources = Array.isArray(entity.extra_docs)
                              ? entity.extra_docs.filter(Boolean)
                              : entity.extra_docs
                                ? [entity.extra_docs]
                                : [];


                            const extraDocs = extraDocsSources.map((doc, idx) => ({
                              label: `Extra Doc ${idx + 1}`,
                              url: doc,
                            }));

                            const allDocs = [
                              ...docSlots,
                              ...extraDocs,
                            ];

                            const isExpanded = expandedDocs[entity.id];

                            const visibleDocs = isExpanded
                              ? allDocs
                              : [
                                ...docSlots
                              ];

                            const hiddenCount = isExpanded
                              ? 0
                              : allDocs.length - visibleDocs.length;

                            const renderDocItem = (doc, idx) => {
                              const commonProps = {
                                key: `${doc.label}-${idx}`,
                                w: "90px",
                                minH: "100px",
                                p: 2,
                                border: "1px solid",
                                borderColor: "gray.100",
                                borderRadius: "lg",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bg: "white",
                                boxShadow: "sm",
                                transition: "all 0.2s ease",
                                _hover: {
                                  boxShadow: "md",
                                  transform: "translateY(-2px)",
                                },
                              };

                              if (!doc.url) {
                                return (
                                  <Box {...commonProps}>
                                    <VStack spacing={2}>
                                      <Text
                                        fontSize="xs"
                                        color="gray.400"
                                        textAlign="center"
                                      >
                                        No File
                                      </Text>

                                      <Text
                                        fontSize="10px"
                                        color="gray.500"
                                        textAlign="center"
                                      >
                                        {doc.label}
                                      </Text>
                                    </VStack>
                                  </Box>
                                );
                              }

                              const fileType = getFileType(doc.url);

                              return (
                                <Box {...commonProps}>
                                  <VStack spacing={2}>
                                    <Tooltip label={`View ${doc.label}`}>
                                      <IconButton
                                        aria-label={`View ${doc.label}`}
                                        icon={
                                          fileType === "pdf"
                                            ? <AiFillFilePdf size="30px" color="#D53F8C" />
                                            : <AiFillFileImage size="30px" color="#D53F8C" />
                                        }
                                        variant="ghost"
                                        onClick={() => handleOpenFile(doc.url)}
                                      />
                                    </Tooltip>

                                    <Text
                                      fontSize="10px"
                                      color="gray.600"
                                      textAlign="center"
                                      noOfLines={2}
                                    >
                                      {doc.label}
                                    </Text>
                                  </VStack>
                                </Box>
                              );
                            };

                            return (
                              <>
                                <HStack spacing={5} flexWrap="wrap" align="start">
                                  {visibleDocs.map(renderDocItem)}

                                  {!isExpanded && hiddenCount > 0 && (
                                    <Box
                                      w="90px"
                                      minH="100px"
                                      border="1px solid"
                                      borderColor="gray.100"
                                      borderRadius="lg"
                                      display="flex"
                                      alignItems="center"
                                      justifyContent="center"
                                      cursor="pointer"
                                      bg="white"
                                      boxShadow="sm"
                                      transition="all 0.2s ease"
                                      _hover={{
                                        boxShadow: "md",
                                        transform: "translateY(-2px)",
                                      }}
                                      onClick={() =>
                                        setExpandedDocs((prev) => ({
                                          ...prev,
                                          [entity.id]: true,
                                        }))
                                      }
                                    >
                                      <VStack spacing={1}>
                                        <Text fontSize="2xl" color="gray.600">
                                          +{hiddenCount}
                                        </Text>

                                        <Text fontSize="10px" color="gray.500">
                                          More
                                        </Text>
                                      </VStack>
                                    </Box>
                                  )}
                                </HStack>
                              </>
                            );
                          })()}
                        </Flex>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>

                  {/* APPROVAL SECTION */}
                  {isPending && (
                    <Box flex="1" minW="300px">

                      <Text pb={3}>
                        <strong>Remarks:</strong>{" "}
                        {entity.remarks || "N/A"}
                      </Text>

                      <Textarea
                        isRequired={confirmModal.action === "reject"}
                        placeholder="Provide reasons for approval or rejection..."
                        value={remarks[entity.id] || ""}
                        onChange={(e) =>
                          setRemarks((prev) => ({
                            ...prev,
                            [entity.id]: e.target.value,
                          }))
                        }
                        mb={3}
                      />

                      <HStack justify="flex-end" spacing={4}>
                        <Button
                          size="sm"
                          colorScheme="green"
                          leftIcon={<CheckIcon />}
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              action: "approve",
                              entityId: entity.id,
                              flag: 1,
                            })
                          }
                        >
                          Approve
                        </Button>

                        <Button
                          size="sm"
                          colorScheme="red"
                          leftIcon={<CloseIcon />}
                          onClick={() => {

                            if (!remarks[entity.id]?.trim()) {
                              showToast({
                                title: "Please provide remarks for rejection.",
                                status: "warning",
                              });
                              return;
                            }

                            setConfirmModal({
                              isOpen: true,
                              action: "reject",
                              entityId: entity.id,
                              flag: 2,
                            });

                          }}
                        >
                          Reject
                        </Button>
                      </HStack>

                    </Box>
                  )}
                </CardFooter>
              </Card>
            )
          }
          )
        }
      </Grid>
    )
  };

  return (
    <Flex direction="column" gap={deloitte_theme.gap}>
      {/* --- Filter and Refresh Controls --- */}
      <Flex
        justify="space-between"
        align="center"
        flexWrap="wrap"
      >
        <Heading size="md" color={deloitte_theme.textPrimary}>
          Entities List
        </Heading>

        <Flex direction="row" align="center" gap={deloitte_theme.gap}>
          {renderFilter()}
          <IconButton
            aria-label="Refresh Entities"
            icon={<RepeatIcon />}
            onClick={handleRefresh}
            colorScheme="green"
            isRound
            boxShadow="md"
          />
        </Flex>
      </Flex>

      <Flex
        direction="column"
        h="63vh"
        overflowY="auto"
      >
        {renderLoading()}
        {renderEmpty()}
        {renderEntityCards()}
        {renderLoadMore()}
      </Flex>

      {/* --- Updated Confirmation Dialog --- */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null })}
        onConfirm={confirmAndExecute}
        title={
          confirmModal.action === "approve"
            ? "Confirm Approval"
            : "Confirm Rejection"
        }
        message={
          confirmModal.action === "approve"
            ? "Are you sure you want to approve the documents for this entity?"
            : "Are you sure you want to reject the documents for this entity?"
        }
        confirmText="Confirm"
        cancelText="Cancel"
        confirmColorScheme={confirmModal.action === "reject" ? "red" : "green"}
        isLoading={approving}
      />
    </Flex>
  );
};

export default EntityManagement;
