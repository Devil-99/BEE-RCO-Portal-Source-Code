import { Button, Container, Heading, Text, VStack, Image, Flex, Box } from "@chakra-ui/react";
import rcoImage from "../assets/images/about_rco_hd.jpg";

const AboutRCO = () => {
  return (
    <Container maxW="6xl" py={10}>
      <VStack spacing={8} align="start" width="100%">
        
        <Heading as="h1" size="xl" color="blue.700">
          About Renewable Consumption Obligation (RCO)
        </Heading>

        <Flex
          direction={{ base: "column", md: "row" }}
          gap={8}
          align="stretch"
          width="100%"
        >

          <Box flex="1" h="100%">
            <Image
              src={rcoImage}
              alt="RCO Illustration"
              borderRadius="12px"
              objectFit="cover"
              w="100%"
              h="100%"
            />
          </Box>

          <Box flex="2">
            <VStack spacing={4} align="start" h="100%">
              <Text fontSize="md" textAlign="justify" lineHeight="1.7">
                The Renewable Consumption Obligation (RCO) mechanism is a policy
                framework introduced to ensure that designated consumers—
                including distribution licensees, open access consumers, and
                captive power plants—consume a minimum percentage of electricity
                from renewable sources.
              </Text>

              <Text fontSize="md" textAlign="justify" lineHeight="1.7">
                India’s renewable energy program is one of the largest globally,
                driven by strong regulatory support and climate commitments
                under the Paris Agreement and COP26. The RCO framework, which
                evolved from the earlier Renewable Purchase Obligation (RPO),
                was formally brought under the Energy Conservation Act, 2001
                through amendments in December 2022.
              </Text>

              <Text fontSize="md" textAlign="justify" lineHeight="1.7">
                The Ministry of Power, with support from the Bureau of Energy
                Efficiency (BEE), has notified a trajectory for RCO targets until
                2030. These include specific sub-targets for wind, hydro, and
                distributed renewable energy sources, aimed at accelerating
                India’s clean energy transition. BEE is also tasked with
                monitoring compliance and developing detailed operating
                procedures to ensure effective implementation across
                stakeholders.
              </Text>

              <Button
                as="a"
                href="/Revised_RCO_Gazzette_Notification_dated_27th_September_2025.pdf"
                target="_blank"
                rel="noopener noreferrer"
                colorScheme="blue"
                size="md"
                borderRadius="full"
              >
                Read More
              </Button>
            </VStack>
          </Box>
        </Flex>
      </VStack>
    </Container>
  );
};

export default AboutRCO;
