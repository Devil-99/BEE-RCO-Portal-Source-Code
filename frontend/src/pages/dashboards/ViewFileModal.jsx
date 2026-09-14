import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalHeader,
  ModalBody,
  Box,
  Text,
  HStack,
  Tooltip,
  IconButton,
  Img,
  Spinner
} from '@chakra-ui/react';
import { AiFillFilePdf, AiFillFileImage } from "react-icons/ai";
import { FiFileText } from "react-icons/fi";
import { useSelector } from 'react-redux';
import { useOpenFileMutation } from "../../redux/apiSlices/adminControlApi";
import { useGetFormUploadsQuery } from "../../redux/apiSlices/formApi";
import { showToast } from "../../components/toastService";

const getFileType = (file) => {
  if (!file) return null;
  const ext = file.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  return "other";
};

const getFileName = (file) => {
  if (!file) return null;
  const name = file.split("/").pop();
  return name;
}

function ViewFileModal({ isOpen, onClose, form }) {
  const { entity_id, fy_id, period_id } = useSelector((state) => state.formState);

  const { data: uploads = [], isLoading } = useGetFormUploadsQuery(
    { entity_id, fy_id, period_id },
    { skip: !entity_id || !fy_id || !period_id }
  );
  
  const [openFile, { isLoading: openingFile }] = useOpenFileMutation();
  const [activeFile, setActiveFile] = useState(null);

  const handleOpenFile = async (filepath) => {
    if (!filepath) {
      showToast({
        title: "No file available",
        status: "warning",
      });
      return;
    }
    setActiveFile(filepath);
    try {
      await openFile(filepath).unwrap();
    } catch (error) {
      // error toast is already handled in the mutation onQueryStarted callback
      console.error(error);
    } finally {
      setActiveFile(null);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>View Submitted Files</ModalHeader>
        <ModalCloseButton />
        <ModalBody mb={4}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
              <Spinner size="lg" />
            </Box>
          ) : (
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
                        key={idx}
                        icon={fileType === "pdf" ? <AiFillFilePdf size="36px" color="#D53F8C" /> : fileType === 'image' ? <AiFillFileImage size="36px" color="#0000FF" /> : <FiFileText size="36px" color="#D53F8C" />}
                        boxSize="60px"
                        isLoading={openingFile && activeFile === doc}
                        onClick={() => handleOpenFile(doc)}
                      />
                    </Tooltip>
                  );
                })
              )}
            </HStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default ViewFileModal