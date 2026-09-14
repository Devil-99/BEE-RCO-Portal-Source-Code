import React, { useState, useRef, useCallback, lazy, Suspense } from "react";
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
import SkeletonComponent from "../../../components/SkeletonComponent";

// lazy-load tab panels to avoid loading all tabs up-front
const EntitiesTabs = lazy(() => import("./EntitiesTabs"));
const NonObligatedTab = lazy(() => import("./NonObligatedTab"));
const AuditFirmsTabs = lazy(() => import("./AuditFirmsTabs"));
const AeaTabs = lazy(() => import("./AeaTabs"));

function Main() {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  // store refetch functions for each tab
  const refetchMap = useRef({});

  // register refetch for each tab
  const registerRefetch = useCallback((tabId, refetchFn) => {
    refetchMap.current[tabId] = refetchFn;
  }, []);

  const tabs = [
    {
      id: "ENTITY",
      label: "Obligated",
      component: EntitiesTabs,
    },
    {
      id: "NOBE",
      label: "Non-Obligated",
      component: NonObligatedTab,
    },
    {
      id: "FIRM",
      label: "Audit Firms",
      component: AuditFirmsTabs,
    },
    {
      id: "AEA",
      label: "Energy Auditors",
      component: AeaTabs,
    },
  ];

  // refresh only active tab
  const handleRefresh = () => {
    const currentTab = tabs[activeTabIndex];
    const fn = refetchMap.current[currentTab.id];
    if (fn) fn();
  };

  return (
    <Flex direction="column" gap={deloitte_theme.gap} w="100%">
      <Tabs
        index={activeTabIndex}
        onChange={(index) => setActiveTabIndex(index)}
        isLazy
        lazyBehavior="unmount"
        variant="unstyled"
        w="100%"
      >
        <Flex justify="flex-end" align="center" gap={deloitte_theme.gap}>
          <TabList borderBottomWidth="1px" borderColor="gray.200">
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                _selected={{
                  color: deloitte_theme.buttonPrimary,
                  borderBottom: "3px solid",
                  borderColor: deloitte_theme.buttonPrimary,
                  fontWeight: "semibold",
                }}
                color="gray.500"
                _focus={{ boxShadow: "none" }}
              >
                {tab.label}
              </Tab>
            ))}
          </TabList>

          <IconButton
            aria-label="Refresh Users"
            icon={<RepeatIcon />}
            onClick={handleRefresh}
            colorScheme="green"
            isRound
            boxShadow="md"
            _hover={{ transform: "scale(1.05)" }}
          />
        </Flex>

        <TabPanels>
          {tabs.map((tab) => {
            const Component = tab.component;
            return (
              <TabPanel key={tab.id} px={0} pt={4}>
                <Suspense fallback={<SkeletonComponent />}>
                  <Component registerRefetch={registerRefetch} tabId={tab.id} />
                </Suspense>
              </TabPanel>
            );
          })}
        </TabPanels>
      </Tabs>
    </Flex>
  );
}

export default Main;