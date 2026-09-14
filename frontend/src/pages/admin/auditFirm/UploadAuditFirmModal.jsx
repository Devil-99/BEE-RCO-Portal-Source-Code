import { useUploadAuditFirmExcelMutation } from "../../../redux/apiSlices/auditFirmControlApi";
import BulkUploadModal from "../../../components/BulkUploadModal";

const UploadAuditFirmModal = ({ isOpen, onClose, refetch }) => {
    const [uploadAuditFirmExcel, { isLoading: uploading }] =
        useUploadAuditFirmExcelMutation();

    return (
        <BulkUploadModal
            isOpen={isOpen}
            onClose={onClose}
            refetch={refetch}
            title="Upload Audit Firms"
            fileLabel="Audit Firm Excel File"
            templateUrl="/Forms/audit_firm_template.xlsx"
            templateName="audit_firm_template.xlsx"
            uploadFile={uploadAuditFirmExcel}
            uploading={uploading}
            fileInputId="audit-firm-file"
        />
    );
};

export default UploadAuditFirmModal;

