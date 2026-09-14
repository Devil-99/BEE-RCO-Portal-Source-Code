import { Button, Container, Heading, Text, VStack, Image } from "@chakra-ui/react";
import beeImage from '../assets/images/about_bee.jpg'

const AboutBEE = () => {
  return (
    <Container maxW="5xl" py={10}>
      <VStack spacing={6} align="start">
        
        <Heading as="h1" size="xl" color="green.700">
          About Bureau of Energy Efficiency (BEE)
        </Heading>


        <div
          style={{
            width: "100%",
            height: "250px",
            backgroundColor: "#f0f0f0",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#888",
            fontSize: "1.2rem",
          }}
        >
        <Image
            src={beeImage}
            alt="BEE Logo"
            borderRadius="12px"
            objectFit="cover"
            width="100%"
            height="250px"
        />

        </div>
        <Text fontSize="md" textAlign="justify" lineHeight="1.7">
          The Government of India established the Bureau of Energy Efficiency (BEE) on 
          1st March 2002 under the provisions of the Energy Conservation Act, 2001.  
          The mission of BEE is to assist in developing policies and strategies with a 
          thrust on self-regulation and market principles, with the primary objective of 
          reducing the energy intensity of the Indian economy.
        </Text>

        <Text fontSize="md" textAlign="justify" lineHeight="1.7">
          This objective is to be achieved with the active participation of all stakeholders, 
          resulting in the accelerated and sustained adoption of energy efficiency in all 
          sectors of the economy. BEE works in close coordination with designated consumers, 
          state agencies, and other organizations to promote energy conservation measures 
          and build a sustainable energy future.
        </Text>

        <Button
          as="a"
          href="https://beeindia.gov.in/about.php"
          target="_blank"
          rel="noopener noreferrer"
          colorScheme="green"
          size="md"
          borderRadius="full"
        >
          Read More
        </Button>
      </VStack>
    </Container>
  );
};

export default AboutBEE;
