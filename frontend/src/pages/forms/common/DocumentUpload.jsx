import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import FileUpload from "./FileUpload";
import deloitte_theme from "../../../theme";

const DocumentUpload = ({
  uploadMode,
  disabled,
  allFiles,
  uploadSections,
  setAllFiles,
  setSectionFiles,
  uploadedPaths,
}) => {

  return (
    <Flex direction="column" gap={deloitte_theme.gap} p={{ base: deloitte_theme.paddingY, md: deloitte_theme.paddingX }} borderRadius="xl">
      <Heading fontSize="lg" color="gray.700" borderBottomWidth="1px">
        Attachments
      </Heading>

      {uploadMode === "multipleUploadSections" ? (
        uploadSections.map((s, idx) => (
          <Box key={s.id}>
            <FileUpload
              files={s.files}
              setFiles={(files) => setSectionFiles(idx, files)}
              disabled={disabled}
            />
          </Box>
        ))
      ) : (
        <FileUpload
          files={allFiles}
          setFiles={setAllFiles}
          disabled={disabled}
        />
      )}

      {uploadedPaths.length > 0 && (
        <Box mt={3}>
          <Flex gap={3} wrap="wrap">
            {uploadedPaths.map((p, i) => (
              <Box
                key={i}
                w="200px"
                h="150px"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                overflow="hidden"
                bg="gray.50"
                p={2}
              >
                <a href={p} target="_blank" rel="noopener noreferrer">
                  <Text fontSize="sm" isTruncated>
                    {p.split("/").pop()}
                  </Text>
                </a>
              </Box>
            ))}
          </Flex>
        </Box>
      )}
    </Flex>
  );
}

export default DocumentUpload;
