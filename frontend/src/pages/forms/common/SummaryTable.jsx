
import React, { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableContainer,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Text,
  Flex,
  useToast,
} from "@chakra-ui/react";
import deloitte_theme from "../../../theme";
/**
 * Generalized SummaryTable
 *
 * Props:
 *  - summaryConfig: object containing { summaryTableData, columnHeaders? }
 *  - formData: current form data (prefilled from backend)
 *  - evaluatedData: calculated data (logic fields)
 *  - handleInputChange: callback to update formData (for CPP inputs)
 *  - theme: optional theme object for colors
 *  - targetFy: selected Financial Year (for fetching target data)
 *  - state: state code/name for API call
 */
export default function SummaryTable({
  summaryConfig = {},
  formData = {},
  evaluatedData = {},
  handleInputChange,
  theme = {},
}) {
  const toast = useToast();

  if (!summaryConfig || !summaryConfig.summaryTableData?.length)
    return <Box>No summary data</Box>;

  const { summaryTableData, columnHeaders } = summaryConfig;  
  const isMultiColumn =
    Array.isArray(columnHeaders) && columnHeaders.length > 0;

  return (
    <TableContainer
      p={deloitte_theme.paddingX}
    >
      <Table variant="simple" size="sm" sx={{ tableLayout: "fixed" }}>
        <Thead>
          <Tr bg={theme.headerBg || "gray.100"}>
            <Th w="35%" fontSize="md" py={deloitte_theme.paddingY}>Parameter</Th>
            <Th w="10%" fontSize="md" py={deloitte_theme.paddingY}>Unit</Th>
            {isMultiColumn &&
              columnHeaders.map((header) => (
                <Th key={header} isNumeric fontSize="md" py={deloitte_theme.paddingY}>
                  {header}
                </Th>
              ))}
          </Tr>
        </Thead>

        <Tbody>
          {summaryTableData.map((row, rowIndex) => {
            const keys = isMultiColumn ? row.keys : [row.dataKey];

            return (
              <Tr key={rowIndex} bg={row.specialStyling?.bg || "white"}>
                <Td
                  border="1px solid"
                  borderColor="gray.200"
                  fontWeight="medium"
                >
                  {row.label}
                </Td>
                <Td border="1px solid" borderColor="gray.200">
                  {row.unit}
                </Td>

                {keys.map((key, idx) => {
                  // Prefill from formData, evaluatedData, or target API response
                  const value =
                    evaluatedData[key] ??
                    "";

                  const isInput = !isMultiColumn && row.type === "INPUT";

                  return (
                    <Td
                      key={`${row.label}-${idx}`}
                      border="1px solid"
                      borderColor="gray.200"
                      isNumeric
                      bg={theme.primary || "gray.50"}
                    >
                      {isInput ? (
                        <Flex align="center" justify="flex-end">
                          <Input
                            type="number"
                            size="sm"
                            textAlign="right"
                            value={value}
                            onChange={(e) =>
                              handleInputChange(key, e.target.value)
                            }
                            placeholder="0.00"
                            width="100%"
                          />
                        </Flex>
                      ) : (
                        <Text fontWeight="bold" textAlign="right">
                          {value !== ""
                            ? `${Number(value).toFixed(
                              row.unit === "%" ? 2 : 3
                            )}${row.unit === "%" ? "%" : ""}`
                            : ""}
                        </Text>
                      )}
                    </Td>
                  );
                })}
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
