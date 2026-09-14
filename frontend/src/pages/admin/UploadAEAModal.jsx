import BulkUploadModal from "../../components/BulkUploadModal";
import {
    useUploadAEAExcelMutation,
} from "../../redux/apiSlices/AEAControlApi.js";

const UploadAEAModal = ({
                            isOpen,
                            onClose,
                            refetch,
                        }) => {

    const [
        uploadAEAExcel,
        { isLoading: uploading },
    ] = useUploadAEAExcelMutation();

    return (
        <BulkUploadModal
            isOpen={isOpen}
            onClose={onClose}
            refetch={refetch}
            title="Upload Energy Auditors"
            fileLabel="Energy Auditor Excel File"
            templateUrl="/Forms/energy_auditor_template.xlsx"
            templateName="energy_auditor_template.xlsx"
            uploadFile={uploadAEAExcel}
            uploading={uploading}
            fileInputId="aea-file"
        />
    );
};

export default UploadAEAModal;