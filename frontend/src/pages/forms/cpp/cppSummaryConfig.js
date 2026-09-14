// cppSummaryConfig.js
const cppSummaryConfig = {
  summaryTableData: [
    {
      label: "RCO (%) notified by MoP",
      acronym: "Z1",
      unit: "%",
      type: "LOGIC",
      dataKey: "Z1",
    },
    {
      label: "Renewable Consumption Obligation Target",
      acronym: "K * Z1 / 100",
      unit: "MU",
      type: "LOGIC",
      dataKey: "Atarget",
    },
    {
      label: "Compliance",
      acronym: "Y1 + T1",
      unit: "MU",
      type: "LOGIC",
      dataKey: "D2",
    },
    {
      label: "Compliance (%)",
      acronym: "(D2 / K) * 100",
      unit: "%",
      type: "LOGIC",
      dataKey: "B2",
    },
    {
      label: "Surplus / Deficit #",
      acronym: "D2 - Atarget",
      unit: "MU",
      type: "LOGIC",
      dataKey: "C2",
    },
    {
      label: "Surplus / Deficit # (%)",
      acronym: "B2 - Z1",
      unit: "%",
      type: "LOGIC",
      dataKey: "E2",
    },
  ],

  // optional — if multi-column needed later
  columnHeaders: [],  
};

export default cppSummaryConfig;
