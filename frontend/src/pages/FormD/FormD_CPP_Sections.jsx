import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { shared as s } from "./FormD_PDF_styles";

const t = StyleSheet.create({
    colHdrLabel: { width: "52%", backgroundColor: "#E7E6E6", fontWeight: "bold", fontSize: 11, textAlign: "center" },
    colHdrUnit: { width: "24%", backgroundColor: "#E7E6E6", fontWeight: "bold", fontSize: 11, textAlign: "center" },
    colHdrValue: { width: "24%", backgroundColor: "#E7E6E6", fontWeight: "bold", fontSize: 11, textAlign: "right", paddingRight: 10 },

    labelCell: { width: "52%", backgroundColor: "#FFFFFF", fontWeight: "600", fontSize: 10 },
    unitCell: { width: "24%", backgroundColor: "#E7E6E6", textAlign: "center", fontSize: 10 },
    valueCell: { width: "24%", backgroundColor: "#FCE4D6", textAlign: "right", paddingRight: 10, fontSize: 10 },
    threeColUnit: { width: "24%", backgroundColor: "#E7E6E6", textAlign: "center", fontSize: 11 },

    firstRowLabel: { backgroundColor: "#FFF2CC", fontSize: 11 },
    firstRowUnit: { width: "24%", backgroundColor: "#E7E6E6", textAlign: "center", fontSize: 11 },
    firstRowValue: { width: "24%", backgroundColor: "#FCE4D6", textAlign: "right", paddingRight: 10, fontSize: 11 },

    greenGroupLabel: { width: "52%", backgroundColor: "#A9D18E", fontWeight: "bold", fontSize: 11 },
    greenGroupUnit: { width: "24%", backgroundColor: "#E7E6E6", textAlign: "center", fontSize: 11 },
    greenGroupValue: { width: "24%", backgroundColor: "#FCE4D6", textAlign: "right", paddingRight: 10, fontSize: 11 },

    childLabel: { width: "52%", backgroundColor: "#E7E6E6", fontWeight: "normal", textAlign: "right", paddingRight: 10, fontSize: 10 },
    childUnit: { width: "24%", backgroundColor: "#E7E6E6", textAlign: "center", fontSize: 10 },
    childValue: { width: "24%", backgroundColor: "#FFFFFF", textAlign: "right", paddingRight: 10, fontSize: 10 },
});

const displayValue = (val) =>
    val !== undefined && val !== null && val !== "" ? val : "-";

const ThreeColRow = ({ label, unit, value, labelStyle, unitStyle, valueStyle }) => (
    <View style={s.row}>
        <View style={[s.cell, s.cellFirstCol, t.labelCell, ...(labelStyle || [])]}>
            <Text>{label}</Text>
        </View>
        <View style={[s.cell, t.threeColUnit, s.center, ...(unitStyle || [])]}>
            <Text>{unit}</Text>
        </View>
        <View style={[s.cell, t.valueCell, s.right, ...(valueStyle || [])]}>
            <Text>{displayValue(value)}</Text>
        </View>
    </View>
);

const sectionBRows = (sec) => [
    { label: "RCO (%) Notified By MoP", unit: "%", value: sec.rcoPercent, labelStyle: [s.noGreenLabel], valueStyle: [s.noGreenValue] },
    { label: "Renewable Consumption Obligation Target", unit: "MU", value: sec.rcoTarget, labelStyle: [s.noGreenLabel], valueStyle: [s.noGreenValue] },
    { label: "Compliance", unit: "MU", value: sec.compliance, labelStyle: [s.remainingLabel], valueStyle: [] },
    { label: "Compliance (%)", unit: "%", value: sec.compliancePercent, labelStyle: [s.remainingLabel], valueStyle: [] },
    { label: "Surplus / Deficit #", unit: "MU", value: sec.surplusDeficit, labelStyle: [s.remainingLabel], valueStyle: [] },
    { label: "Surplus / Deficit # (%)", unit: "%", value: sec.surplusDeficitPercent, labelStyle: [s.remainingLabel], valueStyle: [] },
];

const sectionDRows = (sec) => [
    { label: "RCO (%) Notified By MoP", unit: "%", value: sec.rcoPercent, labelStyle: [s.dRegularLabel], valueStyle: [s.dRegularValue] },
    { label: "Renewable Consumption Obligation Target", unit: "MU", value: sec.rcoTarget, labelStyle: [s.dRegularLabel], valueStyle: [s.dRegularValue] },
    { label: "Compliance", unit: "MU", value: sec.compliance, labelStyle: [s.remainingLabel], valueStyle: [] },
    { label: "Compliance (%)", unit: "%", value: sec.compliancePercent, labelStyle: [s.remainingLabel], valueStyle: [] },
    { label: "Surplus / Deficit #", unit: "MU", value: sec.surplusDeficit, labelStyle: [s.remainingLabel], valueStyle: [] },
    { label: "Surplus / Deficit # (%)", unit: "%", value: sec.surplusDeficitPercent, labelStyle: [s.remainingLabel], valueStyle: [] },
];

export default function CppSections({ sectionB, sectionC, sectionD }) {
    const sectionCData = [
        { type: "green-group", label: "Renewable Energy Certificates (RECs) ###", unitText: "MU", bold: true, value: sectionC.recsTotal },
        { type: "child-row", label: "Number Of RECs Purchased", unitText: "No. Of Certificates", bold: false, value: sectionC.recsPurchased },
        { type: "child-row", label: "Number Of RECs Self-Retained", unitText: "No. Of Certificates", bold: false, value: sectionC.recsSelfRetained },
        { type: "green-group", label: "Buyouts", unitText: "MU", bold: true, value: sectionC.buyoutsTotal },
        { type: "child-row", label: "Number Of Buyout Certs Purchased", unitText: "No. Of Certificates", bold: false, value: sectionC.buyoutCertsPurchased },
        { type: "green-group", label: "Total Compliance (RECs + Buyouts)", unitText: "MU", bold: true, value: sectionC.totalCompliance },
    ];

    return (
        <View>
            {/* SECTION B */}
            <View>
                <View style={[s.row, s.sectionHeaderGreen]}>
                    <Text>Section B : RCO Compliance During Target Year</Text>
                </View>
                <View style={[s.row, s.columnHeader]}>
                    <View style={[s.cell, s.cellFirstCol, s.cellTop, t.colHdrLabel]}><Text> Particular</Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrUnit]}><Text>Unit</Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrValue]}><Text>Values</Text></View>
                </View>
                <View style={s.row}>
                    <View style={[s.cell, s.cellFirstCol, t.labelCell, t.firstRowLabel]}>
                        <Text>Gross Total Electricity Consumption On Which Renewable Consumption Obligation Is Applicable</Text>
                    </View>
                    <View style={[s.cell, t.firstRowUnit]}>
                        <Text style={s.bold}>MU</Text>
                    </View>
                    <View style={[s.cell, t.firstRowValue]}>
                        <Text style={s.bold}>{displayValue(sectionB.grossConsumption)}</Text>
                    </View>
                </View>
                {sectionBRows(sectionB).map((r, i) => (
                    <ThreeColRow key={i} label={r.label} unit={r.unit} value={r.value} labelStyle={r.labelStyle} valueStyle={r.valueStyle} />
                ))}
            </View>

            {/* SECTION C */}
            <View>
                <View style={[s.row, s.sectionHeaderBlue]}>
                    <Text>Section C : Compliance Transactions Through REC And Buyout During Assessment Year Compliance Window</Text>
                </View>
                <View style={[s.row, s.columnHeader]}>
                    <View style={[s.cell, s.cellFirstCol, s.cellTop, t.colHdrLabel]}><Text>Particular</Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrUnit]}><Text>Unit</Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrValue]}><Text>Values</Text></View>
                </View>
                {sectionCData.map((row, i) => {
                    const isGreen = row.type === "green-group";
                    return (
                        <View key={i} style={[s.row, !isGreen && s.childRow]}>
                            <View style={[s.cell, s.cellFirstCol, t.labelCell, ...(isGreen ? [t.greenGroupLabel] : [t.childLabel])]}>
                                <Text>{row.label}</Text>
                            </View>
                            <View style={[s.cell, ...(isGreen ? [t.greenGroupUnit] : [t.childUnit])]}>
                                {row.bold ? <Text style={s.bold}>{row.unitText}</Text> : <Text>{row.unitText}</Text>}
                            </View>
                            <View style={[s.cell, ...(isGreen ? [t.greenGroupValue] : [t.childValue])]}>
                                {row.bold ? <Text style={s.bold}>{displayValue(row.value)}</Text> : <Text>{displayValue(row.value)}</Text>}
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* SECTION D */}
            <View>
                <View style={[s.row, s.sectionHeaderYellow]}>
                    <Text>Section D : Final RCO Compliance (Assessment Year Compliance Window)</Text>
                </View>
                <View style={[s.row, s.columnHeader]}>
                    <View style={[s.cell, s.cellFirstCol, s.cellTop, t.colHdrLabel]}><Text>Particular</Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrUnit]}><Text>Unit</Text></View>
                    <View style={[s.cell, s.cellTop, t.colHdrValue]}><Text>Values</Text></View>
                </View>
                {sectionDRows(sectionD).map((r, i) => (
                    <ThreeColRow key={i} label={r.label} unit={r.unit} value={r.value} labelStyle={r.labelStyle} valueStyle={r.valueStyle} />
                ))}
            </View>
        </View>
    );
}
