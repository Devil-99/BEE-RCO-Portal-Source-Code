import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  IconButton,
  Flex,
  Text,
  Button,
} from "@chakra-ui/react";
import { FiDownload } from "react-icons/fi";
import * as XLSX from "xlsx";
import { GrPrevious, GrNext } from "react-icons/gr";
import { showToast } from "./toastService"

function TableComponent({ name, config, data, isFilter, isDownload, handleRowSelect, serverPagination = false, serialNumberOffset = 0, exportRows = [], }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [filters, setFilters] = useState({});
  const [tableData, setTableData] = useState([]);

  const formatHeader = (key) =>
    key
      .split("_")
      .map((word, i) =>
        i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");

  const configuration = useMemo(() => {
    if (config) return config;
    if (!data?.length) return [];
    return Object.keys(data[0]).map((key) => ({
      name: key,
      header: formatHeader(key),
      numeric: !isNaN(data[0][key]),
      render: (row) => row[key],
      sortable: true,
      width: "150px",
    }));
  }, [config, data]);

  const uniqueValues = useMemo(() => {
    const values = {};
    if (data.length > 0) {
      data.forEach((row) => {
        Object.keys(row).forEach((key) => {
          if (!values[key]) values[key] = new Set();
          values[key].add(row[key]);
        });
      });
      return Object.fromEntries(
        Object.entries(values).map(([key, set]) => [key, Array.from(set)])
      );
    } else {
      return values;
    }
  }, [data]);

  useEffect(() => {
    let updated = [...data];

    // Sorting
    if (sortColumn && sortOrder) {
      updated.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }
        return sortOrder === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    // Filtering
    updated = updated.filter((row) =>
      Object.entries(filters).every(([key, value]) =>
        value ? row[key] === value : true
      )
    );


    setTableData(updated);
    setCurrentPage(1); // Reset to first page when filters/sort change
  }, [data, sortColumn, sortOrder, filters]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder((prev) =>
        prev === "asc" ? "desc" : prev === "desc" ? "" : "asc"
      );
      if (sortOrder === "desc") setSortColumn("");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const handleFilterChange = (column, value) =>
    setFilters((prev) => ({ ...prev, [column]: value || "" }));

  const handlePrevPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleRowsChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const getCurrentDateTime = () => {
    const d = new Date();

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;
  };

  const exportToExcel = () => {
    try {
      const exportSource = Array.isArray(exportRows) && exportRows.length > 0 ? exportRows : tableData;
      const exportData = exportSource.map((row, index) => {
        const obj = {
          "Sr. No.": index + 1,
        };

        configuration.forEach((col) => {
          const header = col.header || col.name;

          let val;

          if (col.exportValue) {
            val = col.exportValue(row);
          } else if (typeof col.render === "function") {
            const rendered = col.render(row);

            val = typeof rendered === "string" || typeof rendered === "number"
              ? rendered
              : row[col.name];
          } else {
            val = row[col.name];
          }

          obj[header] = val;
        });

        return obj;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();

      const safeSheetName = (name || "Sheet1")
        .replace(/[:\\/?*[\]]/g, "_")
        .slice(0, 31);

      XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

      const fileBaseName = name
        ? name.replace(/[:\\/?*[\]"<>|]/g, "_").replace(/\s+/g, "_")
        : "Sheet1";

      const fileName = `${fileBaseName}_${getCurrentDateTime()}.xlsx`;

      XLSX.writeFile(workbook, fileName);

    } catch (err) {
      console.error("Export to Excel failed:", err);
      showToast({
        title: "Export to Excel failed",
        description: err?.message || String(err),
        status: "error",
      });
    }
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = serverPagination ? tableData : tableData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(tableData.length / rowsPerPage);

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      rounded="md"
      p={5}
      w="100%"
      mx="auto"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="xl" fontWeight="semibold">
          {name}
        </Text>
        {isDownload && (
          <Button leftIcon={<FiDownload />} size="sm" onClick={exportToExcel}>
            Download
          </Button>
        )}
      </Flex>
      {
        data.length == 0 &&
        <Text>
          No data available
        </Text>
      }
      <Box overflowX="auto" overflowY="auto" maxH="65vh">
        <Table variant="striped" sx={{ tableLayout: "fixed", minWidth: "700px" }}>
          <Thead position="sticky" top={0} bg="green.800" zIndex={1}>
            {/* -------------------- Header Section --------------------------*/}
            <Tr>
              <Th
                color="white"
                textAlign="center"
                w="75px"
                px='20px'
                py='15px'
                fontSize="sm"
                border="1px solid"
              >
                Sl.
              </Th>
              {configuration.map((col, idx) => (
                <Th
                  key={idx}
                  color="white"
                  textAlign="center"
                  cursor={col.sortable ? "pointer" : "default"}
                  onClick={() => col.sortable && handleSort(col.name)}
                  w={col.width || '150px'}
                  px='20px'
                  py='15px'
                  fontSize="sm"
                  border={"1px solid"}
                >
                  {col.header}
                  {col.sortable && sortColumn === col.name && (
                    <Text as="span" ml={1}>
                      {sortOrder === "asc" ? "▲" : "▼"}
                    </Text>
                  )}
                </Th>
              ))}
            </Tr>
{/* ------------------------------- Filter Section -------------------------------------- */}
            {isFilter && (
              <Tr bg="green.100">
                <Th p={1}></Th>
                {configuration.map((col, idx) => (
                  <Th key={idx} p={1}>
                    {!col.numeric && (
                      <Select
                        placeholder={`Filter ${col.header}`}
                        size="sm"
                        value={filters[col.name] || ""}
                        onChange={(e) =>
                          handleFilterChange(col.name, e.target.value)
                        }
                      >
                        {uniqueValues[col.name]?.map((val, i) => (
                          <option key={i} value={val}>
                            {val}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Th>
                ))}
              </Tr>
            )}
          </Thead>

{/* ------------------------------------- Table Body ------------------------------------------ */}
          <Tbody>
            {currentRows.map((row, rowIdx) => (
              <Tr key={rowIdx} bg="white" _hover={{ bg: "blue.50" }} cursor="pointer">
                <Td
                  textAlign="center"
                  fontSize="sm"
                  fontWeight="medium"
                >
                  {serverPagination ? serialNumberOffset + rowIdx + 1 : indexOfFirstRow + rowIdx + 1}
                </Td>
                {configuration.map((col, colIdx) => (
                  <Td
                    key={colIdx}
                    textAlign={col.numeric ? "center" : "left"}
                    fontSize="sm"
                    minW={col.width || '150px'}
                    onClick={() => handleRowSelect(row)}
                    padding={2}
                  >
                    {col.render(row)}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

{/* -------------------------- Pagination Section ---------------------------- */}
      <Flex justify="space-between" align="center" mt={3} flexWrap="wrap">
        {!serverPagination && tableData.length > 10 && (
          <Flex align="center" gap={2} fontSize="sm">
            <Text>Rows per page:</Text>
            <Select
              w="70px"
              size="sm"
              value={rowsPerPage}
              onChange={handleRowsChange}
            >
              {[10, 25, 50, 100].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </Flex>
        )}

        {!serverPagination && totalPages > 1 && (
          <Flex align="center" gap={2}>
            <IconButton
              icon={<GrPrevious />}
              size="sm"
              onClick={handlePrevPage}
              isDisabled={currentPage === 1}
            />
            <Text fontSize="sm">
              Page {currentPage} of {totalPages}
            </Text>
            <IconButton
              icon={<GrNext />}
              size="sm"
              onClick={handleNextPage}
              isDisabled={currentPage === totalPages}
            />
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

export default TableComponent;
