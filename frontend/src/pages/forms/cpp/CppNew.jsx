// src/pages/cpp/CppPage.jsx
import React, { useState, useMemo } from "react";
import GenericForm from "../common/GenericForm";
import deloitte_theme from "../../../theme";
import CppSummaryConfig from "./cppSummaryConfig"; // create as array (same as earlier summaryTableData)
import { useSelector } from "react-redux";
import { useGetEntityDetailsQuery } from "../../../redux/apiSlices/entityApi";

export default function CppPage() {
  const login = useSelector((s) => s.login);

  const { entity_id } = useSelector((state) => state.formState);
  const { data: entityDetails } = useGetEntityDetailsQuery(entity_id, {
    skip: !entity_id,
  });
  const formContext = {
    entity_id: entityDetails?.entity_id,
    user_id: login?.user_id,
    org_name: entityDetails?.org_name,
    entity_registration_number: entityDetails?.entity_reg_no,
    pat_number: entityDetails?.pat_reg_number,
    address: entityDetails?.address,
    state: entityDetails?.state_code,
    sector_type: entityDetails?.sector_code,
  }
  const config = useMemo(
    () => ({
      apiBase: "/cpp",
      submitPath: "/form/cpp/submit",
      title:
        "RCO Compliance Data reporting (Form A) - DCs with CPP & Open Access",
      uploadMode: "single",
    }),
    []
  );

  return (
    <GenericForm
      config={config}
      theme={deloitte_theme}
      summaryConfig={CppSummaryConfig}
      type="INDUSTRY"
      formContext={formContext}
      mode={login.role_code === "USR" ? "add" : "view"}
    />
  );
}
