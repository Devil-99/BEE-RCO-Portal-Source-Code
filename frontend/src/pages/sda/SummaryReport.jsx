import React, { useState, useMemo } from "react";
import {
  Flex,
  Heading,
  Button,
  Divider,
  Box,
  SkeletonCircle,
} from "@chakra-ui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import deloitte_theme from "../../theme";
import FinancialYearFilter from "../../components/FinancialYearFilter";
import StatusCard from "../../components/StatusCard";

import { useGetDashboardSummaryReportQuery } from "../../redux/apiSlices/summary-dashboard/dashboardApi";

function SummaryReport({ setActiveSection, filteredSubmittedForms }) {
  const [selectedFY, setSelectedFY] = useState("");
  const { data: summaryReport} = useGetDashboardSummaryReportQuery(
    { fy_id: selectedFY },
    { skip: !selectedFY },
  );

  const registrationSummary = useMemo(
    () => summaryReport?.registration_summary ?? {},
    [summaryReport],
  );
  const submissionSummary = useMemo(
    () => summaryReport?.submission_summary ?? {},
    [summaryReport],
  );

  const totalRegistration =
    (registrationSummary?.discom_registration ?? 0) +
    (registrationSummary?.industry_registration ?? 0);
  const totalSubmission =
    (submissionSummary?.discom_closed ?? 0) +
    (submissionSummary?.discom_pending ?? 0) +
    (submissionSummary?.industry_closed ?? 0) +
    (submissionSummary?.industry_pending ?? 0);

  const submissionReport = useMemo(() => {
    if (!submissionSummary) return [];
    const summaryArray = [
      {
        type: "Discom",
        closed: submissionSummary.discom_closed,
        pending: submissionSummary.discom_pending,
      },
      {
        type: "Industry",
        closed: submissionSummary.industry_closed,
        pending: submissionSummary.industry_pending,
      },
    ];
    return summaryArray;
  }, [submissionSummary]);

  const fyFilteredForms = useMemo(() => {
    if (!selectedFY) return [];

    return (filteredSubmittedForms || []).filter((form) => {
      const formFyId = form.fy_id ?? form.financial_year_id ?? form.financialYearId;
      return String(formFyId ?? "") === String(selectedFY);
    });
  }, [filteredSubmittedForms, selectedFY]);

  const stageWiseData = useMemo(() => {
    const stageMap = {};

    fyFilteredForms.forEach((form) => {
      const stage = form.position || form.stage || "Unknown";
      stageMap[stage] = (stageMap[stage] || 0) + 1;
    });

    return Object.entries(stageMap).map(([stage, count]) => ({
      stage,
      count,
    }));
  }, [fyFilteredForms]);
  return (
    <Flex
      direction="column"
      gap={deloitte_theme.gap}
      bg={deloitte_theme.white}
      p={deloitte_theme.paddingX}
    >
      <Flex justify="space-between" align="center">
        <Heading size="md" fontWeight="semibold">
          Summary Report
          {!selectedFY && (
            <span className="text-sm text-red-500 font-normal ml-3">
              Please select a Financial Year
            </span>
          )}
        </Heading>
        <Button
          size="sm"
          bg={deloitte_theme.primary}
          _hover={{ bg: deloitte_theme.secondary }}
          borderRadius="md"
          boxShadow="md"
          fontSize="sm"
          color={deloitte_theme.textPrimary}
          onClick={() => setActiveSection("submission-details")}
        >
          View Submission Details
        </Button>
      </Flex>

      <Divider />

      <FinancialYearFilter
        selectedFY={selectedFY}
        setSelectedFY={setSelectedFY}
      />

      <Flex w="full" gap={deloitte_theme.gap} wrap="wrap">
        <StatusCard
          title="Total Registration"
          value={totalRegistration}
          helpText={`Discom - ${registrationSummary?.discom_registration ?? 0} | Industry - ${registrationSummary?.industry_registration ?? 0}`}
        />
        <StatusCard
          title="Total Form Submission"
          value={totalSubmission}
          helpText={`Discom - ${(submissionSummary?.discom_closed ?? 0) + (submissionSummary?.discom_pending ?? 0)} | Industry - ${(submissionSummary?.industry_closed ?? 0) + (submissionSummary?.industry_pending ?? 0)}`}
        />
      </Flex>

      <Flex w="full" gap={deloitte_theme.gap} wrap="wrap" align="stretch">
        <Flex
          flex="1"
          minW="400px"
          direction="column"
          gap={deloitte_theme.gap}
          alignItems="center"
        >
          <Heading textAlign="center" fontSize="lg">
            Compliance Form Submission Report
          </Heading>
          <Box w="full" h={72}>
            {submissionReport.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={submissionReport}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="type" />

                  <YAxis allowDecimals={false} />

                  <Tooltip />

                  <Legend />

                  {/* Success Count */}
                  <Bar
                    dataKey="closed"
                    name="Closed"
                    fill={deloitte_theme.ternary}
                    radius={[4, 4, 0, 0]}
                  />

                  {/* Failed Count*/}
                  <Bar
                    dataKey="pending"
                    name="Pending"
                    fill={deloitte_theme.buttonWarning}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <SkeletonCircle />
            )}
          </Box>
        </Flex>
        <Flex
          flex="1"
          minW="400px"
          direction="column"
          gap={deloitte_theme.gap}
          alignItems="center"
        >
          <Heading textAlign="center" fontSize="lg">
            Stage-wise Submission Report
          </Heading>

          <Box w="full" h={72}>
            {selectedFY && stageWiseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageWiseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis
                    allowDecimals={false}
                    label={{
                      value: "Number",
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                    }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill={deloitte_theme.buttonPrimary}
                    stroke="none"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Flex
                h="100%"
                align="center"
                justify="center"
                color="gray.500"
                textAlign="center"
              >
                {selectedFY
                  ? "No stage data available for the selected FY"
                  : "Select a financial year to view the stage-wise chart"}
              </Flex>
            )}
          </Box>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default SummaryReport;
