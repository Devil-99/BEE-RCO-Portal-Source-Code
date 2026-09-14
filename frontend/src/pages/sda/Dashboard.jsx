import React from "react";
import { Flex } from "@chakra-ui/react";
import EntityDetailCard from "../../components/EntityDetailCard";
import deloitte_theme from "../../theme";
import SummaryReport from "./SummaryReport";

function Dashboard({ setActiveSection, mappedSubmittedForms }) {
  return (
    <Flex direction="column" gap={deloitte_theme.gap}>
      <EntityDetailCard setActiveSection={setActiveSection} />
      <SummaryReport
        setActiveSection={setActiveSection}
        filteredSubmittedForms={mappedSubmittedForms}
      />
    </Flex>
  );
}

export default Dashboard;
