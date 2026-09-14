import React, { useState, useEffect } from "react";
import {
  Flex,
  Heading,
  Menu,
  MenuButton,
  MenuList,
  Button,
  Box,
  IconButton
} from "@chakra-ui/react";
import { FaFilter } from "react-icons/fa";
import { RepeatIcon } from "@chakra-ui/icons";
import { useSelector, useDispatch } from "react-redux";
import deloitte_theme from "../../theme";
import SubmittedFormsComponent from "../dashboards/SubmittedFormsComponent";
import FinancialYearFilter from "../../components/FinancialYearFilter";
import SkeletonComponent from "../../components/SkeletonComponent";
import { useSubmittedFormsQuery } from "../../redux/apiSlices/formApi";
import { setSubmittedFormDetails } from "../../redux/FormSlice";

function SubmissionDetails() {
  const { financialYears } = useSelector((state) => state.commonState);
  const [selectedFY, setSelectedFY] = useState(1);

  const userDetails = useSelector((state) => state.login);
  const dispatch = useDispatch();

  const [mappedSubmittedForms, setMappedSubmittedForms] = useState([]);
  const { data: submittedForms = [], isLoading: submittedFormsLoading, refetch: refetchSubmittedForms } = useSubmittedFormsQuery();

  useEffect(() => {
    if (submittedForms.length > 0 && userDetails.role_code) {
      const forms = submittedForms.filter(f =>
          f.state_code === userDetails.state &&
          f.fy_id === selectedFY
      );      

      setMappedSubmittedForms(forms);
      dispatch(setSubmittedFormDetails(forms));
    }
  }, [submittedForms, userDetails.role_code, userDetails.state, dispatch, selectedFY]);

  return (
    <Flex
      direction="column"
      gap={deloitte_theme.gap}
      px={deloitte_theme.paddingX}
      py={deloitte_theme.paddingY}
    >
      {/* Forms ection */}
      <Flex direction="column" gap={4}>
        {/* Section Header : Contains - FY selector and "Open Form" button */}
        <Flex direction="row" align="center" justifyContent="space-between" gap={deloitte_theme.gap}>
          <FinancialYearFilter selectedFY={selectedFY} setSelectedFY={setSelectedFY} />
          <IconButton
            aria-label="Refresh"
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
            <SubmittedFormsComponent title='List of Submitted Compliance Forms' submittedForms={mappedSubmittedForms} />
        }
      </Flex>
    </Flex >
  );
}

export default SubmissionDetails;