import { Box, Input, Text } from "@chakra-ui/react";

export default function FileUploader({ label, accept }) {
  return (
    <Box mb={4}>
      <Text fontSize="sm" mb={1}>{label}</Text>
      <Input type="file" accept={accept} multiple />
    </Box>
  );
}
