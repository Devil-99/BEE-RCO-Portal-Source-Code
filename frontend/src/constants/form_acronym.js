const cppAcronymLabelMap = {
    "rco_target": "Atarget",
    "compliance": "D2",
    "compliance_percentage": "B2",
    "suplus_deficite": "C2",
    "surplus_deficit_percentage": "E2"
};

const discomAcronymLabelMap = {
    "rco_target": "ATT",
    "compliance": "FtT",
    "compliance_percentage": "FTT",
    "suplus_deficite": "EE",
    "surplus_deficit_percentage": "GTT"
};

export const acronymLabels = {
    "rco_target": "RCO Target",
    "compliance": "Compliance",
    "compliance_percentage": "Compliance (%)",
    "suplus_deficite": "Surplus / Deficit",
    "surplus_deficit_percentage": "Surplus / Deficit (%)"
}

export const getLabelForAcronym = (formType) => {
    if (formType === "INDUSTRY") {
        return cppAcronymLabelMap;
    }
    else if (formType === "DISCOM") {
        return discomAcronymLabelMap;
    }
    else
        return {};
};