import React, { useState } from 'react'
import instance from '../../../api_instance';
import { useSelector } from 'react-redux';
import { RiFileExcel2Fill } from "react-icons/ri";
import deloitte_theme from '../../../theme';
import { Button } from '@chakra-ui/react';
import { showToast } from '../../../components/toastService';

function ExcelDownloadSubmittedForm() {
    const { entity_id, fy_id, period_id } = useSelector((s) => s.formState);
    const [loading, setLoading] = useState(false);

    const downloadHandler = async () => {
        try {
            setLoading(true);

            const response = await instance.get(
                `/form/export-excel/entity-${entity_id}-fy-${fy_id}-period-${period_id}`,
                {
                    responseType: "blob",
                }
            );

            const blob = new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `${entity_id}_${fy_id}_${period_id}_Compliance_Report.xlsx`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            window.URL.revokeObjectURL(url);
        } catch (err) {
            showToast({
                title: err.message,
                description: err.data.detail || "Error Downloading Form",
                status: "error"
            })
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='flex flex-col justify-center items-center'>
            <Button variant='ghost' mx='auto' h='fit-content' w='fit-content' onClick={downloadHandler} isLoading={loading} >
                <RiFileExcel2Fill size={25} color={deloitte_theme.ternary} />
            </Button>
            <p className='text-xs' color={deloitte_theme.textSecondary}>Download</p>
        </div>
    )
}

export default ExcelDownloadSubmittedForm