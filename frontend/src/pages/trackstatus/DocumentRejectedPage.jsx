import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useUploadRejectedDocsMutation } from "../../redux/apiSlices/entityApi";
import { showToast } from "../../components/toastService";
import {
  Box,
  Flex,
  Heading,
  Text,
  Image,
  Stack,
  HStack,
  Button,
  Input,
  FormControl,
  FormLabel,
  IconButton,
  Divider,
} from "@chakra-ui/react";
import { CloseIcon, WarningIcon } from "@chakra-ui/icons";
import documentRejectedImg from "../../assets/status/document_rejected.png";
import deloitte_theme from "../../theme";
import { useGetReviewCommentQuery } from "../../redux/apiSlices/trackStatusApi";

function DocumentRejectedPage() {
  const { entity_id, created_at, updated_at } = useSelector((state) => state.login);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadRejectedDocs, { isLoading }] = useUploadRejectedDocsMutation();
  const { data: reviewComment = "" } = useGetReviewCommentQuery({ entity_id }, { skip: !entity_id })

  // Allowed MIME types same as backend validation
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const invalidFile = files.find((file) => !allowedTypes.includes(file.type));

    if (invalidFile) {
      showToast({
        title: "Invalid File",
        description: `${invalidFile.name} is not allowed. Only PDF, JPG, JPEG, PNG files are accepted.`,
        status: "error",
      });
      return;
    }

    setSelectedFiles(files);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitDocs = async () => {
    if (selectedFiles.length === 0) {
      showToast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        status: "warning",
      });
      return;
    }

    try {
      await uploadRejectedDocs({ entity_id, files: selectedFiles }).unwrap();

      showToast({
        title: "Success",
        description: "Documents re-uploaded successfully.",
        status: "success",
      });

      setSelectedFiles([]);
    } catch (err) {
      console.error(err);

      const backendMessage = err?.data?.detail || "Failed to upload documents.";

      showToast({
        title: "Upload Failed",
        description: backendMessage,
        status: "error",
      });
    }
  };

  return (
    <Flex w="full" justifyContent="space-evenly" alignItems="top" gap={deloitte_theme.gap}>
      <img
        src={documentRejectedImg}
        alt="Documents Rejected"
        style={{
          width: '100%',
          maxWidth: '534px',
          height: 'auto',
          objectFit: 'contain'
        }}
      />
      <Flex w="60%" direction="column" gap={deloitte_theme.gap} py={deloitte_theme.paddingY}>
        <Heading as="h2" size="lg" color="orange.700">
          <span><WarningIcon boxSize={5} color="orange.500" /></span> Documents Rejected
        </Heading>

        <Text color="gray.600" fontSize="md" lineHeight="tall">
          Your submitted documents were rejected. Please upload the required additional
          documents so the verification process can continue. Once verified, the next
          steps will be enabled automatically.
        </Text>

        <Flex direction="column" gap={deloitte_theme.gap}>
          <Stack spacing={4}>
            <Flex justify="space-between" align="center">
              <Text color="gray.500" fontWeight="medium">
                Review Comment:
              </Text>
              <Text fontWeight="semibold">
                {reviewComment}
              </Text>
            </Flex>
            <Divider />
            <Flex justify="space-between" align="center">
              <Text color="gray.500" fontWeight="medium">
                Application Submitted:
              </Text>
              <Text fontWeight="semibold">
                {created_at ? new Date(created_at).toLocaleDateString("en-GB") : "N/A"}
              </Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text color="gray.500" fontWeight="medium">
                Last Updated:
              </Text>
              <Text fontWeight="semibold">
                {updated_at ? new Date(updated_at).toLocaleDateString("en-GB") : "N/A"}
              </Text>
            </Flex>
          </Stack>

          <Flex direction="column" gap={deloitte_theme.gap}>
            <FormControl>
              <FormLabel fontSize="md" fontWeight="semibold">
                Upload Additional Documents
              </FormLabel>
              <Input
                type="file"
                multiple
                accept=".pdf,image/jpeg,image/png,image/jpg"
                onChange={handleFileChange}
                bg="white"
                borderColor="gray.300"
                borderRadius="2xl"
              />
            </FormControl>

            {selectedFiles.length > 0 && (
              <Box>
                <Text mb={3} fontWeight="semibold">
                  Selected Documents
                </Text>
                <Stack maxH={40} spacing={3} overflow="auto">
                  {selectedFiles.map((file, index) => (
                    <Flex
                      key={index}
                      align="center"
                      justify="space-between"
                      p={deloitte_theme.paddingY}
                      bg="white"
                      borderWidth="1px"
                      borderColor="gray.200"
                      rounded="2xl"
                    >
                      <Text noOfLines={1} mr={4} flex="1" fontWeight="medium">
                        {file.name}
                      </Text>
                      <IconButton
                        aria-label="Remove file"
                        icon={<CloseIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => removeFile(index)}
                      />
                    </Flex>
                  ))}
                </Stack>
              </Box>
            )}

            <Button
              w="full"
              colorScheme="red"
              size="lg"
              onClick={handleSubmitDocs}
              isLoading={isLoading}
            >
              {isLoading ? "Uploading..." : "Submit Documents"}
            </Button>
          </Flex>

        </Flex>
      </Flex>
    </Flex>
  );
}

export default DocumentRejectedPage;
