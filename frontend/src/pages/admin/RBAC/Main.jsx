import React, { useState, useRef, useCallback } from "react";
import {
  Flex,
  IconButton,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import deloitte_theme from "../../../theme";
import RoleManagement from "./RoleManagement";
import UserManagement from "./UserManagement";

function Main() {
  const [activeTab, setActiveTab] = useState("ROLE");

  const tabs = [
    {
      id: "ROLE",
      label: "Role Management",
      component: RoleManagement,
    },
    {
      id: "USER",
      label: "User Management",
      component: UserManagement,
    },
  ];

  return (
    <Flex direction="column" gap={deloitte_theme.gap} w="100%">
      <Tabs
        index={tabs.findIndex((tab) => tab.id === activeTab)}
        onChange={(index) => setActiveTab(tabs[index].id)}
        variant="unstyled"
        w="100%"
      >
        <Flex justify="flex-end" align="center" gap={3}>
          <TabList borderBottom="1px solid #e2e8f0">
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                _selected={{
                  color: deloitte_theme.buttonPrimary,
                  borderBottom: "3px solid",
                  borderColor: deloitte_theme.buttonPrimary,
                  fontWeight: "600",
                }}
                color="gray.500"
                _focus={{ boxShadow: "none" }}
              >
                {tab.label}
              </Tab>
            ))}
          </TabList>
        </Flex>

        <TabPanels>
          {tabs.map((tab) => {
            const Component = tab.component;
            return (
              <TabPanel key={tab.id} px={0} pt={4}>
                <Component tabId={tab.id} />
              </TabPanel>
            );
          })}
        </TabPanels>
      </Tabs>
    </Flex>
  );
}

export default Main;
