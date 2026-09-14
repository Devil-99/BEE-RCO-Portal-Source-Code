import { useEffect, useState } from "react";
import { Flex, Wrap, WrapItem, Button, Text } from "@chakra-ui/react";
import deloitte_theme from "../../theme";
import SubmittedFormsComponent from "../dashboards/SubmittedFormsComponent";
import FinancialYearFilter from "../../components/FinancialYearFilter";

function SubmissionDetails({ mappedSubmittedForms }) {
  const [selectedFY, setSelectedFY] = useState("");
  const [submittedForms, setSubmittedForms] = useState([]);

  useEffect(() => {
    if (mappedSubmittedForms.length > 0) {
      const forms = mappedSubmittedForms.filter(form =>
        form.fy_id === selectedFY
      )
      setSubmittedForms(forms);
    }
  }, [selectedFY])

  return (
    <Flex
      direction="column"
      gap={5}
      px={deloitte_theme.paddingX}
      py={deloitte_theme.paddingY}
    >
      {/* Forms ection */}
      <Flex direction="column" gap={4}>
        {/* Section Header : Contains - FY selector and "Open Form" button */}
        <FinancialYearFilter
          selectedFY={selectedFY}
          setSelectedFY={setSelectedFY}
        />

        {/* List of Submitted forms */}
        <SubmittedFormsComponent submittedForms={submittedForms} />
      </Flex>
    </Flex>
  );
}

export default SubmissionDetails;
