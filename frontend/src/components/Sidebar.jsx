import { Button, Flex, Icon, Text, Box } from '@chakra-ui/react';
import { FaCircleChevronLeft } from "react-icons/fa6";
import { motion } from 'framer-motion';
import { useState } from 'react';
import deloitte_theme from '../theme';

const MotionFlex = motion(Flex);
const MotionBox = motion(Box);
const MotionIcon = motion(FaCircleChevronLeft);

const SIDEBAR_EXPANDED = 280;
const SIDEBAR_COLLAPSED = 72;

const Sidebar = ({ sections, activeSection, onSectionChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sectionChangeHandler = (id)=> {
    onSectionChange(id);
    setIsCollapsed(false);
  }

  return (
    <MotionFlex
      direction="column"
      bg="white"
      boxShadow="lg"
      borderRight="1px"
      borderColor="gray.200"
      position="relative"
      animate={{
        width: isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
      }}
      transition={{
        type: "tween",
        duration: 0.25,
        ease: "easeInOut",
      }}
    >
      {/* Toggle Button */}
      <MotionIcon
        onClick={() => setIsCollapsed(prev => !prev)}
        animate={{ rotate: isCollapsed ? 180 : 0 }}
        transition={{ duration: 0.25 }}
        style={{
          position: 'absolute',
          top: '0',
          right: '-15px',
          fontSize: '1.8rem',
          backgroundColor: 'white',
          borderRadius: '50%',
          color: deloitte_theme.ternary,
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}
      />

      {/* Scrollable Area */}
      <Flex
        h="80vh"
        gap={2}
        p={deloitte_theme.paddingY}
        direction="column"
        overflowY="auto"
        overflowX="hidden"
      >
        {sections.map(section => (
          <Button
            key={section.id}
            onClick={() => sectionChangeHandler(section.id)}
            variant="ghost"
            isActive={activeSection === section.id}
            minH={10}
            width="100%"
            px={2}
            justifyContent="flex-start"
            _active={{
              bg: deloitte_theme.secondary,
              color: deloitte_theme.white,
            }}
            _hover={{ bg: 'gray.200' }}
          >
            {/* Icon Wrapper (fixed width) */}
            <Flex
              align="center"
              justify="center"
              width="40px"
              minWidth="40px"
            >
              <Icon as={section.icon} fontSize="20px" />
            </Flex>

            {/* Label */}
            <MotionBox
              ml="8px"
              whiteSpace="nowrap"
              initial={false}
              animate={{
                opacity: isCollapsed ? 0 : 1,
                width: isCollapsed ? 0 : "auto",
              }}
              transition={{ duration: 0.2 }}
              overflow="hidden"
            >
              <Text py={1}>{section.label}</Text>
            </MotionBox>
          </Button>
        ))}
      </Flex>
    </MotionFlex>
  );
};

export default Sidebar;
