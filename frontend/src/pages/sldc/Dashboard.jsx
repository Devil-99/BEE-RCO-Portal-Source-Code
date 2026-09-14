import React from "react";
import { Flex, Heading } from "@chakra-ui/react";
import EntityDetailCard from "../../components/EntityDetailCard";
import deloitte_theme from "../../theme";
import SummaryReport from "./SummaryReport";

function Dashboard({ setActiveSection }) {
  return (
    <Flex direction="column" gap={deloitte_theme.gap}>
      <EntityDetailCard setActiveSection={setActiveSection} />
      <SummaryReport setActiveSection={setActiveSection}/>
    </Flex>
  );
}

export default Dashboard;