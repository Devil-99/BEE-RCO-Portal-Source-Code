import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Divider,
  Badge,
  Flex,
  VStack,
} from "@chakra-ui/react";

const Step = ({ step, title, desc }) => (
  <Flex
    align="flex-start"
    gap={4}
    p={5}
    bg="white"
    border="1px solid"
    borderColor="gray.200"
    rounded="xl"
    position="relative"
    transition="all 0.25s ease"
    _hover={{
      transform: "translateY(-3px)",
      shadow: "lg",
      borderColor: "green.400",
    }}
  >
    <Flex
      align="center"
      justify="center"
      w="34px"
      h="34px"
      rounded="full"
      bg="green.500"
      color="white"
      fontWeight="bold"
      fontSize="sm"
      flexShrink={0}
      boxShadow="0 6px 14px rgba(34,197,94,0.25)"
    >
      {step}
    </Flex>

    <Box>
      <Text fontWeight="semibold" color="gray.800" fontSize="md">
        {title}
      </Text>
      <Text fontSize="sm" color="gray.600" mt={1} lineHeight="1.6">
        {desc}
      </Text>
    </Box>
  </Flex>
);



const InfoCard = ({ title, value, note }) => (
  <Box
    p={5}
    rounded="xl"
    bg="white"
    border="1px solid"
    borderColor="gray.200"
    position="relative"
    overflow="hidden"
    transition="all 0.25s ease"
    _hover={{
      transform: "translateY(-4px)",
      shadow: "lg",
      borderColor: "green.400",
    }}
    _before={{
      content: '""',
      position: "absolute",
      left: 0,
      top: 0,
      h: "100%",
      w: "4px",
      bg: "green.400",
      opacity: 0,
      transition: "opacity 0.25s",
    }}
    _hoverBefore={{
      opacity: 1,
    }}
  >
    <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wide">
      {title}
    </Text>

    <Text fontSize="xl" fontWeight="bold" mt={1} color="gray.800">
      {value}
    </Text>

    {note && (
      <Text fontSize="xs" color="gray.500" mt={1}>
        {note}
      </Text>
    )}
  </Box>
);


export default function NeedAssistance() {
  return (
    <Box w="100%" px={6} py={4}>
      <Box
        w="100%"
        bg="white"
        borderRadius="2xl"
        boxShadow="md"
        p={{ base: 5, md: 8 }}
        border="1px solid"
        borderColor="gray.200"
        position="relative"
        overflow="hidden"
      >

        {/* HEADER */}
        <Box mb={10} position="relative">
          <Box
            position="absolute"
            top="-32px"
            right="-32px"
            w="160px"
            h="160px"
            bg="green.50"
            rounded="full"
            filter="blur(30px)"
          />

          <Heading size="md" color="green.700">
            Need Assistance
          </Heading>

          <Text color="gray.600" mt={2} maxW="720px" lineHeight="1.7">
            A clear and transparent overview of how Helpdesk support works within
            the RCO Portal.
          </Text>
        </Box>


        {/* TWO COLUMN LAYOUT */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>

          {/* LEFT COLUMN — SUPPORT JOURNEY */}
          <Box>
            <Text fontSize="md" fontWeight="semibold" mb={4} color="gray.700">
              Support Journey
            </Text>

            <VStack align="stretch" spacing={4}>
              <Step
                step="1"
                title="Ticket Acknowledgement"
                desc="Your request is logged and acknowledged automatically by the system."
              />
              <Step
                step="2"
                title="Support Team Review"
                desc="A support executive reviews the issue and validates the details."
              />
              <Step
                step="3"
                title="Resolution & Updates"
                desc="Status updates are shared as the issue progresses towards resolution."
              />
              <Step
                step="4"
                title="Closure"
                desc="The ticket is closed once the issue is resolved with a summary."
              />
            </VStack>
          </Box>

          {/* RIGHT COLUMN — INFO + TIPS */}
          <Box>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
              <InfoCard
                title="Typical Response Time"
                value="24–48 hrs"
                note="Working days only"
              />
              <InfoCard
                title="Priority Handling"
                value="Automatic"
                note="Critical issues escalated"
              />
              <InfoCard
                title="Status Visibility"
                value="Real-time"
                note="Portal, SMS & Email updates"
              />
              <InfoCard
                title="Support Availability"
                value="Mon–Fri"
                note="Business days"
              />
            </SimpleGrid>

            <Divider mb={5} />

            <Box>
              <Text
                fontSize="md"
                fontWeight="semibold"
                mb={3}
                color="gray.700"
              >
                Smart Tips for Faster Resolution
              </Text>

              <VStack align="stretch" spacing={3}>
                <Box
                  p={4}
                  bg="green.50"
                  border="1px solid"
                  borderColor="green.200"
                  rounded="xl"
                  transition="all 0.2s"
                  _hover={{
                    bg: "green.100",
                    shadow: "md",
                    transform: "translateY(-2px)",
                  }}
                >
                  <Text fontSize="sm" color="gray.700">
                    Clearly mention the exact screen, form, or step where the
                    issue occurred.
                  </Text>
                </Box>


                <Box
                  p={4}
                  bg="green.50"
                  border="1px solid"
                  borderColor="green.200"
                  rounded="xl"
                  transition="all 0.2s"
                  _hover={{
                    bg: "green.100",
                    shadow: "md",
                    transform: "translateY(-2px)",
                  }}
                >
                  <Text fontSize="sm" color="gray.700">
                    Attach screenshots or reference documents wherever applicable
                    to speed up resolution.
                  </Text>
                </Box>

              </VStack>
            </Box>
          </Box>

        </SimpleGrid>
      </Box>
    </Box>
  );

}
