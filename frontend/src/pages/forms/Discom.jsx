import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  Flex,
  Select,
  Skeleton,
  Grid,
  GridItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  InputGroup,
  InputRightAddon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  VStack,
  Tag,
  Link,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import StepIcon from "../../components/stepIcon"; // Adjust path if needed
import instance from "../../api_instance";
import { showToast } from "../../components/toastService";
import {
  useGetSectionsQuery,
  useGetFieldsQuery,
  useGetFinancialYearsQuery,
  useGetPeriodsForFyQuery,
  useUploadFilesMutation,
} from "../../redux/apiSlices/forms/formApi";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/ConfirmModal";
import deloitte_theme from "../../theme";
import { useSubmitFormMutation } from "../../redux/apiSlices/formApi";
import UploadsViewer from "../../components/Uploadviewer";
// --- File Upload Component (can be moved to its own file) ---
const FileUpload = ({ files, setFiles }) => {
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    // revoke previous urls
    setPreviews((prev) => {
      prev.forEach((p) => p && p.url && URL.revokeObjectURL(p.url));
      return [];
    });

    if (!files || files.length === 0) return;

    const next = files.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      type: f.type,
    }));
    setPreviews(next);

    return () => {
      next.forEach((p) => p && p.url && URL.revokeObjectURL(p.url));
    };
  }, [files]);

  // Remove file by index
  const handleRemoveFile = (idx) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  return (
    <FormControl>
      <FormLabel fontSize="sm" fontWeight="semibold">
        Upload Required Documents
      </FormLabel>
      <Input
        type="file"
        height="auto"
        p={1.5}
        multiple
        onChange={(e) => {
          // Merge new files with existing, avoiding duplicates by name
          const newFiles = Array.from(e.target.files);
          const merged = [...files, ...newFiles.filter(f => !files.some(existing => existing.name === f.name))];
          setFiles(merged);
        }}
        sx={{
          "::file-selector-button": {
            border: "none",
            outline: "none",
            mr: 4,
            p: 2,
            borderRadius: "md",
            bg: "gray.100",
            cursor: "pointer",
            "&:hover": { bg: "gray.200" },
          },
        }}
      />

      {files && files.length > 0 && (
        <VStack align="start" spacing={2} mt={2}>
          {files.map((f, idx) => (
            <Flex key={idx} gap={3} align="center">
              <Text fontSize="sm">{f.name}</Text>
              <Tag size="sm" variant="subtle" colorScheme="gray">
                {Math.round(f.size / 1024)} KB
              </Tag>
              <IconButton
                aria-label="Remove file"
                icon={<span style={{fontWeight:'bold'}}>&times;</span>}
                size="xs"
                onClick={() => handleRemoveFile(idx)}
                ml={2}
              />
            </Flex>
          ))}
        </VStack>
      )}

      {previews && previews.length > 0 && (
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={3} mt={3}>
          {previews.map((p, i) => (
            <Box
              key={i}
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              overflow="hidden"
              w="200px"
              h="150px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="gray.50"
              position="relative"
            >
              <IconButton
                aria-label="Remove file"
                icon={<span style={{fontWeight:'bold'}}>&times;</span>}
                size="xs"
                position="absolute"
                top={1}
                right={1}
                onClick={() => handleRemoveFile(i)}
                zIndex={2}
              />
              {p.type && p.type.startsWith("image/") ? (
                <img
                  src={p.url}
                  alt={p.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : p.type === "application/pdf" ? (
                <embed src={p.url} type="application/pdf" width="100%" height="100%" />
              ) : (
                <Text fontSize="sm" p={2} textAlign="center">
                  {p.name}
                </Text>
              )}
            </Box>
          ))}
        </Grid>
      )}
    </FormControl>
  );
};

export default function DiscomForm() {
  const [sections, setSections] = useState([]);
  const [formData, setFormData] = useState({});
  const [financialYears, setFinancialYears] = useState([]);
  const [targetFy, setTargetFy] = useState("");
  const [targetPeriod, setTargetPeriod] = useState("");
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [targetsPercentage, setTargetPercentage] = useState({});
  // Remove unused selectedFiles state
  const [uploadedPaths, setUploadedPaths] = useState([]);
  const navigate = useNavigate();

  const {
    user_id,
    org_name,
    entity_registration_number,
    address,
    state,
    role_code,
  } = useSelector((state) => state.login);

  const { entity_id, fy_id, period_id } = useSelector(state => state.formState);

  // Get current form stage from Redux or props (if available)
  // For demo, assume formStage comes from Redux (adjust as needed)
  const formStage = useSelector(state => state.formState?.stage || "USR");

  // Only editable if current user is USR and form is at USR stage
  const isEditable = role_code === "USR" && formStage === "USR";

  // --- DATA FETCHING ---
  const { data: titles, isLoading: loadingTitles } = useGetSectionsQuery('discom');
  const { data: fields, isLoading: loadingFields } = useGetFieldsQuery('discom');

  useEffect(() => {
    setLoading(Boolean(loadingTitles || loadingFields));
    if (!titles && !fields) return;

    const sectionMap = {};
    (titles || []).forEach((sec) => {
      sectionMap[sec.id] = {
        title: sec.title,
        fields: [],
        isCompleted: false,
      };
    });

    (fields || []).forEach((field) => {
      if (sectionMap[field.section_id]) {
        sectionMap[field.section_id].fields.push(field);
      }
    });

    const sectionArray = Object.values(sectionMap).map((section) => ({
      ...section,
      fields: (section.fields || []).sort((a, b) => (a.serial || 0) - (b.serial || 0)),
    }));
    setSections(sectionArray);
  }, [titles, fields, loadingTitles, loadingFields]);
  const fetchtargets = async () => {
    if (!targetFy) return;
    try {
      const res = await instance.get(
        `form-targets/state-${state}/fy-${targetFy}`
      );
      setTargetPercentage({
        ZT1: res.data[0].target_pct,
        ZT2: res.data[1].target_pct,
        ZT3: res.data[2].target_pct,
        ZT4: res.data[3].target_pct,
      });
    } catch (err) {
      showToast({
        title: "Error fetching Target percentage years",
        status: "error",
      });
    }
  };
  const { data: financialYearsData } = useGetFinancialYearsQuery();

  useEffect(() => {
    if (financialYearsData) {
      setFinancialYears(financialYearsData || []);
    }
  }, [financialYearsData]);

  const { data: periodsData } = useGetPeriodsForFyQuery(targetFy, { skip: !targetFy });

  useEffect(() => {
    if (periodsData) setPeriods(periodsData || []);
  }, [periodsData]);

  const { data: prefilledData } = useGetFormDataQuery(
    { entity_id, fy: targetFy, period: targetPeriod },
    { skip: !entity_id || !targetFy || !targetPeriod }
  );

  useEffect(() => {
    if (!prefilledData) return;
    const prefilledState = {};
    (prefilledData || []).forEach((item) => {
      prefilledState[item.acronym] = item.value;
    });
    setFormData((prev) => ({ ...prev, ...prefilledState }));
  }, [prefilledData]);


  // --- LOGIC AND SUBMISSION ---
  const resolveLogicFields = (allFields, inputState) => {
    const output = { ...inputState };
    const getValue = (acronym) => {
      const val = output[acronym];
      return val === "" || isNaN(val) ? 0 : Number(val);
    };
    let changed = true;
    while (changed) {
      changed = false;
      allFields.forEach((field) => {
        if (field.type === "LOGIC" && field.logic) {
          const expression = field.logic.replace(
            /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g,
            (match) => getValue(match)
          );
          try {
            const result = Number(eval(expression)).toFixed(3);
            if (output[field.acronym] !== result) {
              output[field.acronym] = result;
              changed = true;
            }
          } catch {
            output[field.acronym] = "Error";
          }
        }
      });
    }
    return output;
  };
  const adjust_compliance = (targets, compliance) => {
    let adjusted = { ...compliance };
    let transfers = [];

    const categories = ["Wind", "Hydro", "Dist", "Other"];
    let deficits = {};
    let surpluses = {};

    categories.forEach((cat) => {
      const diff = compliance[cat] - targets[cat];
      if (diff < 0) deficits[cat] = -diff;
      else surpluses[cat] = diff;
    });

    // distribute surplus to cover deficits
    for (let defCat in deficits) {
      for (let surCat in surpluses) {
        if (deficits[defCat] > 0 && surpluses[surCat] > 0) {
          const transfer = Math.min(deficits[defCat], surpluses[surCat]);
          adjusted[defCat] += transfer;
          adjusted[surCat] -= transfer;
          deficits[defCat] -= transfer;
          surpluses[surCat] -= transfer;
          transfers.push(`${transfer} MU moved from ${surCat} to ${defCat}`);
        }
      }
    }

    return { adjustedCompliance: adjusted, transferLogs: transfers };
  };

  const [submitForm, { isLoading: isSubmitting }] = useSubmitFormMutation();

  // helper: upload all files from all upload sections and return backend paths
  const uploadAllFiles = async () => {
    // Gather all files from all upload sections
    const allFiles = uploadSections.flatMap(section => section.files);
    if (!allFiles || allFiles.length === 0) return [];
    try {
      const form = new FormData();
      allFiles.forEach((f) => form.append("files", f));
      const resp = await instance.post("/uploads", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const files = resp.data?.files || null;
      return files;
    } catch (e) {
      showToast({ title: "File upload failed", status: "error" });
      console.error(e);
      return null;
    }
  };

  const handleSubmit = async () => {
    // upload all files from all upload sections
    let uploadedPaths = [];
    try {
      uploadedPaths = await uploadAllFiles();
      setUploadedPaths(uploadedPaths);
    } catch (e) {
      // upload failure handled in helper
    }

    // Attach all uploaded file paths to every payload entry (always send full array)
    const payload = allFields.map((field) => ({
      acronym: field.acronym,
      value: finalEvaluatedData[field.acronym] || 0,
      entity_id,
      fy_id: parseInt(targetFy),
      period_id: parseInt(targetPeriod),
      user_id,
      uploads: uploadedPaths, // always array, even if empty
    }));

    try {
      await submitForm({ payload, type: "DISCOM" }).unwrap();
      navigate("/slr-dashboard");
    } catch (err) {
      console.log(err);
    } finally {
      setIsModalOpen(false);
    }
  };

  // --- LIFECYCLE HOOKS ---
  useEffect(() => {
    fetchSectionsAndFields();
    fetchFinancialYears();
  }, []);

  useEffect(() => {
    setTargetFy(fy_id);
  }, [fy_id]);

  useEffect(() => {
    if (targetFy) {
      fetchPeriods();
      fetchtargets();
    }
  }, [targetFy]);

  useEffect(() => {
    setTargetPeriod(period_id);
  }, [periods]);

  // This hook now correctly resets the form ONLY when the period changes.
  useEffect(() => {
    // Create a base structure with empty strings for all INPUT fields
    const initialData = {};
    if (sections.length > 0) {
      sections
        .flatMap((s) => s.fields)
        .forEach((f) => {
          if (f.type === "INPUT") initialData[f.acronym] = "";
        });
    }
    setFormData(initialData);

    // If a period is selected, fetch any saved data for it
    if (targetFy && targetPeriod) {
      fetchPrefilledData();
    }
  }, [targetFy, targetPeriod]); // This effect depends only on these, not `sections`

  const allFields = React.useMemo(
    () => sections.flatMap((s) => s.fields),
    [sections]
  );
  const evaluatedData = React.useMemo(
    () => resolveLogicFields(allFields, { ...targetsPercentage, ...formData }),
    [allFields, formData, targetsPercentage]
  );
  const { adjustedCompliance, transferLogs } = React.useMemo(() => {
    const targets = {
      Wind: evaluatedData.AT1,
      Hydro: evaluatedData.AT2,
      Dist: evaluatedData.AT3,
      Other: evaluatedData.AT4,
    };
    const compliance = {
      Wind: evaluatedData.AO1,
      Hydro: evaluatedData.AO2,
      Dist: evaluatedData.AO3,
      Other: evaluatedData.AO4,
    };

    return adjust_compliance(targets, compliance);
  }, [evaluatedData]);

  // step 3: create finalEvaluatedData (with adjusted AO1–AO4)
  const finalEvaluatedData = React.useMemo(
    () => ({
      ...evaluatedData,
      AO1: adjustedCompliance.Wind,
      AO2: adjustedCompliance.Hydro,
      AO3: adjustedCompliance.Dist,
      AO4: adjustedCompliance.Other,
    }),
    [evaluatedData, adjustedCompliance]
  );

  useEffect(() => {
    if (Object.keys(adjustedCompliance).length > 0) {
      console.log("🔹 Adjusted Compliance after Redistribution:", adjustedCompliance);
      console.log("🔹 Transfer Logs:", transferLogs);
    }
  }, [adjustedCompliance, transferLogs]);
  // --- DATA STRUCTURE FOR THE SUMMARY TABLE ON TAB 3 ---
  const summaryTableData = React.useMemo(
    () => [
      {
        label: "RCO (%) specified by MoP",
        acronym: "ZTT",
        unit: "%",
        keys: ["ZT1", "ZT2", "ZT3", "ZT4", "ZTT"],
      },
      {
        label: "MoP Renewable Consumption Obligation Target",
        acronym: "ATT",
        unit: "MU",
        keys: ["AT1", "AT2", "AT3", "AT4", "ATT"],
      },
      {
        label: "Compliance without REC",
        acronym: "AOT",
        unit: "MU",
        keys: ["AO1", "AO2", "AO3", "AO4", "AOT"],
      },
      {
        label: "Compliance (%) without REC",
        acronym: "AMT",
        unit: "%",
        keys: ["AM1", "AM2", "AM3", "AM4", "AMT"],
      },
      {
        label: "Surplus / Deficit without REC",
        acronym: "cT",
        unit: "MU",
        keys: ["c1", "c2", "c3", "c4", "cT"],
      },
      {
        label: "Surplus / Deficit (%) without REC",
        acronym: "CTT",
        unit: "%",
        keys: ["CT1", "CT2", "CT3", "CT4", "CTT"],
        specialStyling: { bg: "blue.50" },
      },
      {
        label: "Surplus / Deficit (Total)",
        acronym: "EE",
        unit: "MU",
        keys: ["EE1", "EE2", "EE3", "EE4", "EE"],
      },
      {
        label: "Compliance %",
        acronym: "FTT",
        unit: "%",
        keys: ["FT1", "FT2", "FT3", "FT4", "FTT"],
      },
      {
        label: "Surplus / Deficit %",
        acronym: "GTT",
        unit: "%",
        keys: ["GT1", "GT2", "GT3", "GT4", "GTT"],
      },
    ],
    []
  );

  const columnHeaders = [
    "Wind RE",
    "Hydro RE",
    "Distributed RE",
    "Other RE",
    "Total",
  ];

  const getGroupedFields = (fields) => {
    return fields.reduce((acc, field) => {
      const groupName = field.sub_section || "General Information";
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(field);
      return acc;
    }, {});
  };

  const handleInputChange = (acronym, value) => {
    setFormData((prev) => ({
      ...prev,
      [acronym]: value === "" ? "" : Number(value),
    }));
  };

  const handleNext = () => {
    const newSections = [...sections];
    newSections[activeTab].isCompleted = true;
    setSections(newSections);
    setActiveTab((prev) => Math.min(sections.length - 1, prev + 1));
  };

  // Handler for opening upload/file store in new window
  const handleOpenUploadStore = () => {
    window.open('/upload/file-store', '_blank', 'noopener,noreferrer');
  };

  // State for multiple upload sections
  const [uploadSections, setUploadSections] = useState([{ id: Date.now(), files: [] }]);

  // Add new upload section
  const handleAddUploadSection = () => {
    setUploadSections((prev) => [...prev, { id: Date.now(), files: [] }]);
  };

  // Update files for a specific upload section
  const handleSectionFilesChange = (idx, files) => {
    setUploadSections((prev) => prev.map((section, i) => i === idx ? { ...section, files } : section));
  };

  return (
    <>
      <Box>
        {/* Header section */}
        <Flex
          align="center"
          justify="space-between"
          p={deloitte_theme.paddingY}
          bg="white"
        >
          <Button
            leftIcon={<ArrowBackIcon />}
            aria-label="Back"
            onClick={() => navigate(-1)}
            variant="ghost"
          >
            Back
          </Button>

          <Heading
            size="md"
            textAlign="center"
            flex={1}
            color={deloitte_theme.textPrimary}
          >
            RCO Compliance Data reporting by Distribution Licensee (Form A)
          </Heading>
        </Flex>

        <Grid
          templateColumns={{ base: "1fr", md: "1fr 1fr" }}
          gap={deloitte_theme.gap}
          fontSize="sm"
          p={deloitte_theme.paddingX}
          bg="white"
          fontWeight={"semibold"}
          color={deloitte_theme.textSecondary}
        >
          {/* LEFT COLUMN */}
          <GridItem>
            <Grid templateColumns="auto 10px 1fr" rowGap={3} columnGap={2}>
              <GridItem>
                <Text fontWeight="bold">
                  Name of Obligated Designated Consumer
                </Text>
              </GridItem>
              <GridItem>:</GridItem>
              <GridItem>{org_name}</GridItem>

              <GridItem>
                <Text fontWeight="bold">
                  Registration No. of Obligated Designated Consumer
                </Text>
              </GridItem>
              <GridItem>:</GridItem>
              <GridItem>{entity_registration_number}</GridItem>


              <GridItem>
                <Text fontWeight="bold">Address</Text>
              </GridItem>
              <GridItem>:</GridItem>
              <GridItem>
                {address}, {state}
              </GridItem>
            </Grid>
          </GridItem>

          {/* RIGHT COLUMN */}
          <GridItem>
            <Grid templateColumns="auto 10px 1fr" rowGap={3} columnGap={2}>
              <GridItem>
                <Text fontWeight="bold">Target Year FY</Text>
              </GridItem>
              <GridItem>:</GridItem>
              <GridItem>
                <Select
                  placeholder="Select FY"
                  size="sm"
                  value={targetFy}
                  onChange={(e) => setTargetFy(e.target.value)}
                >
                  {financialYears.map((fy) => (
                    <option key={fy.id} value={fy.id}>
                      {fy.fy_code}
                    </option>
                  ))}
                </Select>
              </GridItem>

              <GridItem>
                <Text fontWeight="bold">Compliance Period</Text>
              </GridItem>
              <GridItem>:</GridItem>
              <GridItem>
                <Select
                  placeholder={!targetFy ? "Select FY first" : "Select Period"}
                  size="sm"
                  value={targetPeriod}
                  onChange={(e) => setTargetPeriod(e.target.value)}
                  isDisabled={periods.length === 0}
                >
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.period_code}
                    </option>
                  ))}
                </Select>
              </GridItem>
            </Grid>
          </GridItem>
        </Grid>

        {loading ? (
          <Skeleton height="00px" borderRadius="xl" />
        ) : (
          <Tabs
            index={activeTab}
            onChange={(index) => setActiveTab(index)}
            isLazy
            variant="enclosed-colored"
            bg={deloitte_theme.white}
            width={"100%"}
          >
            <TabList bg="green.50">
              {sections.map((sec) => (
                <Tab
                  key={sec.title}
                  fontSize="md"
                  padding={4}
                  fontWeight="bold"
                  borderTopRadius="lg"
                  width={"100%"}
                  _selected={{
                    color: "white",
                    bg: `${deloitte_theme.formActiveNavbar}`,
                    boxShadow: "md",
                  }}
                >
                  {/* UPDATED: Use the new StepIcon component */}
                  <StepIcon
                    isCompleted={sec.isCompleted}
                    height={"1.5625rem"}
                    width={"2.1875rem"}
                  />
                  {sec.title}
                </Tab>
              ))}
            </TabList>
            <Box
              borderBottomRadius="lg"
              borderWidth="1px"
              borderColor="gray.200"
              shadow="md"
            >
              <TabPanels>
                {sections.map((section, index) => {
                  const groupedFields = getGroupedFields(section.fields);
                  return (
                    <TabPanel key={section.title} p={0}>
                      <Box maxH="70vh" overflowY="auto">
                        <Stack spacing={6}>
                          {/* --- CONDITIONAL LAYOUT LOGIC --- */}
                          {index === 2 ? (
                            // --- LAYOUT FOR TAB 3 (Summary Table) ---
                            <Box px={4}>
                              <TableContainer
                                borderWidth="1px"
                                borderColor="gray.300"
                                mt={5}
                              >
                                <Table
                                  variant="simple"
                                  size="sm"
                                  sx={{ tableLayout: "fixed" }}
                                >
                                  <Thead>
                                    <Tr bg="gray.100">
                                      <Th w="35%">Parameter</Th>
                                      <Th w="15%">Acronym/Formula</Th>
                                      <Th w="10%">Unit</Th>
                                      {columnHeaders.map((header) => (
                                        <Th key={header} isNumeric>
                                          {header}
                                        </Th>
                                      ))}
                                    </Tr>
                                  </Thead>
                                  <Tbody>
                                    {summaryTableData.map((row) => (
                                      <Tr
                                        key={row.label}
                                        bg={row.specialStyling?.bg || "white"}
                                      >
                                        <Td
                                          border="1px solid"
                                          borderColor="gray.200"
                                          fontWeight="medium"
                                        >
                                          {row.label}
                                        </Td>
                                        <Td
                                          border="1px solid"
                                          borderColor="gray.200"
                                        >
                                          {row.acronym}
                                        </Td>
                                        <Td
                                          border="1px solid"
                                          borderColor="gray.200"
                                        >
                                          {row.unit}
                                        </Td>
                                        {row.keys.map((dataKey, idx) => (
                                          <Td
                                            key={`${row.label}-${idx}`}
                                            border="1px solid"
                                            borderColor="gray.200"
                                            isNumeric
                                            bg={deloitte_theme.primary}
                                          >
                                            {dataKey
                                              ? `${(
                                                Number(
                                                  evaluatedData[dataKey]
                                                ) || 0
                                              ).toFixed(
                                                row.unit === "%" ? 2 : 3
                                              )}${row.unit === "%" ? "%" : ""
                                              }`
                                              : ""}
                                          </Td>
                                        ))}
                                      </Tr>
                                    ))}
                                  </Tbody>
                                </Table>
                              </TableContainer>
                              <Box
                                bg="grey.600"
                                color="white"
                                p={4}
                                mt={-1}
                                borderBottomRadius="md"
                              >
                                <Text fontWeight="bold">Notes:</Text>
                              </Box>
                            </Box>
                          ) : (
                            // --- LAYOUT FOR OTHER TABS (Hierarchical Grid) ---

                            Object.entries(groupedFields).map(
                              ([groupName, fieldsInGroup]) => (
                                <>
                                  <Box
                                    key={groupName}
                                    bg={deloitte_theme.white}
                                    p={{ base: 4, md: 5 }}
                                  >
                                    <Heading
                                      fontSize="lg"
                                      mb={5}
                                      color="gray.700"
                                      borderBottomWidth="1px"
                                      pb={2}
                                    >
                                      {groupName}
                                    </Heading>
                                    <Grid
                                      templateColumns={{
                                        base: "1fr",
                                        md: "repeat(2, 1fr)",
                                        lg: "repeat(4, 1fr)",
                                      }}
                                      gap={5}
                                      alignItems="end"
                                    >
                                      {fieldsInGroup.map((field) => (
                                        <GridItem
                                          key={field.acronym}
                                          colSpan={
                                            field.type === "LOGIC"
                                              ? { base: 2, lg: 4 }
                                              : 1
                                          }
                                          colStart={{
                                            lg: field.column_id || "auto",
                                          }}
                                        >
                                          {field.type === "LOGIC" ? (
                                            <Flex
                                              justify="space-between"
                                              align="center"
                                              bg={deloitte_theme.formbackground}
                                              p={3}
                                              borderRadius="md"
                                              borderLeft="4px solid"
                                              borderColor={
                                                deloitte_theme.logicFormLeftBorder
                                              }
                                            >
                                              <Text
                                                fontSize="sm"
                                                fontWeight="bold"
                                                color="grey.800"
                                              >
                                                {" "}
                                                {field.field_name}
                                              </Text>
                                              <InputGroup
                                                size="sm"
                                                maxW="200px"
                                                bg={deloitte_theme.primary}
                                              >
                                                <Input
                                                  bg={deloitte_theme.primary}
                                                  isReadOnly
                                                  border={0}
                                                  value={
                                                    evaluatedData[
                                                    field.acronym
                                                    ] || "0.000"
                                                  }
                                                  padding={0}
                                                  margin={0}
                                                  textAlign="right"
                                                  fontWeight="bold"
                                                />
                                                <InputRightAddon
                                                  border={0}
                                                  margin={0}
                                                  bg={deloitte_theme.primary}
                                                >
                                                  {field.unit}
                                                </InputRightAddon>
                                              </InputGroup>
                                            </Flex>
                                          ) : (
                                            <FormControl
                                              p={3}
                                              flexDir={"column"}
                                            >
                                              <FormLabel
                                                fontSize="sm"
                                                px={3}
                                                fontWeight="semibold"
                                                color={
                                                  deloitte_theme.textSecondary
                                                }
                                                sx={{
                                                  display: "flex ",
                                                  alignItems: "center",
                                                }}
                                              >
                                                {field.field_name}
                                              </FormLabel>
                                              <InputGroup
                                                size="sm"
                                                borderRadius="lg"
                                              >
                                                <Input
                                                  type="number"
                                                  value={
                                                    field.type === "INPUT"
                                                      ? formData[
                                                      field.acronym
                                                      ] ?? ""
                                                      : evaluatedData[
                                                      field.acronym
                                                      ] ?? ""
                                                  }
                                                  onChange={(e) =>
                                                    handleInputChange(
                                                      field.acronym,
                                                      e.target.value
                                                    )
                                                  }
                                                  isReadOnly={
                                                    field.type !== "INPUT" || !isEditable
                                                  }
                                                  bgColor={
                                                    field.type !== "INPUT"
                                                      ? "gray.200"
                                                      : "white"
                                                  }
                                                  fontSize={"sm"}
                                                  fontWeight={"medium"}
                                                  placeholder="0.000"
                                                  borderColor={
                                                    deloitte_theme.bordercolor
                                                  }
                                                  borderRadius={"0.5rem"}
                                                />
                                                <InputRightAddon>
                                                  {field.unit}
                                                </InputRightAddon>
                                              </InputGroup>
                                            </FormControl>
                                          )}
                                        </GridItem>
                                      ))}
                                    </Grid>
                                  </Box>
                                  <Box bg="white" p={5} borderRadius="xl">
                                    <Heading
                                      fontSize="lg"
                                      mb={4}
                                      color="gray.700"
                                      borderBottomWidth="1px"
                                      pb={2}
                                    >
                                      Attachments
                                    </Heading>
                                    {role_code == "USR" ? (
 <GridItem colSpan={{ md: 2 }}>
                                      {uploadSections.map((section, idx) => (
                                        <Box key={section.id} mb={4}>
                                          <FileUpload
                                            files={section.files}
                                            setFiles={(files) => handleSectionFilesChange(idx, files)}
                                          />
                                        </Box>
                                      ))}

                                      {uploadedPaths && uploadedPaths.length > 0 && (
                                        <VStack align="start" mt={3} spacing={2}>
                                          {uploadedPaths.map((url, idx) => {
                                            const fileName = url.split('/').pop();
                                            const isImage = /\.(png|jpg|jpeg|gif)$/i.test(fileName);
                                            const isPDF = /\.pdf$/i.test(fileName);
                                            return (
                                              <Box key={idx} border="1px solid" borderColor="gray.200" borderRadius="md" p={2} w="200px" h="150px" bg="gray.50">
                                                <Text fontSize="sm" mb={1}>{fileName}</Text>
                                                <a href={url} target="_blank" rel="noopener noreferrer">
                                                  {isImage ? (
                                                    <img src={url} alt={fileName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                  ) : isPDF ? (
                                                    <embed src={url} type="application/pdf" width="100%" height="100%" />
                                                  ) : (
                                                    <Text fontSize="sm" p={2} textAlign="center">Download</Text>
                                                  )}
                                                </a>
                                              </Box>
                                            );
                                          })}
                                        </VStack>
                                      )}
                                    </GridItem>
                                    ) : <UploadsViewer entityId={entity_id} fyId={targetFy} periodId={targetPeriod} /> }
                                   
                                  </Box>
                                </>
                              )
                            )
                          )}
                        </Stack>
                      </Box>
                    </TabPanel>
                  );
                })}
              </TabPanels>

              <Flex
                justify="space-between"
                p={4}
                borderTopWidth="1px"
                borderColor="gray.200"
              >
                <Button
                  onClick={() => setActiveTab((prev) => Math.max(0, prev - 1))}
                  isDisabled={activeTab === 0}
                >
                  Back
                </Button>
                {activeTab === sections.length - 1 ? (
                  <Button
                    colorScheme="green"
                    onClick={() => setIsModalOpen(true)}
                    isDisabled={loading || !isEditable}
                  >
                    Submit
                  </Button>
                ) : (
                  <Button
                    colorScheme="green"
                    onClick={handleNext}
                    isDisabled={sections.length === 0}
                  >
                    Next
                  </Button>
                )}
              </Flex>
            </Box>
          </Tabs>
        )}
      </Box>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSubmit}
        isLoading={isSubmitting}
        title="Are you sure you want to submit?"
        message=""
      />
    </>
  );
}

