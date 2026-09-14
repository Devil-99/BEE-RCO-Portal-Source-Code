import React, { useEffect, useState } from "react";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Flex,
  Text,
  IconButton,
  Tag,
  Grid,
} from "@chakra-ui/react";
import { SmallCloseIcon } from "@chakra-ui/icons";
import { showToast } from "../../../components/toastService";
import deloitte_theme from "../../../theme";

export default function FileUpload({ files = [], setFiles, label = "Upload Required Documents" }) {
  const [previews, setPreviews] = useState([]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

  useEffect(() => {
    // revoke any previous object URLs
    setPreviews((prev) => {
      prev.forEach((p) => p?.url && URL.revokeObjectURL(p.url));
      return [];
    });

    if (!files || files.length === 0) return;

    const next = files.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      type: f.type,
      size: f.size
    }));
    setPreviews(next);

    return () => {
      next.forEach((p) => p?.url && URL.revokeObjectURL(p.url));
    };
  }, [files]);

  const handleRemoveFile = (idx) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const handleChange = (e) => {
    const uploaded = Array.from(e.target.files || []);
    let validFiles = [...files];

    uploaded.forEach((file) => {
      // Check type
      if (!ALLOWED_TYPES.includes(file.type)) {
        showToast({
          title: "Invalid file type",
          description: "Only PDF, JPG, JPEG, and PNG files are allowed.",
          status: "error",
        });
        return;
      }

      // Check size
      if (file.size > MAX_FILE_SIZE) {
        showToast({
          title: "File too large",
          description: `File size should not exceed 2MB.`,
          status: "error",
        });
        return;
      }

      // Avoid duplicates by name
      const exists = validFiles.some((existing) => existing.name === file.name);
      if (!exists) validFiles.push(file);
    });

    setFiles(validFiles);
  }

  return (
    <FormControl>
      <FormLabel fontSize="sm" fontWeight="semibold" mb={2}>
        {label} : 
        <Text
          as="span"
          fontSize="xs"
          fontWeight="normal"
          color="orange.500"
        >
          {" "}
          Supported formats: PDF, JPG, PNG, etc. • Max 5 files allowed • Max file size 5MB/file allowed
        </Text>
      </FormLabel>

      <Input
        type="file"
        multiple
        onChange={handleChange}
        sx={{
          "::file-selector-button": {
            border: "none",
            outline: "none",
            mr: 4,
            p: 2,
            borderRadius: "md",
            bg: "gray.100",
            cursor: "pointer",
            "&:hover": { bg: "gray.200" },
          },
        }}
      />

      {previews && previews.length > 0 && (
        <Flex gap={deloitte_theme.gap} p={deloitte_theme.paddingY}>
          {previews.map((p, i) => (
            <Flex
              direction="column"
              key={i}
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              w="fit-content"
              h="150px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="relative"
            >
              <IconButton
                aria-label="Remove file"
                icon={<SmallCloseIcon />}
                size="xs"
                position="absolute"
                top={1}
                right={1}
                onClick={() => handleRemoveFile(i)}
                zIndex={5}
              />

              {p.type && p.type.startsWith("image/") ? (
                // image preview
                <img src={p.url} alt={p.name} style={{ width: "100%", height: "110px", objectFit: "cover" }} />
              ) : p.type === "application/pdf" ? (
                // pdf preview
                <embed src={p.url} type="application/pdf" width="100px" height="110px" />
              ) : (
                <Text fontSize="sm" p={2} textAlign="center">
                  File
                </Text>
              )}

              <Flex key={i} gap={3} align="center" p={deloitte_theme.paddingY}>
                <Text fontSize="sm">{p.name}</Text>
                <Tag size="sm" variant="subtle" colorScheme="gray">
                  {Math.round((p.size || 0) / 1024)} KB
                </Tag>
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}
    </FormControl>
  );
}
