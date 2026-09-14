import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Input,
  Box,
  Text,
  Divider,
  FormControl,
  FormLabel,
  Flex,
} from "@chakra-ui/react";
import { useState } from "react";
import { useSelector } from "react-redux";
import deloitte_theme from "../../../theme";
import { showToast } from "../../../components/toastService";
import { useResolveTicketMutation } from "../../../redux/apiSlices/helpdesk/helpdeskApi";

export default function ResolveTicketModal({ ticket, onClose }) {
  const [remark, setRemark] = useState("");
  const [file, setFile] = useState(null);
  
  const { user_id, username } = useSelector((state) => state.login);

  const [resolveTicket, { isLoading }] = useResolveTicketMutation();

  const handleResolve = async () => {
    if (isLoading) return; // ✅ prevent double click

    if (!remark.trim()) {
      showToast({
        title: "Remark is required",
        status: "warning",
      });
      return;
    }

    try {
      const formData = new FormData();     
      formData.append("resolution_comment", remark);
      formData.append("user_id", user_id);

      if (file) {
        formData.append("file", file);
      }

      await resolveTicket({
        ticketId: ticket.ticket_id,
        formData,
      }).unwrap();
      
      onClose();
    } catch (err) {
      console.log("Resolve Error:", err);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="xl" isCentered>
      <ModalOverlay />

      <ModalContent
        borderRadius="xl"
        border="1px solid"
        borderColor={deloitte_theme.bordercolor}
      >
        {/* HEADER */}
        <ModalHeader
          bg={deloitte_theme.primaryColor}
          color="white"
        >
          Resolve Ticket
        </ModalHeader>

        {/* BODY */}
        <ModalBody>
          <Flex direction="column" gap={5}>
            {/* Ticket Info */}
            <Box
              p={4}
              borderRadius="md"
              bg="gray.50"
              border="1px solid"
              borderColor={deloitte_theme.bordercolor}
            >
              <Text fontSize="sm">Ticket ID</Text>
              <Text fontWeight="600">
                {ticket.ticket_id}
              </Text>
            </Box>

            <Divider />

            {/* Remark */}
            <FormControl isRequired>
              <FormLabel>Resolution Remark</FormLabel>
              <Textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Enter resolution details..."
              />
            </FormControl>

            {/* File Upload */}
            <FormControl isRequired>
              <FormLabel>Attachment</FormLabel>

              <Input
                type="file"
                onChange={(e) =>
                  setFile(e.target.files[0])
                }
              />

              {file && (
                <Text fontSize="sm">
                  Selected: {file.name}
                </Text>
              )}
            </FormControl>
          </Flex>
        </ModalBody>

        {/* FOOTER */}
        <ModalFooter>
          <Flex w="100%" justify="flex-end" gap={3}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button
              bg={deloitte_theme.buttonPrimary}
              _hover={{
                bg: deloitte_theme.buttonHoverPrimary,
              }}
              color="white"
              onClick={handleResolve}
              isLoading={isLoading}
              isDisabled={
                isLoading ||
                ["Resolved", "Closed", "Completed"].includes(
                  ticket.status
                )
              }
            >
              Resolve
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}