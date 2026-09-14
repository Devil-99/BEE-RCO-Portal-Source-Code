import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Flex,
  Heading,
  Text,
  Badge,
  VStack,
  HStack,
  IconButton,
  Tooltip,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  Grid,
  Textarea,
} from "@chakra-ui/react";
import { RepeatIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { FaFilter } from "react-icons/fa";
import { AiFillFilePdf, AiFillFileImage } from "react-icons/ai";
import SearchBar from "../../components/SearchBar";
import ConfirmModal from "../../components/ConfirmModal";
import { showToast } from "../../components/toastService";
import deloitte_theme from "../../theme";
import { useGetBuyoutRequestListQuery, useAdminBuyoutActionMutation, } from "../../redux/apiSlices/buyoutApi";
import { useOpenFileMutation } from "../../redux/apiSlices/adminControlApi";
import SkeletonComponent from "../../components/SkeletonComponent";
import { useDebounce } from "../../Hooks/useDebounceHook";
import { useFY, useStateName, useSectorName } from "../../Hooks/useLookUp";

const statusBadge = (status) => {
  switch (status) {
    case "SUBMITTED": return { color: "orange", text: "Submitted" };
    case "APPROVED": return { color: "green", text: "Approved" };
    case "REJECTED": return { color: "red", text: "Rejected" };
    default: return { color: "gray", text: status };
  }
};

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatAmount = (val) => {
  if (val == null) return "—";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
};

const getFileType = (filename) => {
  if (!filename) return null;
  const ext = filename.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
};

const BuyoutManagement = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, action: null, requestId: null,
  });
  const [remarks, setRemarks] = useState({});
  const [rejectingId, setRejectingId] = useState(null);
  const [inputSearch, setInputSearch] = useState("");
  const [searchFilterToggle, setSearchFilterToggle] = useState(false);

  const { financialYears } = useSelector((state) => state.commonState);

  const getFYCode = useFY();
  const getSectorName = useSectorName();
  const getState = useStateName();

  const debouncedSearch = useDebounce(inputSearch, 300);

  const { data: buyoutList = [], isLoading, isFetching, refetch } = useGetBuyoutRequestListQuery();
  const [adminAction, { isLoading: actionLoading }] = useAdminBuyoutActionMutation();
  const [openFile] = useOpenFileMutation();

  const filtered = useMemo(() => {
    let list = [...buyoutList];

    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }

    const search = debouncedSearch.trim().toLowerCase();
    if (search) {
      list = list.filter((r) =>
        r.entity_name?.toLowerCase().includes(search) ||
        r.utr_number?.toLowerCase().includes(search)
      );
    }

    return list;
  }, [buyoutList, statusFilter, debouncedSearch]);

  const handleRefresh = () => {
    setInputSearch("");
    refetch();
  };

  const handleConfirm = async () => {
    const { action, requestId } = confirmModal;
    try {
      await adminAction({
        buyout_request_id: requestId,
        action,
        remarks: action === "REJECT" ? (remarks[requestId] || "") : "",
      }).unwrap();
      showToast({
        title: `Request ${action.toLowerCase()}d successfully`,
        status: "success",
      });
      setConfirmModal({ isOpen: false, action: null, requestId: null });
      setRemarks((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
    } catch {
      // handled in onQueryStarted
    }
  };

  const openConfirm = (action, requestId) => {
    if (action === "REJECT" && !(remarks[requestId] || "").trim()) {
      setRejectingId(requestId);
      return;
    }
    setRejectingId(null);
    setConfirmModal({ isOpen: true, action, requestId });
  };

  const handleOpenFile = (filepath) => {
    if (!filepath) {
      showToast({
        title: "No document available",
        status: "warning",
      });
      return;
    }
    openFile(filepath);
  };

  if (isLoading) return <SkeletonComponent />;

  return (
    <Flex direction="column" gap={deloitte_theme.gap}>
      {/* Controls */}
      <Flex justify="space-between" align="center" flexWrap="wrap">
        <Heading size="md" color={deloitte_theme.textPrimary}>
          Buyout Management
        </Heading>
        <Flex direction="row" align="center" gap={deloitte_theme.gap}>
          <SearchBar
            value={inputSearch}
            onChange={setInputSearch}
            placeholder="Search entity or UTR..."
            isOpen={searchFilterToggle}
            onToggle={() => setSearchFilterToggle(!searchFilterToggle)}
          />

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
            <MenuList sx={deloitte_theme.glass} w="14rem">
              <Flex direction="column" gap={deloitte_theme.gap} w="full" px={deloitte_theme.paddingX} py={deloitte_theme.paddingY}>
                <Heading size="sm">Status</Heading>
                <Flex gap={deloitte_theme.gap} wrap="wrap">
                  {[
                    { label: "All", value: "all" },
                    { label: "Submitted", value: "SUBMITTED" },
                    { label: "Approved", value: "APPROVED" },
                    { label: "Rejected", value: "REJECTED" },
                  ].map((opt) => (
                    <Button
                      key={opt.value}
                      size="sm"
                      border="1px"
                      borderColor={deloitte_theme.primary}
                      bg={statusFilter === opt.value ? deloitte_theme.secondary : deloitte_theme.glassBackground}
                      color={deloitte_theme.white}
                      _hover={{ bg: deloitte_theme.buttonPrimary }}
                      onClick={() => setStatusFilter(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </Flex>
              </Flex>
            </MenuList>
          </Menu>

          <IconButton
            aria-label="Refresh"
            icon={<RepeatIcon />}
            onClick={handleRefresh}
            colorScheme="green"
            isRound
            boxShadow="md"
          />
        </Flex>
      </Flex>

      {/* Cards */}
      <Box h="63vh" overflowY="auto">
        {filtered.length === 0 ? (
          <Text textAlign="center" color="gray.500" mt={10} fontSize="lg">
            {isFetching ? "Loading..." : "No buyout requests found."}
          </Text>
        ) : (
          <Grid templateColumns="repeat(1, 1fr)" gap={deloitte_theme.gap} px={deloitte_theme.paddingX}>
            {filtered.map((req) => {
              const badge = statusBadge(req.status);
              return (
                <Card key={req.buyout_request_id} boxShadow="md" borderRadius="lg" variant="outline">
                  <CardHeader px={deloitte_theme.paddingX} py={deloitte_theme.paddingY}>
                    <Flex justify="space-between" align="flex-start">
                      <Heading size="lg" color="teal.700" isTruncated maxW="65%">
                        {req.entity_name || "N/A"}
                      </Heading>
                      <Badge colorScheme={badge.color} p={deloitte_theme.paddingY} textAlign="center" borderRadius="lg">
                        {badge.text}
                        <br></br>
                        {req.approved_at && formatDateTime(req.approved_at)}
                      </Badge>
                    </Flex>
                  </CardHeader>
                  <Divider />
                  <CardBody px={deloitte_theme.paddingX} py={deloitte_theme.paddingY}>
                    <Flex direction={{ base: "column", lg: "row" }} gap={deloitte_theme.gap} align="flex-start" w="full">
                      <VStack align="start" spacing={2} flex="1" minW="280px">
                        <Text fontSize="md"><strong>Registration No. :</strong> {req.entity_reg_no}</Text>
                        <Text fontSize="md"><strong>Sector Type:</strong> {getSectorName(req.sector_type)}</Text>
                        <Text fontSize="md"><strong>State:</strong> {getState(req.state_code)}</Text>
                        <Text fontSize="md"><strong>FY:</strong> {getFYCode(req.fy_id)}</Text>
                        <Text fontSize="sm" color="yellow.600"><strong>Created:</strong> {formatDateTime(req.created_at)}</Text>
                      </VStack>
                      <VStack align="start" spacing={2} flex="1" minW="280px">
                        <Text fontSize="md"><strong>Buyout Type:</strong> {req.buyout_type}</Text>
                        <Text fontSize="md"><strong>Shortfall Compliance:</strong> {req.shortfall_amount} MWh</Text>
                        <Text fontSize="md"><strong>Payable Amount:</strong> ₹ {formatAmount(req.payable_amount)}</Text>
                        <Text fontSize="md"><strong>UTR Number:</strong> {req.utr_number || "—"}</Text>
                        <Text fontSize="md"><strong>Payment Date:</strong> {formatDate(req.payment_date)}</Text>
                      </VStack>
                    </Flex>
                  </CardBody>
                  <Divider />
                  <CardFooter
                    px={deloitte_theme.paddingX}
                    py={deloitte_theme.paddingY}
                  >
                    <Box flex="1" w="100%">
                      <Text fontWeight="semibold" mb={3}>
                        Document
                      </Text>

                      <Flex wrap="wrap" gap={4}>
                        {(() => {
                          const docs = [
                            {
                              label: "UTR Doc",
                              url: req.document_url,
                            },
                          ];

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
                                        fileType === "pdf" ? (
                                          <AiFillFilePdf
                                            size="30px"
                                            color="#D53F8C"
                                          />
                                        ) : (
                                          <AiFillFileImage
                                            size="30px"
                                            color="#D53F8C"
                                          />
                                        )
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

                          return docs.map(renderDocItem);
                        })()}
                      </Flex>
                    </Box>
                  </CardFooter>
                  {req.status === "SUBMITTED" && (
                    <>
                      <Divider />
                      <Box px={deloitte_theme.paddingX} py={deloitte_theme.paddingY}>
                        {rejectingId === req.buyout_request_id ? (
                          <>
                            <Textarea
                              placeholder="Enter remarks for rejection..."
                              value={remarks[req.buyout_request_id] || ""}
                              onChange={(e) =>
                                setRemarks((prev) => ({
                                  ...prev,
                                  [req.buyout_request_id]: e.target.value,
                                }))
                              }
                              mb={3}
                              autoFocus
                            />
                            <HStack justify="flex-end" spacing={4}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setRejectingId(null); setRemarks((prev) => { const n = { ...prev }; delete n[req.buyout_request_id]; return n; }); }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="red"
                                onClick={() => {
                                  if (!(remarks[req.buyout_request_id] || "").trim()) {
                                    showToast({ title: "Please provide remarks for rejection.", status: "warning" });
                                    return;
                                  }
                                  openConfirm("REJECT", req.buyout_request_id);
                                }}
                              >
                                Confirm Rejection
                              </Button>
                            </HStack>
                          </>
                        ) : (
                          <HStack justify="flex-end" spacing={4}>
                            <Button
                              size="sm"
                              colorScheme="green"
                              leftIcon={<CheckIcon />}
                              onClick={() => openConfirm("APPROVE", req.buyout_request_id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="red"
                              leftIcon={<CloseIcon />}
                              onClick={() => openConfirm("REJECT", req.buyout_request_id)}
                            >
                              Reject
                            </Button>
                          </HStack>
                        )}
                      </Box>
                    </>
                  )}
                </Card>
              );
            })}
          </Grid>
        )}
      </Box>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => { setConfirmModal({ isOpen: false, action: null, requestId: null }); setRejectingId(null); }}
        onConfirm={handleConfirm}
        title={confirmModal.action === "APPROVE" ? "Confirm Approval" : "Confirm Rejection"}
        message={
          confirmModal.action === "APPROVE"
            ? "Are you sure you want to approve this buyout request?"
            : "Are you sure you want to reject this buyout request?"
        }
        confirmText="Confirm"
        cancelText="Cancel"
        confirmColor={confirmModal.action === "REJECT" ? "red" : "green"}
        isLoading={actionLoading}
      />
    </Flex>
  );
};

export default BuyoutManagement;
