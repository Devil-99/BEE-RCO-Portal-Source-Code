import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  RadioGroup,
  Radio,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  VStack,
  Tag,
  Link,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import StepIcon from "../../components/stepIcon"; // Ensure this path is correct
import instance from "../../api_instance";
import { showToast } from "../../components/toastService";
import { useSelector } from "react-redux";
import {
  useGetSectionsQuery,
  useGetFieldsQuery,
  useGetFinancialYearsQuery,
  useGetPeriodsForFyQuery,
  useGetFormDataQuery,
} from "../../redux/apiSlices/forms/formApi";
import ConfirmModal from "../../components/ConfirmModal";
import deloitte_theme from "../../theme";
import { useSubmitFormMutation } from "../../redux/apiSlices/formApi";
import { IconButton } from "@chakra-ui/react";
import { SmallCloseIcon } from "@chakra-ui/icons";
// --- File Upload Component (can be moved to its own file) ---

const FileUpload = ({ files, setFiles }) => {
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    setPreviews((prev) => {
      prev.forEach((p) => p && p.url && URL.revokeObjectURL(p.url));
      return [];
    });

    if (!files || files.length === 0) return;

    const next = files.map((f) => ({ name: f.name, url: URL.createObjectURL(f), type: f.type }));
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
      <FormLabel fontSize="sm" fontWeight="semibold" mb={2}>
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
                icon={<SmallCloseIcon />}
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
                icon={<SmallCloseIcon />}
                size="xs"
                position="absolute"
                top={1}
                right={1}
                onClick={() => handleRemoveFile(i)}
                zIndex={2}
              />
              {p.type && p.type.startsWith("image/") ? (
                <img src={p.url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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


export default function Cpp() {
  const [sections, setSections] = useState([]);
  const [formData, setFormData] = useState({});
  const [financialYears, setFinancialYears] = useState([]);
  const [targetFy, setTargetFy] = useState("");
  const [targetPeriod, setTargetPeriod] = useState("");
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  // State for all uploaded files from one button
  const [allFiles, setAllFiles] = useState([]);
  const [uploadedPaths, setUploadedPaths] = useState([]);
  const navigate = useNavigate();

  const {
    user_id,
    username,
    org_name,
    sector_type,
    entity_registration_number,
    address,
    state,
  } = useSelector((state) => state.login);
  const { entity_id, fy_id, period_id } = useSelector(state => state.formState);

  // --- DATA FETCHING ---
  const { data: titles, isLoading: loadingTitles } = useGetSectionsQuery('cpp');
  const { data: fields, isLoading: loadingFields } = useGetFieldsQuery('cpp');

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

  const { data: financialYearsData } = useGetFinancialYearsQuery();
  useEffect(() => {
    if (financialYearsData) setFinancialYears(financialYearsData || []);
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
    const state = {};
    (prefilledData || []).forEach((item) => {
      state[item.acronym] = item.value;
    });
    setFormData(state);
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

  const [submitForm, { isLoading: isSubmitting }] = useSubmitFormMutation();
  // helper: upload all files from one button and return backend paths
  const uploadAllFiles = async () => {
    if (!allFiles || allFiles.length === 0) return [];
    try {
      const form = new FormData();
      allFiles.forEach((f) => form.append("files", f));
      const resp = await instance.post("/uploads", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const files = resp.data?.files || [];
      return files;
    } catch (e) {
      showToast({ title: "File upload failed", status: "error" });
      console.error(e);
      return [];
    }
  };

  const handleSubmit = async () => {
    // Upload all files and get backend paths
    let uploadedPaths = [];
    try {
      uploadedPaths = await uploadAllFiles();
      setUploadedPaths(uploadedPaths);
    } catch (e) {
      // upload failure handled in helper
    }

    // Attach all uploaded file paths to every payload entry (as per backend expectation)
    const payload = allFields.map((field) => ({
      acronym: field.acronym,
      value: evaluatedData[field.acronym] || 0,
      entity_id,
      fy_id: parseInt(targetFy),
      period_id: parseInt(targetPeriod),
      user_id,
      uploads: uploadedPaths, // always array, even if empty
    }));

    try {
      // Directly call the backend API for form submission
      await instance.post("/form/cpp/submit", payload);
      showToast({ title: "Form submitted successfully", status: "success" });
      navigate("/slr-dashboard");
    } catch (err) {
      showToast({ title: "Form submission failed", status: "error" });
      console.log(err);
    } finally {
      setIsModalOpen(false);
    }
  };

  // --- LIFECYCLE HOOKS ---
  useEffect(() => {
    fetchSections();
    fetchFinancialYears();
  }, []);

  useEffect(() => {
    setTargetFy(fy_id);
  }, [fy_id]);

  useEffect(() => {
    if (targetFy) fetchPeriods();
  }, [targetFy]);

  useEffect(() => {
    setTargetPeriod(period_id);
  }, [periods]);

  useEffect(() => {
    const initialData = {};
    if (sections.length > 0) {
      allFields.forEach((f) => {
        if (f.type === "INPUT") initialData[f.acronym] = "";
      });
    }
    setFormData(initialData);

    if (targetFy && targetPeriod) {
      fetchPrefilledData();
    }
  }, [targetFy, targetPeriod]);

  const allFields = React.useMemo(
    () => sections.flatMap((s) => s.fields),
    [sections]
  );
  const evaluatedData = React.useMemo(
    () => resolveLogicFields(allFields, formData),
    [allFields, formData]
  );

  // --- Data structure for the summary table ---
  const summaryTableData = React.useMemo(
    () => [
      {
        label: "RCO (%) notified by MoP",
        acronym: "Z1",
        unit: "%",
        dataKey: "Z1",
        type: "INPUT",
      },
      {
        label: "Renewable Consumption Obligation Target",
        acronym: "K * Z1 / 100",
        unit: "MU",
        dataKey: "Atarget",
        type: "LOGIC",
      },
      {
        label: "Compliance",
        acronym: "Y1 + T1",
        unit: "MU",
        dataKey: "D2",
        type: "LOGIC",
      },
      {
        label: "Compliance (%)",
        acronym: "(D2 / K) * 100",
        unit: "%",
        dataKey: "B2",
        type: "LOGIC",
      },
      {
        label: "Surplus / Deficit #",
        acronym: "D2 - Atarget",
        unit: "MU",
        dataKey: "C2",
        type: "LOGIC",
      },
      {
        label: "Surplus / Deficit # (%)",
        acronym: "B2 - Z1",
        unit: "%",
        dataKey: "E2",
        type: "LOGIC",
      },
    ],
    []
  );

  const getGroupedFields = (fields) => {
    return fields.reduce((acc, field) => {
      const groupName = field.sub_section || "Fill These Information";
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

  return (
    <>
      <Box>
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
            RCO Compliance Data reporting (Form A) - DCs with CPP & Open Access
          </Heading>
        </Flex>

        {/* --- Top Information Block --- */}
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
            <Grid templateColumns="auto 10px 1fr" rowGap={3} columnGap={4}>
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
                <Text fontWeight="bold">
                  Energy Intensive Sector of Designated Consumer
                </Text>
              </GridItem>
              <GridItem>:</GridItem>
              <GridItem>{sector_type}</GridItem>

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


              <GridItem>
                <Text fontWeight="bold">Address</Text>
              </GridItem>
              <GridItem>:</GridItem>
              <GridItem>
                {address}, {state}
              </GridItem>

            </Grid>
          </GridItem>
        </Grid>

        {/* --- Main Form UI --- */}
        {loading ? (
          <Skeleton height="300px" borderRadius="xl" />
        ) : (
          <Tabs
            index={activeTab}
            onChange={(index) => setActiveTab(index)}
            isLazy
            variant="enclosed-colored"
            width={"100%"}
          >
            <TabList>
              {sections.map((sec, i) => (
                <Tab
                  key={sec.title}
                  fontSize="md"
                  py={3}
                  px={6}
                  fontWeight="bold"
                  borderTopRadius="lg"
                  bg="gray.100"
                  width={"100%"}
                  _selected={{
                    color: "white",
                    bg: "green.600",
                    boxShadow: "md",
                  }}
                >
                  <StepIcon
                    isCompleted={activeTab > i || sec.isCompleted}
                    height={"1.5rem"}
                    width={"2rem"}
                  />
                  {sec.title}
                </Tab>
              ))}
            </TabList>
            <Box
              bg="white"
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
                      <Box
                        maxH={index !== 2 ? "60vh" : "none"}
                        overflowY={index !== 2 ? "auto" : "visible"}
                      >
                        <Stack spacing={6} p={1}>
                          {/* --- CONDITIONAL LAYOUT LOGIC --- */}
                          {index === 2 ? (
                            // --- LAYOUT FOR TAB 3 (Summary Table) ---
                            <Box p={{ base: 2, md: 4 }}>
                              <TableContainer
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="md"
                              >
                                <Table variant="simple" size="sm">
                                  <Thead>
                                    <Tr bg="gray.50">
                                      <Th w="40%" py={4}>
                                        Parameter
                                      </Th>
                                      <Th w="25%">Acronym/Formula</Th>
                                      <Th w="10%">Unit</Th>
                                      <Th w="25%" isNumeric>
                                        Value
                                      </Th>
                                    </Tr>
                                  </Thead>
                                  <Tbody>
                                    {summaryTableData.map((row) => (
                                      <Tr key={row.label}>
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
                                        <Td
                                          border="1px solid"
                                          borderColor="gray.200"
                                          isNumeric
                                          bg={deloitte_theme.primary}
                                        >
                                          <Flex
                                            align="center"
                                            justify="flex-end"
                                          >
                                            {row.type === "INPUT" ? (
                                              <Input
                                                type="number"
                                                w="120px"
                                                size="sm"
                                                textAlign="right"
                                                value={
                                                  formData[row.dataKey] ?? ""
                                                }
                                                onChange={(e) =>
                                                  handleInputChange(
                                                    row.dataKey,
                                                    e.target.value
                                                  )
                                                }
                                                placeholder="0.00"
                                                width="100%"
                                              />
                                            ) : (
                                              <Text fontWeight="bold">
                                                {`${(
                                                  Number(
                                                    evaluatedData[row.dataKey]
                                                  ) || 0
                                                ).toFixed(
                                                  row.unit === "%" ? 2 : 3
                                                )}`}
                                              </Text>
                                            )}
                                          </Flex>
                                        </Td>
                                      </Tr>
                                    ))}
                                  </Tbody>
                                </Table>
                              </TableContainer>
                            </Box>
                          ) : (
                            // --- LAYOUT FOR OTHER TABS (Standard Form Fields) ---
                            <>
                              {Object.entries(groupedFields).map(
                                ([groupName, fieldsInGroup]) => (
                                  <Box
                                    key={groupName}
                                    bg="white"
                                    p={{ base: 4, md: 5 }}
                                    borderRadius="xl"
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
                                                {field.field_name}
                                              </Text>
                                              <InputGroup
                                                size="sm"
                                                maxW="200px"
                                              >
                                                <Input
                                                  bg="transparent"
                                                  isReadOnly
                                                  border={0}
                                                  value={
                                                    evaluatedData[
                                                    field.acronym
                                                    ] || "0.000"
                                                  }
                                                  textAlign="right"
                                                  fontWeight="bold"
                                                />
                                                <InputRightAddon
                                                  border={0}
                                                  bg="transparent"
                                                >
                                                  {field.unit}
                                                </InputRightAddon>
                                              </InputGroup>
                                            </Flex>
                                          ) : (
                                            <FormControl>
                                              <FormLabel
                                                fontSize="sm"
                                                fontWeight="semibold"
                                                color={
                                                  deloitte_theme.textSecondary
                                                }
                                              >
                                                {field.field_name}
                                              </FormLabel>
                                              <InputGroup size="sm">
                                                <Input
                                                  type="number"
                                                  value={
                                                    formData[field.acronym] ??
                                                    ""
                                                  }
                                                  onChange={(e) =>
                                                    handleInputChange(
                                                      field.acronym,
                                                      e.target.value
                                                    )
                                                  }
                                                  isReadOnly={
                                                    field.type !== "INPUT"
                                                  }
                                                  bgColor={
                                                    field.type !== "INPUT"
                                                      ? "gray.100"
                                                      : "white"
                                                  }
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
                                )
                              )}
                              <Box
                                bg="white"
                                p={{ base: 4, md: 5 }}
                                borderRadius="xl"
                              >
                                <Heading
                                  fontSize="lg"
                                  mb={4}
                                  color="gray.700"
                                  borderBottomWidth="1px"
                                  pb={2}
                                >
                                  Attachments
                                </Heading>
                                <GridItem colSpan={{ md: 2 }}>
                                  <FileUpload files={allFiles} setFiles={setAllFiles} />
                                  {/* Show preview of uploaded file paths after form submission */}
                                  {uploadedPaths && uploadedPaths.length > 0 && (
                                    <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={3} mt={3}>
                                      {uploadedPaths.map((p, i) => {
                                        const isImage = /\.(jpe?g|png|gif|webp|svg)$/i.test(p);
                                        const isPdf = /\.pdf$/i.test(p);
                                        return (
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
                                          >
                                            {isImage ? (
                                              <img src={p} alt={p} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            ) : isPdf ? (
                                              <embed src={p} type="application/pdf" width="100%" height="100%" />
                                            ) : (
                                              <Link href={p} isExternal color="blue.600">
                                                {p}
                                              </Link>
                                            )}
                                          </Box>
                                        );
                                      })}
                                    </Grid>
                                  )}
                                </GridItem>
                              </Box>
                            </>
                          )}
                        </Stack>
                      </Box>
                    </TabPanel>
                  );
                })}
              </TabPanels>
              {/* --- Static Navigation Footer --- */}
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
                    isDisabled={loading}
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
      />
    </>
  );
}
