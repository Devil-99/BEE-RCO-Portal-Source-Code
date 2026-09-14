import React from "react";
import {
  Box,
  SimpleGrid,
  Text,
  Divider,
  Avatar,
  HStack,
  VStack,
  Tag,
  useColorModeValue,
  Button,
} from "@chakra-ui/react";
import deloitte_theme from "../theme";
import { useSelector } from "react-redux";
import {
  useStateName,
  useSectorName,
} from "../Hooks/useLookUp";
import backgroundImage from "../assets/images/homepage-18.jpg"

function EntityDetailCard({ setActiveSection }) {
  const userDetails = useSelector((state) => state.login);
  const getStateName = useStateName();
  const getSectorName = useSectorName();

  const labelColor = useColorModeValue("gray.300", "gray.600");
  const valueColor = useColorModeValue("gray.100", "gray.800");

  return (
    <Box
      borderRadius="md"
      boxShadow="md"
      px={6}
      py={deloitte_theme.paddingX}
      bgImage={backgroundImage}
      bgSize="cover"
      bgPosition="center"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        inset="0"
        backdropFilter="blur(5px)"
        bg="rgba(0, 0, 0, 0.2)" // optional tint
      />
      <Box position="relative" color={deloitte_theme.white}>
        <HStack
          spacing={6}
          align="top"
          justify="space-between"
          mb={deloitte_theme.paddingX}
        >
          {/* LEFT SIDE */}
          <HStack spacing={6} align="top">
            <Avatar
              name={
                userDetails.full_name ||
                "User"
              }
              bg={deloitte_theme.ternary}
              color="white"
              size="lg"
            />
            <VStack align="start" spacing={0}>
              <Text
                fontSize="lg"
                fontWeight="bold"
                color={deloitte_theme.white}
              >
                👋 Welcome, {userDetails.full_name || "User"}
              </Text>
              <Text fontSize="md" color={deloitte_theme.white}>
                {userDetails?.role_code}
              </Text>
            </VStack>
          </HStack>

          {/* RIGHT SIDE */}
          <VStack align="end" spacing={2}>
            <Text
              fontSize="lg"
              color={deloitte_theme.secondary}
              fontWeight="500"
            >
              {getSectorName(userDetails.sector_type)}
            </Text>
            <Text
              fontSize="md"
              color="gray.200"
              fontWeight="500"
            >
              {userDetails.entity_type || "N/A"}
            </Text>
          </VStack>
        </HStack>

        <Divider borderColor="gray.200" mb={4} />

        {/* Details Section */}
        <SimpleGrid
          columns={{ base: 1, md: 2 }}
          spacingY={3}
          spacingX={8}
        >
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" color={labelColor}>
              Username
            </Text>
            <Text fontSize="md" fontWeight="600" color={valueColor}>
              {userDetails.username || "N/A"}
            </Text>
          </VStack>

          <VStack align="start" spacing={0}>
            <Text fontSize="sm" color={labelColor}>
              Entity Registration No
            </Text>
            <Text fontSize="md" fontWeight="600" color={valueColor}>
              {userDetails.entity_registration_number || "N/A"}
            </Text>
          </VStack>

          <VStack align="start" spacing={0}>
            <Text fontSize="sm" color={labelColor}>
              Organisation
            </Text>
            <Text fontSize="md" fontWeight="600" color={valueColor}>
              {userDetails.org_name || "N/A"}
            </Text>
          </VStack>

          <VStack align="start" spacing={0}>
            <Text fontSize="sm" color={labelColor}>
              State
            </Text>
            <Text fontSize="md" fontWeight="600" color={valueColor}>
              {getStateName(userDetails.state) || "N/A"}
            </Text>
          </VStack>

          <VStack align="start" spacing={0}>
            <Text fontSize="sm" color={labelColor}>
              Address
            </Text>
            <Text fontSize="md" fontWeight="600" color={valueColor}>
              {userDetails.address || "N/A"}
            </Text>
          </VStack>

          <VStack align="start" spacing={0}>
            <Text fontSize="sm" color={labelColor}>
              Entity Type
            </Text>
            <Text fontSize="md" fontWeight="600" color={valueColor}>
              {userDetails.entity_type || "N/A"}
            </Text>
          </VStack>
        </SimpleGrid>
      </Box>
    </Box >
  );
}

export default EntityDetailCard;