import {
    Button,
    Flex,
    Heading,
} from "@chakra-ui/react";
import TableComponent from "../../components/TableComponent";
import deloitte_theme from "../../theme";
import AddSectorTypeModal from "./AddSectorTypeModal";
import { useState } from "react";
import { useGetCommonDataQuery } from "../../redux/apiSlices/commonApi";

function SectorTypeManager() {
    // Ensure common data is fetched (single source of truth)
    const { data } = useGetCommonDataQuery();
    const sectorTypes = data?.sectorTypes || [];

    const [addModal, setAddModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState();

    const handleRowSelect = (data) => {
        setSelectedRow(data);
        setAddModal(true);
    }

    const handleAddModal = () => {
        setSelectedRow(null);
        setAddModal(true);
    }

    return (
        <Flex direction="column" gap={deloitte_theme.gap}>
            {/* Header Section */}
            <Flex justifyContent="space-between" alignItems="center">
                <Heading size="md">
                    Sector Type Management
                </Heading>
                <Button
                    bg={deloitte_theme.buttonSecondary}
                    onClick={handleAddModal}
                >
                    Add Sector Type
                </Button>
            </Flex>

            <TableComponent
                name="Sector Types"
                data={sectorTypes}
                isFilter
                handleRowSelect={handleRowSelect}
            />

            <AddSectorTypeModal isOpen={addModal} onClose={() => setAddModal(false)} selectedRow={selectedRow} />
        </Flex>
    )
}

export default SectorTypeManager;