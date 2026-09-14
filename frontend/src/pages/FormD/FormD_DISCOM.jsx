import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { shared as s } from "./FormD_PDF_styles";
import DiscomTable from "./FormD_DISCOM_Table";

const discom = StyleSheet.create({
    labelCell: {
        width: "42%",
        backgroundColor: "#E7E6E6",
        fontSize: 10,
        fontWeight: "bold",
        textAlign: "left",
        paddingVertical: 4,
        paddingHorizontal: 6,
    },
    valueCell: {
        width: "58%",
        backgroundColor: "#FCE4D6",
        fontSize: 10,
        fontWeight: "bold",
        textAlign: "left",
        paddingVertical: 4,
        paddingHorizontal: 6,
    },
});

const defaultData = {
    discomName: "0",
    registrationNo: "0",
    targetYear: "2024-25",
    compliancePeriod: "Annual",
    state: "JK",
    partA: {
        totalConsumption: "22601.111",
        rcoPercent: { wind: "0.67", hydro: "0.38", distributed: "0.75", other: "28.11", total: "29.91" },
        obligationTarget: { wind: "151.427", hydro: "85.884", distributed: "169.508", other: "6553.172", total: "6759.992" },
        surplusDeficit: { wind: "", hydro: "", distributed: "-166.506", other: "", total: "-3295.770" },
        compliance: { wind: "", hydro: "", distributed: "3.003", other: "", total: "3664.223" },
        compliancePercent: { wind: "", hydro: "", distributed: "0.01", other: "", total: "15.33" },
        surplusDeficitPercent: { wind: "", hydro: "", distributed: "-0.74", other: "", total: "-14.58" },
    },
    partB: {
        recsTotal: "0.00",
        recsPurchased: "",
        recsSelfRetained: "",
        buyoutsTotal: "0.00",
        buyoutCertsPurchased: "",
        totalCompliance: "0.00",
    },
    partC: {
        surplusDeficit: { wind: "", hydro: "", distributed: "-166.506", other: "", total: "-3295.770" },
        compliance: { wind: "", hydro: "", distributed: "3.003", other: "", total: "3464.223" },
        compliancePercent: { wind: "", hydro: "", distributed: "0.01", other: "", total: "15.33" },
        surplusDeficitPercent: { wind: "", hydro: "", distributed: "-0.74", other: "", total: "-14.58" },
    },
};

function FormDDiscom({ data = {} }) {
    const display = (val) => (val !== undefined && val !== null && val !== "" ? val : "-");

    const d = {
        ...defaultData,
        ...(data || {}),
        partA: { ...defaultData.partA, ...(data.partA || {}) },
        partB: { ...defaultData.partB, ...(data.partB || {}) },
        partC: { ...defaultData.partC, ...(data.partC || {}) },
    };

    const sectionARows = [
        { label: "Name of Obligated Designated Consumer", value: d.discomName },
        { label: "Registration No. of Obligated Designated Consumer", value: d.registrationNo },
        { label: "Target Year FY ( __ - __ )", value: d.targetYear },
        { label: "Compliance Period (Quarterly / Annual)", value: d.compliancePeriod },
        { label: "Location - State", value: d.state },
    ];

    return (
        <Document>
            <Page size={[1200, 1000]} style={s.page}>
                <View style={s.container}>

                    <View style={[s.row, s.headerTitle]}>
                        <Text>RCO Compliance Data Reporting by Distribution Licensee (Form D)</Text>
                    </View>

                    <View>
                        <View style={[s.row, s.sectionAHeader]}>
                            <Text>Basic Information</Text>
                        </View>
                        {sectionARows.map((r, i) => (
                            <View key={i} style={s.row}>
                                <View style={[s.cell, s.cellFirstCol, i === 0 && s.cellTop, discom.labelCell]}>
                                    <Text>{r.label}</Text>
                                </View>
                                <View style={[s.cell, i === 0 && s.cellTop, discom.valueCell]}>
                                    <Text>{display(r.value)}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <DiscomTable pA={d.partA} pB={d.partB} pC={d.partC} />

                    <View style={s.legendSection}>
                        <View style={s.legendTitle}>
                            <Text>Legend:</Text>
                        </View>
                        <View style={s.legendRow}>
                            <View style={[s.legendCell, s.legendCellFirst, s.legendCellTop, s.legendDisabled]}>
                                <Text>Data Entry Not Allowed</Text>
                            </View>
                            <View style={[s.legendCell, s.legendCellTop, s.legendUser]}>
                                <Text>Data To Be Entered By User</Text>
                            </View>
                            <View style={[s.legendCell, s.legendCellTop, s.legendCalculated]}>
                                <Text>Calculated Data</Text>
                            </View>
                        </View>
                    </View>

                    <View style={s.undertakingBox}>
                        <View style={s.undertakingHeading}>
                            <Text>Undertaking</Text>
                        </View>
                        <Text style={s.undertakingText}>
                            I/We undertake that the information supplied in this Renewable Consumption Obligations
                            Compliance Declaration Form For Obligated Designated Consumers is accurate to the best of
                            my knowledge and if any information supplied is found to be incorrect and such information
                            results into loss to the Central Government or any authority under them or any other person
                            affected, I/we undertake to indemnify such loss.
                        </Text>
                        <Text style={s.undertakingText}>
                            I/We agree to extend necessary assistance in case of any enquiry to be made in the matter.
                        </Text>
                        <View style={s.footnote}>
                            <Text>
                                This is system-generated from the RCO Portal.
                            </Text>
                        </View>
                    </View>

                </View>
            </Page>
        </Document>
    );
}

export default FormDDiscom;
