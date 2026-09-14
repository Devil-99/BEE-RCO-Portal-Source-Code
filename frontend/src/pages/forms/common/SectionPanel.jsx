// // src/components/SectionPanel.jsx
// import React from "react";
// import {
//   Box,
//   Grid,
//   GridItem,
//   Input,
//   InputGroup,
//   InputRightAddon,
//   Text,
//   FormControl,
//   FormLabel,
//   Flex,
//   Heading,
// } from "@chakra-ui/react";

// export default function SectionPanel({
//   groupedFields = {},
//   formData = {},
//   evaluatedData = {},
//   handleInputChange,
//   theme = {},
// }) {
//   return (
//     <>
//       {Object.entries(groupedFields).map(([groupName, fieldsInGroup]) => (
//         <Box key={groupName} bg="white" p={{ base: 4, md: 5 }} borderRadius="xl" mb={4}>
//           <Heading fontSize="lg" mb={5} borderBottomWidth="1px" pb={2}>
//             {groupName}
//           </Heading>

//           <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={5}>
//             {fieldsInGroup.map((field) => (
//               <GridItem
//                 key={field.acronym}
//                 colSpan={field.type === "LOGIC" ? { base: 2, lg: 4 } : 1}
//                 colStart={{ lg: field.column_id || "auto" }}
//               >
//                 {field.type === "LOGIC" ? (
//                   <Flex
//                     justify="space-between"
//                     align="center"
//                     bg={theme?.formbackground || "gray.50"}
//                     p={3}
//                     borderRadius="md"
//                     borderLeft="4px solid"
//                     borderColor={theme?.logicFormLeftBorder || "green.500"}
//                   >
//                     <Text fontSize="sm" fontWeight="bold" color="gray.800">
//                       {field.field_name}
//                     </Text>
//                     <InputGroup size="sm" maxW="200px">
//                       <Input bg="transparent" isReadOnly border={0} value={evaluatedData[field.acronym] ?? "0.000"} textAlign="right" fontWeight="bold" />
//                       <InputRightAddon border={0} bg="transparent">
//                         {field.unit}
//                       </InputRightAddon>
//                     </InputGroup>
//                   </Flex>
//                 ) : (
//                   <FormControl>
//                     <FormLabel fontSize="sm" fontWeight="semibold" color={theme?.textSecondary || "gray.600"}>
//                       {field.field_name}
//                     </FormLabel>
//                     <InputGroup size="sm">
//                       <Input
//                         type="number"
//                         value={formData[field.acronym] ?? ""}
//                         onChange={(e) => handleInputChange(field.acronym, e.target.value)}
//                         isReadOnly={field.type !== "INPUT"}
//                         bgColor={field.type !== "INPUT" ? "gray.100" : "white"}
//                         placeholder="0.000"
//                         borderRadius="0.5rem"
//                       />
//                       <InputRightAddon>{field.unit}</InputRightAddon>
//                     </InputGroup>
//                   </FormControl>
//                 )}
//               </GridItem>
//             ))}
//           </Grid>
//         </Box>
//       ))}
//     </>
//   );
// }
// src/components/SectionPanel.jsx
// src/components/SectionPanel.jsx
import React from "react";
import {
  Box,
  Grid,
  GridItem,
  Input,
  InputGroup,
  InputRightAddon,
  Text,
  FormControl,
  FormLabel,
  Flex,
  Heading,
  Tooltip,
} from "@chakra-ui/react";
import deloitte_theme from "../../../theme";

export default function SectionPanel({
  groupedFields = {},
  formData = {},
  evaluatedData = {},
  handleInputChange,
  mode = "add",
}) {
  return (
    <>
      {Object.entries(groupedFields).map(([groupName, fieldsInGroup]) => (
        <Box key={groupName}>
          {/* <Heading fontSize="lg" mb={5} borderBottomWidth="1px" pb={2}>
            {groupName}
          </Heading> */}

          <Grid
            templateColumns={{
              base: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            }}
            px={deloitte_theme.paddingY}
            gap={deloitte_theme.gap}
          >
            {fieldsInGroup.map((field) => (
              <GridItem
                key={field.acronym}
                colSpan={field.type === "LOGIC" ? { base: 2, lg: 4 } : 1}
                colStart={{ lg: field.column_id || "auto" }}
              >
                {/*  Added a FIXED HEIGHT WRAPPER for uniform height of all fields */}
                <Flex
                  direction="column"
                  justify="space-between"
                >
                  {field.type === "LOGIC" ? (
                    // LOGIC FIELD
                    <Flex
                      justify="space-between"
                      align="center"
                      bg={deloitte_theme.primary}
                      px={deloitte_theme.paddingX}
                      py={deloitte_theme.paddingY}
                      borderRadius="md"
                      borderLeft="4px solid"
                      borderColor={deloitte_theme.logicFormLeftBorder || "green.500"}
                    >
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color="gray.800"
                        noOfLines={2}
                      >
                        {field.field_name}
                      </Text>

                      <InputGroup maxW="200px">
                        <Input
                          bg="transparent"
                          isReadOnly
                          border={0}
                          value={evaluatedData[field.acronym] ?? "0.000"}
                          textAlign="right"
                          fontWeight="bold"
                        />
                        <InputRightAddon border={0} bg="transparent">
                          {field.unit}
                        </InputRightAddon>
                      </InputGroup>
                    </Flex>
                  ) : (
                    // NORMAL FIELD
                    <Flex
                      direction="column"
                      justifyContent="space-between"
                      h="110px"
                      bg="white"
                      borderRadius="md"
                      p={deloitte_theme.paddingY}
                    >
                      <Tooltip label={field.field_name} placement="top" hasArrow>
                        <FormLabel
                          fontSize="sm"
                          fontWeight="semibold"
                          color={deloitte_theme?.textPrimary}
                          noOfLines={2}
                        >
                          {field.field_name}
                        </FormLabel>
                      </Tooltip>

                      <InputGroup>
                        <Input
                          type="number"
                          value={formData[field.acronym] ?? ""}
                          onChange={(e) =>
                            handleInputChange(field.acronym, e.target.value)
                          }
                          isReadOnly={mode === "view"}
                          bgColor={mode === "view" ? "gray.100" : "white"}
                          placeholder="0.000"
                          borderRadius="0.5rem"
                          disabled={field.acronym === 'U2' || field.acronym === 'B2'}
                        />
                        <InputRightAddon>{field.unit}</InputRightAddon>
                      </InputGroup>
                    </Flex>
                  )}
                </Flex>
              </GridItem>
            ))}
          </Grid>
        </Box>
      ))}
    </>
  );
}
