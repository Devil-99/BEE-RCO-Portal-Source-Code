import { useState, useMemo } from "react";
import {
  Heading,
  Text,
  Box,
  Button,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import TableComponent from "../../components/TableComponent";
import ResolveTicketModal from "./Tickets/ResolveTicketModal";
import { useSelector } from "react-redux";
import deloitte_theme from "../../theme";

import {
  useGetMyTicketsQuery,
} from "../../redux/apiSlices/helpdesk/helpdeskApi";
import SkeletonComponent from "../../components/SkeletonComponent";

export default function MyTickets() {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { role_code } = useSelector((s) => s.login);

  // ✅ RTK Query
  const {
    data: rows = [],
    isLoading
  } = useGetMyTicketsQuery();

  const config = useMemo(() => {
    return [
      {
        name: "user_id",
        header: "User",
        width: "200px",
        render: (row) => row.user_id,
      },
      {
        name: "title",
        header: "Title",
        width: "300px",
        render: (row) => row.title,
      },
      {
        name: "category",
        header: "Category",
        width: "200px",
        render: (row) => row.category,
      },
      {
        name: "subcategory",
        header: "Sub Category",
        width: "200px",
        render: (row) => row.subcategory,
      },
      {
        name: "description",
        header: "Description",
        width: "400px",
        render: (row) => row.description,
      },
      {
        name: "priority",
        header: "Priority",
        render: (row) => row.priority,
      },
      {
        name: "status",
        header: "Status",
        render: (row) => row.status,
      },
      {
        name: "created_at",
        header: "Created At",
        width: "180px",
        numeric: true,
        render: (row) =>
          row.created_at
            ? new Date(row.created_at).toLocaleString()
            : "-",
      },
      {
        name: "updated_at",
        header: "Resolved At",
        numeric: true,
        width: "180px",
        render: (row) => {
          if (row.status === "Open") return "";

          return row.updated_at
            ? new Date(row.updated_at).toLocaleString()
            : "";
        },
      },
      {
        name: "action",
        header: "Action",
        numeric: true,
        width: "120px",
        render: (row) => {
          if (["Closed", "Resolved", "Completed"].includes(row.status)) {
            return null;
          }

          if (role_code !== "ADM") {
            return null;
          }

          return (
            <Button
              size="sm"
              bg={deloitte_theme.buttonPrimary}
              color={deloitte_theme.white}
              _hover={{ bg: deloitte_theme.buttonHoverPrimary }}
              fontWeight="600"
              px={4}
              py={2}
              onClick={() => setSelectedTicket(row)}
            >
              Resolve
            </Button>
          );
        },
      },
    ];
  }, [role_code]);


  return (
    <Box>
      {
        isLoading ?
          <SkeletonComponent type="table" />
          :
          <TableComponent
            name="My Tickets"
            data={rows}
            config={config}
            isFilter
          />
      }

      {selectedTicket && (
        <ResolveTicketModal
          ticket={selectedTicket}
          onClose={() => {
            setSelectedTicket(null);
          }}
        />
      )}
    </Box>
  );
}