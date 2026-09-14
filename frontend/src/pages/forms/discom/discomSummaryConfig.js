// src/config/discomSummaryConfig.js

 const discomSummaryConfig = {
  columnHeaders: ["Wind RE", "Hydro RE", "Distributed RE", "Other RE", "Total"],
  summaryTableData: [
    {
      label: "RCO (%) specified by MoP",
      acronym: "ZTT",
      unit: "%",
      keys: ["ZT1", "ZT2", "ZT3", "ZT4", "ZTT"], // one per column
    },
    {
      label: "MoP Renewable Consumption Obligation Target",
      acronym: "ATT",
      unit: "MU",
      keys: ["AT1", "AT2", "AT3", "AT4", "ATT"],
    },
    {
      label: "Compliance without REC",
      acronym: "AOT",
      unit: "MU",
      keys: ["AO1", "AO2", "AO3", "AO4", "AOT"],
    },
    {
      label: "Compliance (%) without REC",
      acronym: "AMT",
      unit: "%",
      keys: ["AM1", "AM2", "AM3", "AM4", "AMT"],
    },
    {
      label: "Surplus / Deficit without REC",
      acronym: "cT",
      unit: "MU",
      keys: ["c1", "c2", "c3", "c4", "cT"],
    },
    {
      label: "Surplus / Deficit (%) without REC",
      acronym: "CTT",
      unit: "%",
      keys: ["CT1", "CT2", "CT3", "CT4", "CTT"],
      specialStyling: { bg: "blue.50" },
    },
    {
      label: "Surplus / Deficit (Total)",
      acronym: "EE",
      unit: "MU",
      keys: ["EE1", "EE2", "EE3", "EE4", "EE"],
    },
       {
      label: "Compliance ",
      acronym: "FtT",
      unit: "MU",
      keys: ["Ft1", "Ft2", "Ft3", "Ft4", "FtT"],
    },
    {
      label: "Compliance %",
      acronym: "FTT",
      unit: "%",
      keys: ["FT1", "FT2", "FT3", "FT4", "FTT"],
    },
    {
      label: "Surplus / Deficit %",
      acronym: "GTT",
      unit: "%",
      keys: ["GT1", "GT2", "GT3", "GT4", "GTT"],
    },
  ],
};

export default discomSummaryConfig;