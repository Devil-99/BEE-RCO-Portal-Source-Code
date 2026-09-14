import React, { useState, useEffect } from 'react'
import {
  Flex,
  Wrap,
  WrapItem,
  Button,
  Text,
  IconButton
} from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import deloitte_theme from '../../theme';
import { useSelector, useDispatch } from 'react-redux';
import SubmittedFormsComponent from '../dashboards/SubmittedFormsComponent';
import FinancialYearFilter from '../../components/FinancialYearFilter';

import { useSubmittedFormsQuery } from '../../redux/apiSlices/formApi';
import { useGetAeaEntitiesQuery } from '../../redux/apiSlices/aeaDashboardApi';
import { setSubmittedFormDetails } from '../../redux/FormSlice';
import SkeletonComponent from '../../components/SkeletonComponent';

function SubmissionDetails() {
  const { financialYears } = useSelector((state) => state.commonState);
  const userDetails = useSelector((state) => state.login);
    const dispatch = useDispatch();
  const [selectedFY, setSelectedFY] = useState(1);

  const { data: entities = [] } = useGetAeaEntitiesQuery(userDetails.username);
  const { data: submittedForms = [], isLoading: submittedFormsLoading, refetch: refetchSubmittedForms } = useSubmittedFormsQuery();
  const [mappedSubmittedForms, setMappedSubmittedForms] = useState([]);

  useEffect(() => {
    if (entities.length > 0 && submittedForms.length > 0 && userDetails.role_code) {
      const entityIds = entities.map(entity => entity.id);

      const forms = submittedForms.filter(form =>
        entityIds.includes(form.entity_id) &&
        form.fy_id === selectedFY
      )
      setMappedSubmittedForms(forms);
      dispatch(setSubmittedFormDetails(forms));
    }
  }, [entities, submittedForms, userDetails?.role_code, selectedFY]);

  return (
    <Flex
      direction="column"
      gap={5}
      px={deloitte_theme.paddingX}
      py={deloitte_theme.paddingY}
    >
      {/* Forms ection */}
      <Flex direction="column" gap={4}>
        {/* Section Header : Contains - FY selector and "Open Form" button */}
        <Flex direction="row" align="center" justifyContent="space-between" gap={deloitte_theme.gap}>
          <FinancialYearFilter selectedFY={selectedFY} setSelectedFY={setSelectedFY} />

          <IconButton
            aria-label="Refresh Entities"
            icon={<RepeatIcon />}
            onClick={refetchSubmittedForms}
            colorScheme="green"
            isRound
            boxShadow="md"
          />
        </Flex>

        {/* List of Submitted forms */}
        {
          submittedFormsLoading ?
            <SkeletonComponent />
            :
            <SubmittedFormsComponent submittedForms={mappedSubmittedForms} />
        }
      </Flex>
    </Flex >
  )
}

export default SubmissionDetails