import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  Box,
  useDisclosure,
  Button,
  Flex,
  Heading,
  Text,
} from "@chakra-ui/react";
import { InfoIcon } from '@chakra-ui/icons'
import { ArrowBackIcon } from "@chakra-ui/icons";
import { useSelector } from "react-redux";
import TopInfoBlock from "./TopInfoBlock";
import SectionPanel from "./SectionPanel";
import DocumentUpload from "./DocumentUpload";
import SummaryTable from "../common/SummaryTable";
import ConfirmModal from "../../../components/ConfirmModal";
import Loader from "../../../components/Loader";
import {
  useGetSectionsQuery,
  useGetFieldsQuery,
  useGetFormDataQuery,
  useGetRcoTargetPercentageQuery
} from "../../../redux/apiSlices/forms/formApi";
import { resolveLogicFields } from "../utils/logicEvaluator";
import { showToast } from "../../../components/toastService";
import { useNavigate } from "react-router-dom";
import { useSubmitFormMutation } from "../../../redux/apiSlices/formApi";
import { useDocumentUpload } from "../utils/useDocumentUpload";
import Annotation from "./Annotation";
import instance from "../../../api_instance";
import { useFY, usePeriodCode } from "../../../Hooks/useLookUp";
import deloitte_theme from "../../../theme";
import TabHeader from "./TabHeader";
import SkeletonComponent from "../../../components/SkeletonComponent";
import FormFooter from "./FormFooter";
import ExcelDownloadSubmittedForm from "./ExcelDownloadSubmittedForm";

export default function GenericForm({
  config,
  theme = {},
  summaryConfig = [],
  formContext = {},
  mode = "add",
  type,
}) {
  const navigate = useNavigate();

  const { apiBase, title, postEvaluateHook, uploadMode = "single" } = config;
  const { entity_id, fy_id, period_id } = useSelector((s) => s.formState);

  const { isOpen, onOpen, onClose } = useDisclosure()

  const [sections, setSections] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const prefilledRef = useRef(false);
  const uploadHook = useDocumentUpload(uploadMode)

  const {
    user_id,
    org_name,
    entity_registration_number,
    pat_number,
    address,
    state,
    sector_type,
  } = formContext;

  // ------- Load sections and fields (once) -------
  const { data: titles, isLoading: loadingTitles } = useGetSectionsQuery(apiBase, { skip: !apiBase });
  const { data: fields, isLoading: loadingFields } = useGetFieldsQuery(apiBase, { skip: !apiBase });

  useEffect(() => {
    // Sync loading state
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
    (fields || []).forEach((f) => {
      sectionMap[f.section_id]?.fields.push(f);
    });
    setSections(
      Object.values(sectionMap).map((section) => ({
        ...section,
        fields: (section.fields || []).sort(
          (a, b) => (a.serial || 0) - (b.serial || 0)
        ),
      }))
    );
  }, [titles, fields, loadingTitles, loadingFields]);

  const getFY = useFY();
  const fyLabel = getFY(fy_id) || "N/A";

  const getPeriod = usePeriodCode();
  const periodLabel = getPeriod(period_id) || "N/A";

  // ------- Prefill saved data only once -------
  const { data: prefillData, isLoading: loadingPrefill } = useGetFormDataQuery(
    { entity_id, fy: fy_id, period: period_id },
    { skip: !entity_id || !fy_id || !period_id }
  );

  useEffect(() => {
    if (
      !entity_id ||
      !fy_id ||
      !period_id ||
      prefilledRef.current ||
      sections.length === 0
    )
      return;

    if (loadingPrefill) return;

    if (prefillData && prefillData.length) {
      const prefilled = {};
      prefillData.forEach((item) => {
        prefilled[item.acronym] = item.value;
      });
      setFormData(prefilled);
    } else {
      const blank = {};
      sections.flatMap((s) => s.fields || []).forEach((f) => {
        if (f.type === 'INPUT') blank[f.acronym] = '';
      });
      setFormData(blank);
    }

    prefilledRef.current = true;
  }, [entity_id, fy_id, period_id, sections, prefillData, loadingPrefill]);

  const targetPrefillRef = useRef(false);

  const { data: target_pct_list = [], isLoading: loadingTargets } = useGetRcoTargetPercentageQuery({ fy_id, state }, { skip: !fy_id || !state })

  useEffect(() => {
    if (!fy_id || !type || !state) return;
    if (!prefilledRef.current) return;
    if (targetPrefillRef.current) return;

    async function fetchTargets() {
      try {

        const data = [];
        target_pct_list?.forEach(item => {
          if (item.source == 'WIND') data[0] = item;
          else if (item.source == 'HYDRO') data[1] = item;
          else if (item.source == 'DISTRIBUTED') data[2] = item;
          else if (item.source == 'OTHERS') data[3] = item;
        });
        
        setFormData((prev) => {
          const updated = { ...prev };

          if (type === "DISCOM") {
            updated["ZT1"] = data[0]?.target_pct ?? 0;
            updated["ZT2"] = data[1]?.target_pct ?? 0;
            updated["ZT3"] = data[2]?.target_pct ?? 0;
            updated["ZT4"] = data[3]?.target_pct ?? 0;

            updated["ZTT"] =
              (data[0]?.target_pct ?? 0) +
              (data[1]?.target_pct ?? 0) +
              (data[2]?.target_pct ?? 0) +
              (data[3]?.target_pct ?? 0);
          }

          if (type === "INDUSTRY") {

            updated["Z1"] =
              (data[0]?.target_pct ?? 0) +
              (data[1]?.target_pct ?? 0) +
              (data[2]?.target_pct ?? 0) +
              (data[3]?.target_pct ?? 0);
          }

          return updated;
        });

        targetPrefillRef.current = true;
      } catch (err) {
        console.error(err);

        showToast({
          title: "Error fetching Target percentage",
          description: err,
          status: "error",
        });
      }
    }

    if (target_pct_list.length)
      fetchTargets();
  }, [fy_id, type, state, prefilledRef.current, target_pct_list]);

  const allFields = useMemo(
    () => sections.flatMap((s) => s.fields || []),
    [sections]
  );
  const evaluatedData = useMemo(() => {
    try {
      return resolveLogicFields(allFields, { ...formData });
    } catch {
      return {};
    }
  }, [allFields, formData]);

  const postEvaluateResult = useMemo(() => {
    if (typeof postEvaluateHook === "function") {
      try {
        const res = postEvaluateHook(evaluatedData, formData);
        if (res?.finalEvaluatedData) return res;
      } catch { }
    }
    return { finalEvaluatedData: evaluatedData, logs: [] };
  }, [evaluatedData, formData, postEvaluateHook]);

  const finalEvaluatedDataForSubmit = postEvaluateResult.finalEvaluatedData || evaluatedData;

  const handleInputChange = useCallback(
    (acronym, value) => {
      if (mode === "view") return;

      // Identify if field is INPUT type
      const field = allFields.find((f) => f.acronym === acronym);
      const isInputField = field?.type === "INPUT";

      // Empty value allowed
      if (value === "" || value === null) {
        setFormData((prev) => ({ ...prev, [acronym]: "" }));
        return;
      }

      const numericValue = Number(value);

      // Only INPUT fields cannot be negative
      if (isInputField && !isNaN(numericValue) && numericValue < 0) {
        showToast({
          title: "Negative values are not allowed",
          status: "warning",
        });
        return;
      }

      // Store safe numeric data
      setFormData((prev) => ({
        ...prev,
        [acronym]: isNaN(numericValue) ? 0 : numericValue,
      }));
    },
    [mode, allFields]
  );

  const [submitForm, { isLoading: isSubmitting }] = useSubmitFormMutation();

  const validateForm = () =>
    sections
      .flatMap((s) => s.fields || [])
      .filter(
        (f) =>
          f.required &&
          (formData[f.acronym] === "" || formData[f.acronym] == null)
      )
      .map((f) => f.field_name || f.acronym);

  const handleSubmit = async () => {
    // Prevent submission in view-only mode
    if (mode === "view") return;

    // Validate required fields
    const missing = validateForm();
    if (missing.length) {
      showToast({
        title: "Missing Required Fields",
        description: missing.join(", "),
        status: "warning",
      });
      return;
    }

    try {
      // Handle uploads (if any)
      const uploaded = await uploadHook.uploadAll();

      // Prepare final payload
      const payload = allFields.map((f) => ({
        acronym: f.acronym,
        value: finalEvaluatedDataForSubmit[f.acronym] || 0,
        entity_id,
        fy_id,
        period_id,
        user_id,
        uploads: uploaded || [],
      }));

      await submitForm({ payload, type }).unwrap();
      navigate(-1);
    } catch (error) {
      console.error("Form submission failed:", error);
    } finally {
      setIsModalOpen(false);
    }
  };

  const handleNext = useCallback(() => {
    setSections((prev) => {
      const updated = [...prev];
      if (updated[activeTab]) updated[activeTab].isCompleted = true;
      return updated;
    });
    setActiveTab((prev) => Math.min(prev + 1, sections.length - 1));
  }, [activeTab, sections.length]);

  const getGroupedFields = (fields) =>
    (fields || []).reduce((acc, f) => {
      const group = f.sub_section || "Fill These Information";
      if (!acc[group]) acc[group] = [];
      acc[group].push(f);
      return acc;
    }, {});

  return (
    <>
      {(!sections.length || !prefilledRef.current) && <Loader />}
      <Box>

        {/* Form Header section */}
        <Flex
          align="center"
          justify="space-between"
          p={theme.paddingY}
          bg="white"
          borderBottom="1px dashed gray"
        >
          <Button
            leftIcon={<ArrowBackIcon />}
            aria-label="Back"
            variant="ghost"
            onClick={() => window.history.back()}
          >
            Back
          </Button>
          <Heading
            size="md"
            textAlign="center"
            flex={1}
            color={theme.textPrimary || "gray.700"}
          >
            {title || "Generic Form"}{" "}
            {mode === "view" && (
              <Text as="span" fontSize="sm" color="gray.500">
                (View Only)
              </Text>
            )}
          </Heading>
          <Button variant="ghost" leftIcon={<InfoIcon />} onClick={onOpen}>
            Annotations
          </Button>
          <ExcelDownloadSubmittedForm />
        </Flex>

        <TopInfoBlock
          org_name={org_name}
          entity_registration_number={entity_registration_number}
          pat_number={pat_number}
          sector_type={sector_type}
          address={address}
          state={state}
          fyLabel={fyLabel}
          periodLabel={periodLabel}
        />

        <TabHeader activeTab={activeTab} setActiveTab={setActiveTab} tabs={sections} />

        {loading ? (
          <SkeletonComponent />
        ) : activeTab === 2 ?
          <SummaryTable
            summaryConfig={summaryConfig}
            formData={formData}
            evaluatedData={evaluatedData}
            handleInputChange={handleInputChange}
            State={state}
            type={sector_type}
            targetFy={fy_id}
            readOnly={mode === "view"}
          />
          :
          <Flex direction="column">
            <SectionPanel
              groupedFields={getGroupedFields(sections[activeTab]?.fields)}
              formData={formData}
              evaluatedData={evaluatedData}
              handleInputChange={handleInputChange}
              readOnly={mode === "view"}
            />
            <DocumentUpload
              uploadMode={uploadMode}
              disabled={mode === "view"}
              allFiles={uploadHook.allFiles}
              uploadSections={uploadHook.uploadSections}
              setAllFiles={uploadHook.setAllFiles}
              setSectionFiles={uploadHook.setSectionFiles}
              uploadedPaths={uploadHook.uploadedPaths}
            />
          </Flex>
        }

        {/* Form Footer section */}
        <FormFooter
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setIsModalOpen={setIsModalOpen}
          handleNext={handleNext}
          isLastPage={sections.length - 1}
          mode={mode}
        />
      </Box >

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSubmit}
        title="Are you sure you want to submit?"
        isLoading={isSubmitting}
      />

      <Annotation type={type} isOpen={isOpen} onClose={onClose} />
    </>
  );
}