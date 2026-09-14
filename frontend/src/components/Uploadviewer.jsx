import React, { useEffect, useState } from "react";
import {
  Box,
  Text,
  HStack,
  Tooltip,
  IconButton,
  Img,
  Spinner,
} from "@chakra-ui/react";
import { AiFillFilePdf, AiFillFileImage } from "react-icons/ai";
import { FiFileText } from "react-icons/fi";
import instance, { host } from "../api_instance";
import axios from "axios";
import { useOpenFileMutation } from "../redux/apiSlices/adminControlApi";
import { showToast } from "./toastService";

const UploadsViewer = ({ entityId, fyId, periodId }) => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detect file type
  const getFileType = (file) => {
    if (!file) return null;
    const ext = file.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    return "other";
  };

  const getFileName = (file) => {
    if(!file) return null;
    const name = file.split("/").pop();
    return name;
  }

  // Build absolute URL for backend files
  // const getDocUrl = (file) => {
  //   if (!file) return "";
  //   const baseHost = host.replace(/\/v1\/?$/, "");
  //   return `${baseHost}${file}`;
  // };

  const [openFile] = useOpenFileMutation();
  const handleOpenFile = (filepath) => {
    if (!filepath) {
      showToast({
        title: "No file available",
        status: "warning",
      });
      return;
    }
    openFile(filepath);
  }

  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const res = await instance.get(`/form/uploads/entity-${entityId}-fy-${fyId}-period-${periodId}`);
        // Handle both list or object responses
        const files = Array.isArray(res.data)
          ? res.data
          : res.data?.uploads || [];

        setUploads(files);
      } catch (err) {
        console.error("Error fetching uploads:", err);
      } finally {
        setLoading(false);
      }
    };

    if (entityId && fyId && periodId) fetchUploads();
  }, [entityId, fyId, periodId]);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <Spinner size="lg" />
      </Box>
    );

  return (
    <Box mb={4}>
      <Text fontWeight="semibold" mb={2}>
        Documents
      </Text>

      <HStack spacing={4} wrap="wrap">
        {uploads.length === 0 ? (
          <Text fontSize="sm" color="gray.400">
            No documents uploaded
          </Text>
        ) : (
          uploads.map((doc, idx) => {
            const fileType = getFileType(doc);
            const fileName = getFileName(doc);
            return (
              <Tooltip label={fileName} key={idx}>
                <IconButton
                  icon={fileType === "pdf" ? <AiFillFilePdf size="36px" color="#D53F8C" /> : fileType === 'image' ? <AiFillFileImage size="36px" color="#0000FF" /> : <FiFileText size="36px" color="#D53F8C" />}
                  boxSize="60px"
                  onClick={() => handleOpenFile(doc)}
                />
              </Tooltip>
            );
          })
        )}
      </HStack>
    </Box>
  );
};

export default UploadsViewer;
