import { useState } from "react";
import { Flex, Heading, Button } from "@chakra-ui/react";
import TableComponent from "../../components/TableComponent";
import deloitte_theme from "../../theme";
import RCOTargetModal from "./RCOTargetModel";
import { useFY } from "../../Hooks/useLookUp";
import { useGetRcoTargetsQuery } from "../../redux/apiSlices/rcoTargetControlApi";
import SkeletonComponent from "../../components/SkeletonComponent";

const RCOTargetManager = () => {
    const { data: allTargets, isLoading: isTargetsLoading } = useGetRcoTargetsQuery();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const getFY = useFY();

    const handleAdd = () => {
        setSelectedRow(null);
        setModalOpen(true);
    };

    const buildTargetFormData = (row) => {
        const related = allTargets?.filter(
            (t) =>
                t.fy_id === row.fy_id &&
                t.category === row.category
        ) || [];

        return {
            fy_id: row.fy_id,
            category: row.category,
            wind:
                related.find((t) => t.source === "WIND")?.target_pct ?? "",
            hydro:
                related.find((t) => t.source === "HYDRO")?.target_pct ?? "",
            distributed:
                related.find((t) => t.source === "DISTRIBUTED")?.target_pct ?? "",
            other:
                related.find((t) => t.source === "OTHERS")?.target_pct ?? "",
        };
    };

    const handleRowSelect = (row) => {
        setSelectedRow(buildTargetFormData(row));
        setModalOpen(true);
    };

    const handleClose = () => {
        setModalOpen(false);
        setSelectedRow(null);
    };

    const config = [
        {
            name: 'fy_id',
            header: 'Financial Year',
            numeric: true,
            width: '150px',
            render: (row) => getFY(row.fy_id),
        },
        {
            name: 'category',
            header: 'Category',
            numeric: false,
            width: '150px',
            render: (row) => row.category,
        },
        {
            name: 'source',
            header: 'Source',
            numeric: false,
            width: '150px',
            render: (row) => row.source,
        },
        {
            name: 'targets',
            header: 'RCO Targets (%)',
            numeric: true,
            width: '150px',
            render: (row) => row.target_pct,
        }
    ]
    return (
        <Flex direction="column" gap={deloitte_theme.gap}>
            <Flex justifyContent="space-between" alignItems="center">
                <Heading size="md">RCO Targets Management</Heading>
                <Button bg={deloitte_theme.buttonSecondary} onClick={handleAdd}>Add Target</Button>
            </Flex>
            {
                isTargetsLoading ?
                    <SkeletonComponent type="table" />
                    :
                    <TableComponent
                        name="RCO Targets"
                        config={config}
                        data={allTargets || []}
                        isFilter
                        handleRowSelect={handleRowSelect}
                    />
            }

            <RCOTargetModal
                isOpen={modalOpen}
                onClose={handleClose}
                selectedRow={selectedRow}
            />
        </Flex>
    );
};

export default RCOTargetManager;
