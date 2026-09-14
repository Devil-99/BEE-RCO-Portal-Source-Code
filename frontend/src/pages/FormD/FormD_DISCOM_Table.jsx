import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { shared as s } from "./FormD_PDF_styles";

const COL = {
    label: "42%",
    unit: "8%",
    wind: "10%",
    hydro: "10%",
    distributed: "13%",
    other: "9%",
    total: "8%",
};

const t = StyleSheet.create({
    colHdrLabel: { width: "42%", backgroundColor: "#E7E6E6", fontWeight: "bold", fontSize: 11, textAlign: "center" },
    colHdrUnit: { width: "8%", backgroundColor: "#E7E6E6", fontWeight: "bold", fontSize: 11, textAlign: "center" },
    colHdrTotal: { width: "50%", backgroundColor: "#E7E6E6", fontWeight: "bold", fontSize: 11, textAlign: "center" },
    colHdrWind: { width: "10%", backgroundColor: "#E7E6E6", fontWeight: "bold", fontSize: 11, textAlign: "center" },
    colHdrHydro: { width: "10%", backgroundColor: "#E7E6E6", fontWeight: "bold", fontSize: 11, textAlign: "center" },
    colHdrDist: { width: "13%", backgroundColor: "#E7E6E6", fontWeight: "bold", fontSize: 11, textAlign: "center" },
    colHdrOther: { width: "9%", backgroundColor: "#E7E6E6", fontWeight: "bold", fontSize: 11, textAlign: "center" },
    colHdrTotalSmall: { width: "8%", backgroundColor: "#E7E6E6", fontWeight: "bold", fontSize: 11, textAlign: "center" },

    firstRowUnit: { width: "8%", backgroundColor: "#E7E6E6", textAlign: "center", fontSize: 10, fontWeight: "bold" },
    firstRowValue: { width: "50%", backgroundColor: "#FCE4D6", textAlign: "right", paddingRight: 10, fontSize: 10, fontWeight: "bold" },

    allPeachUnit: { width: "8%", backgroundColor: "#E7E6E6", textAlign: "center", fontSize: 10 },
    mixedUnit: { width: "8%", backgroundColor: "#E7E6E6", textAlign: "center", fontSize: 10 },
    greenUnit: { width: "8%", backgroundColor: "#E7E6E6", textAlign: "center", fontSize: 10 },
    greenValue: { width: "50%", backgroundColor: "#FCE4D6", textAlign: "right", paddingRight: 10, fontSize: 10, fontWeight: "bold" },

    partBLabel: { backgroundColor: "#E7E6E6", fontSize: 10, textAlign: "right", paddingRight: 10 },
    partBUnit: { width: "8%", backgroundColor: "#E7E6E6", textAlign: "center", fontSize: 8 },
    partBValue: { width: "50%", backgroundColor: "#FFFFFF", fontSize: 10, textAlign: "right", paddingRight: 10 },

    summaryRow: { height: 24 },
});

const display = (v) => (v !== undefined && v !== null && v !== "" ? v : "");
const displayPct = (v) =>
    v !== undefined && v !== null && v !== "" ? (String(v).endsWith("%") ? v : v + "%") : "";

const AllPeachRow = ({ label, unit, values, fn, isFirst }) => (
    <View style={[s.row, s.childRow]}>
        <View style={[s.cell, s.cellFirstCol, isFirst && s.cellTop, s.allPeachLabel, { width: COL.label }]}><Text>{label}</Text></View>
        <View style={[s.cell, isFirst && s.cellTop, t.allPeachUnit]}><Text>{unit}</Text></View>
        <View style={[s.cell, isFirst && s.cellTop, s.allPeachValue, { width: COL.wind }]}><Text>{fn(values[0])}</Text></View>
        <View style={[s.cell, isFirst && s.cellTop, s.allPeachValue, { width: COL.hydro }]}><Text>{fn(values[1])}</Text></View>
        <View style={[s.cell, isFirst && s.cellTop, s.allPeachValue, { width: COL.distributed }]}><Text>{fn(values[2])}</Text></View>
        <View style={[s.cell, isFirst && s.cellTop, s.allPeachValue, { width: COL.other }]}><Text>{fn(values[3])}</Text></View>
        <View style={[s.cell, isFirst && s.cellTop, s.allPeachValue, { width: COL.total }]}><Text>{fn(values[4])}</Text></View>
    </View>
);

const MixedRow = ({ label, unit, values, fn }) => (
    <View style={[s.row, s.childRow]}>
        <View style={[s.cell, s.cellFirstCol, s.mixedLabel, { width: COL.label }]}><Text>{label}</Text></View>
        <View style={[s.cell, t.mixedUnit]}><Text>{unit}</Text></View>
        <View style={[s.cell, s.mixedValue, { width: COL.wind }]}><Text>{fn(values[0])}</Text></View>
        <View style={[s.cell, s.mixedValue, { width: COL.hydro }]}><Text>{fn(values[1])}</Text></View>
        <View style={[s.cell, s.mixedValue, { width: COL.distributed }]}><Text>{fn(values[2])}</Text></View>
        <View style={[s.cell, s.mixedValue, { width: COL.other }]}><Text>{fn(values[3])}</Text></View>
        <View style={[s.cell, s.mixedValue, { width: COL.total }]}><Text>{fn(values[4])}</Text></View>
    </View>
);

const GreenHighlightRow = ({ label, unit, value, isFirst }) => (
    <View style={[s.row, s.childRow, s.greenHighlight]}>
        <View style={[s.cell, s.cellFirstCol, isFirst && s.cellTop, s.greenLabel, { width: COL.label }]}><Text>{label}</Text></View>
        <View style={[s.cell, isFirst && s.cellTop, t.greenUnit]}><Text>{unit}</Text></View>
        <View style={[s.cell, isFirst && s.cellTop, t.greenValue]}><Text>{display(value)}</Text></View>
    </View>
);

const PartBRow = ({ label, value }) => (
    <View style={[s.row, s.childRow]}>
        <View style={[s.cell, s.cellFirstCol, t.partBLabel, { width: COL.label }]}><Text>{label}</Text></View>
        <View style={[s.cell, t.partBUnit]}><Text>No. of Certs</Text></View>
        <View style={[s.cell, t.partBValue]}><Text>{display(value)}</Text></View>
    </View>
);

const SummaryRow = ({ label, unit, value, isFirst }) => (
    <View style={[s.row, t.summaryRow]}>
        <View style={[s.cell, s.cellFirstCol, isFirst && s.cellTop, s.firstRowLabel, { width: COL.label }]}>
            <Text>{label}</Text>
        </View>
        <View style={[s.cell, isFirst && s.cellTop, t.firstRowUnit]}><Text style={s.bold}>{unit}</Text></View>
        <View style={[s.cell, isFirst && s.cellTop, t.firstRowValue]}><Text style={s.bold}>{display(value)}</Text></View>
    </View>
);

export default function DiscomTable({ pA, pB, pC }) {
    const partAMixedRows = [
        { label: "Surplus / Deficit #", unit: "MU", values: [pA.surplusDeficit.wind, pA.surplusDeficit.hydro, pA.surplusDeficit.distributed, pA.surplusDeficit.other, pA.surplusDeficit.total], fn: display },
        { label: "Compliance", unit: "MU", values: [pA.compliance.wind, pA.compliance.hydro, pA.compliance.distributed, pA.compliance.other, pA.compliance.total], fn: display },
        { label: "Compliance (%)", unit: "%", values: [pA.compliancePercent.wind, pA.compliancePercent.hydro, pA.compliancePercent.distributed, pA.compliancePercent.other, pA.compliancePercent.total], fn: displayPct },
        { label: "Surplus / Deficit # (%)", unit: "%", values: [pA.surplusDeficitPercent.wind, pA.surplusDeficitPercent.hydro, pA.surplusDeficitPercent.distributed, pA.surplusDeficitPercent.other, pA.surplusDeficitPercent.total], fn: displayPct },
    ];

    const partCMixedRows = [
        { label: "Surplus / Deficit #", unit: "MU", values: [pC.surplusDeficit.wind, pC.surplusDeficit.hydro, pC.surplusDeficit.distributed, pC.surplusDeficit.other, pC.surplusDeficit.total], fn: display },
        { label: "Compliance", unit: "MU", values: [pC.compliance.wind, pC.compliance.hydro, pC.compliance.distributed, pC.compliance.other, pC.compliance.total], fn: display },
        { label: "Compliance (%)", unit: "%", values: [pC.compliancePercent.wind, pC.compliancePercent.hydro, pC.compliancePercent.distributed, pC.compliancePercent.other, pC.compliancePercent.total], fn: displayPct },
        { label: "Surplus / Deficit # (%)", unit: "%", values: [pC.surplusDeficitPercent.wind, pC.surplusDeficitPercent.hydro, pC.surplusDeficitPercent.distributed, pC.surplusDeficitPercent.other, pC.surplusDeficitPercent.total], fn: displayPct },
    ];

    return (
        <View>
            {/* PART A */}
            <View>
                <View style={[s.row, s.sectionHeaderGreen]}>
                    <Text>Part A – RENEWABLE CONSUMPTION OBLIGATIONS Compliance during Target Year</Text>
                </View>
                <View style={[s.row, s.columnHeader]}>
                    <View style={[s.cell, s.cellFirstCol, s.cellTop, t.colHdrLabel]}><Text>Particulars</Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrUnit]}><Text>Unit</Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrTotal]}><Text>Total Electrical Energy</Text></View>
                </View>
                <SummaryRow
                    label="Total Electricity Consumption on which Renewable Consumption Obligations is applicable"
                    unit="MU"
                    value={pA.totalConsumption}
                    isFirst
                />
                <View style={[s.row, s.columnHeader]}>
                    <View style={[s.cell, s.cellFirstCol, s.cellTop, t.colHdrLabel]}><Text>Particulars</Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrUnit]}><Text>Unit</Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrWind]}><Text>Wind RE <Text style={s.sup}>(1)</Text></Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrHydro]}><Text>Hydro RE <Text style={s.sup}>(2)</Text></Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrDist]}><Text>Distributed RE <Text style={s.sup}>(3)(4)</Text></Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrOther]}><Text>Other RE <Text style={s.sup}>(5)</Text></Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrTotalSmall]}><Text>Total</Text></View>
                </View>
                <AllPeachRow label="RCO (%) specified by MoP ###" unit="%" values={[pA.rcoPercent.wind, pA.rcoPercent.hydro, pA.rcoPercent.distributed, pA.rcoPercent.other, pA.rcoPercent.total]} fn={displayPct} isFirst />
                <AllPeachRow label="MoP Renewable Consumption Obligation Target" unit="MU" values={[pA.obligationTarget.wind, pA.obligationTarget.hydro, pA.obligationTarget.distributed, pA.obligationTarget.other, pA.obligationTarget.total]} fn={display} />
                {partAMixedRows.map((r, i) => (<MixedRow key={i} {...r} />))}
            </View>

            {/* PART B */}
            <View>
                <View style={[s.row, s.sectionHeaderBlue]}>
                    <Text>Part B – Compliance Transactions through REC and Buyout during Post AY Compliance Window</Text>
                </View>
                <GreenHighlightRow label="Renewable Energy Certificates (RECs)" unit="MU" value={pB.recsTotal} isFirst />
                <PartBRow label="Number of RECs Purchased" value={pB.recsPurchased} />
                <PartBRow label="Number of RECs Self-Retained" value={pB.recsSelfRetained} />
                <GreenHighlightRow label="Buyout Certificates" unit="MU" value={pB.buyoutsTotal} />
                <PartBRow label="Number of Buyout Certs Purchased" value={pB.buyoutCertsPurchased} />
                <GreenHighlightRow label="Total Compliance (RECs + Buyouts)" unit="MU" value={pB.totalCompliance} />
            </View>

            {/* PART C */}
            <View>
                <View style={[s.row, s.sectionHeaderYellow]}>
                    <Text>Part C – Final RENEWABLE CONSUMPTION OBLIGATIONS Compliance Post AY Compliance Window</Text>
                </View>
                <View style={[s.row, s.columnHeader]}>
                    <View style={[s.cell, s.cellFirstCol, s.cellTop, t.colHdrLabel]}><Text>Particulars</Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrUnit]}><Text>Unit</Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrWind]}><Text>Wind RE <Text style={s.sup}>(1)</Text></Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrHydro]}><Text>Hydro RE <Text style={s.sup}>(2)</Text></Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrDist]}><Text>Distributed RE <Text style={s.sup}>(3)(4)</Text></Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrOther]}><Text>Other RE <Text style={s.sup}>(5)</Text></Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrTotalSmall]}><Text>Total</Text></View>
                </View>
                {partCMixedRows.map((r, i) => (<MixedRow key={i} {...r} />))}
            </View>
        </View>
    );
}
