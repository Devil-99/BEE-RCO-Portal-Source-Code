import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    Flex
} from "@chakra-ui/react";
import TableComponent from "../../components/TableComponent";
import deloitte_theme from "../../theme";
import { empanelledAuditors } from "../../constants/audit_firms_list";

const config = [
    { name: "firm_name", header: "Firm Name", numeric: false, width: "280px", render: (row) => row.firm_name },
    { name: "auditor", header: "Auditor Name", numeric: false, width: "280px", render: (row) => row.auditor },
    { name: "address", header: "Address", numeric: false, width: "450px", render: (row) => row.address },
];

const AuditFirmListModal = ({ isOpen, onClose }) => {
    const firms = empanelledAuditors;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            isCentered
            size="6xl"
            scrollBehavior="inside"
        >
            <ModalOverlay bg="blackAlpha.400" />

            <ModalContent
                borderRadius="xl"
                bg={deloitte_theme.white}
                border="1px solid"
                borderColor={deloitte_theme.borderColor}
                maxH="92vh"
            >
                <ModalBody p={0} overflowY="auto">
                    <TableComponent
                        name="BEE Empanelled Audit Firms"
                        config={config}
                        data={firms}
                        isDownload
                        isFilter
                    />
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default AuditFirmListModal;