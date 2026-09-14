import React, { useState, useEffect } from "react";
import GenericForm from "../common/GenericForm";
import deloitte_theme from "../../../theme";
import DiscomSummaryConfig from "./discomSummaryConfig"; // array of rows
import { useSelector } from "react-redux";
import summaryConfig from "./discomSummaryConfig";
import { useGetEntityDetailsQuery } from "../../../redux/apiSlices/entityApi";

/**
 * Adjust compliance logic (kept same)
 */
function adjust_compliance(targets, compliance) {
  let adjusted = { ...compliance };
  let transfers = [];

  const categories = ["Wind", "Hydro", "Dist", "Other"];
  let deficits = {};
  let surpluses = {};

  categories.forEach((cat) => {
    const diff = compliance[cat] - targets[cat];
    if (diff < 0) deficits[cat] = -diff;
    else surpluses[cat] = diff;
  });

  for (let defCat in deficits) {
    for (let surCat in surpluses) {
      if (deficits[defCat] > 0 && surpluses[surCat] > 0) {
        const transfer = Math.min(deficits[defCat], surpluses[surCat]);
        adjusted[defCat] += transfer;
        adjusted[surCat] -= transfer;
        deficits[defCat] -= transfer;
        surpluses[surCat] -= transfer;
        transfers.push(`${transfer} MU moved from ${surCat} to ${defCat}`);
      }
    }
  }

  return { adjustedCompliance: adjusted, transferLogs: transfers };
}

export default function DiscomPage() {
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
    sector_type: entityDetails?.entity_type,
  }


  const config = {
    apiBase: "/discom",
    submitPath: "/form/discom/submit",
    title: "RCO Compliance Data reporting by Distribution Licensee (Form A)",
    uploadMode: "multipleUploadSections",
    postEvaluateHook: (evaluatedData) => {
      const targets = {
        Wind: Number(evaluatedData.AT1) || 0,
        Hydro: Number(evaluatedData.AT2) || 0,
        Dist: Number(evaluatedData.AT3) || 0,
        Other: Number(evaluatedData.AT4) || 0,
      };
      const compliance = {
        Wind: Number(evaluatedData.AO1) || 0,
        Hydro: Number(evaluatedData.AO2) || 0,
        Dist: Number(evaluatedData.AO3) || 0,
        Other: Number(evaluatedData.AO4) || 0,
      };

      const { adjustedCompliance, transferLogs } = adjust_compliance(
        targets,
        compliance
      );

      const finalEvaluatedData = {
        ...evaluatedData,
        AO1: adjustedCompliance.Wind,
        AO2: adjustedCompliance.Hydro,
        AO3: adjustedCompliance.Dist,
        AO4: adjustedCompliance.Other,
      };

      return { finalEvaluatedData, logs: transferLogs };
    },
  };

  return (
    <GenericForm
      config={config}
      theme={deloitte_theme}
      summaryConfig={summaryConfig}
      formContext={formContext}
      mode={login.role_code === "USR" ? "add" : "view"}
      type="DISCOM"
    />
  );
}
