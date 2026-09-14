// useDocumentUpload.js
import { useState, useCallback } from "react";
import { useUploadFilesMutation } from "../../../redux/apiSlices/forms/formApi";
import { showToast } from "../../../components/toastService";

export function useDocumentUpload(uploadMode = "single") {
  const [allFiles, setAllFiles] = useState([]);
  const [uploadSections, setUploadSections] = useState([
    { id: Date.now(), files: [] },
  ]);
  const [uploadedPaths, setUploadedPaths] = useState([]);

  const [uploadFiles] = useUploadFilesMutation();

  const setSectionFiles = useCallback((idx, files) => {
    setUploadSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, files } : s))
    );
  }, []);

  const gatherAllFiles = useCallback(() => {
    return uploadMode === "multipleUploadSections"
      ? uploadSections.flatMap((s) => s.files || [])
      : allFiles || [];
  }, [uploadMode, uploadSections, allFiles]);

  const uploadAll = useCallback(async () => {
    try {
      const files = gatherAllFiles();
      if (!files.length) return [];

      const form = new FormData();
      files.forEach((f) => form.append("files", f));

      const uploaded = await uploadFiles(form).unwrap();
      const paths = uploaded?.files || [];

      setUploadedPaths(paths);
      return paths;
    } catch (e) {
      showToast({
        title: "File upload failed",
        description: e?.data?.detail || "Invalid file",
        status: "error",
      });
      throw e;
    }
  }, [gatherAllFiles, uploadFiles]);

  return {
    // state
    allFiles,
    uploadSections,
    uploadedPaths,

    // setters
    setAllFiles,
    setSectionFiles,

    // actions
    uploadAll,
  };
}
