// src/utils/api.js
import instance from "../../../api_instance";

export const fetchSections = (base) =>
  instance.get(`${base}/sections`).then((r) => r.data);
export const fetchFields = (base) =>
  instance.get(`${base}/fields`).then((r) => r.data);
export const fetchFinancialYears = () =>
  instance.get("/financial-year").then((r) => r.data);
export const fetchPeriodsForFy = (fyId) =>
  instance.get(`/submission-period/fy-${fyId}`).then((r) => r.data);
export const fetchFormData = (entity_id, fy, period) =>
  instance
    .get(`/form/data/entity-${entity_id}-fy-${fy}-period-${period}`)
    .then((r) => r.data);
export const uploadFiles = (files) => {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  return instance
    .post(`/form-data/uploads`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data?.files || []);
};
export const submitFormApi = (path, payload) =>
  instance.post(path, payload).then((r) => r.data);
