import React from "react";
import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { shared as s } from "./FormD_PDF_styles";
import CppSections from "./FormD_CPP_Sections";

const defaultData = {
    sectionA: {
        dcName: "0",
        sector: "0",
        registrationNo: "0",
        obligationType: "0",
        targetYear: "0",
        compliancePeriod: "0",
    },
    sectionB: {
        grossConsumption: "210.000",
        rcoPercent: "29.91 %",
        rcoTarget: "62.811",
        compliance: "70.000",
        compliancePercent: "33.33 %",
        surplusDeficit: "7.189",
        surplusDeficitPercent: "3.42 %",
    },
    sectionC: {
        recsTotal: "0.000",
        recsPurchased: " ",
        recsSelfRetained: " ",
        buyoutsTotal: "0.000",
        buyoutCertsPurchased: " ",
        totalCompliance: "0.000",
    },
    sectionD: {
        rcoPercent: "29.91 %",
        rcoTarget: "62.811",
        compliance: "70.000",
        compliancePercent: "33.33 %",
        surplusDeficit: "7.189",
        surplusDeficitPercent: "3.42 %",
    },
    signature: {
        sealImage: "",
        name: "",
        designation: "Energy Manager / Plant Head",
    },
};

function FormDCpp({ data = {} }) {
    const displayValue = (val) =>
        val !== undefined && val !== null && val !== "" ? val : "-";

    const d = {
        sectionA: { ...defaultData.sectionA, ...(data.sectionA || {}) },
        sectionB: { ...defaultData.sectionB, ...(data.sectionB || {}) },
        sectionC: { ...defaultData.sectionC, ...(data.sectionC || {}) },
        sectionD: { ...defaultData.sectionD, ...(data.sectionD || {}) },
        signature: { ...defaultData.signature, ...(data.signature || {}) },
    };

    const signatureName = displayValue(d.signature.name);

    const sectionARows = [
        { label: "Name Of Obligated Designated Consumer", value: d.sectionA.dcName },
        { label: "Energy Intensive Sector Of Designated Consumer", value: d.sectionA.sector },
        { label: "Registration No. Of Obligated Designated Consumer", value: d.sectionA.registrationNo },
        { label: "Type Of Obligation(S) Of Obligated Designated Consumer", value: d.sectionA.obligationType },
        { label: "Target Year FY ( __ - __ )", value: d.sectionA.targetYear },
        { label: "Compliance Period (Quarter / Annual)", value: d.sectionA.compliancePeriod },
    ];

    return (
        <Document>
            <Page size={[1200, 1000]} style={s.page}>
                <View style={s.container}>

                    <View style={[s.row, s.headerTitle]}>
                        <Text>RCO Compliance Data Reporting (Form D) - DCs With CPP &amp; Open Access</Text>
                    </View>

                    <View>
                        <View style={[s.row, s.sectionAHeader]}>
                            <Text>Section A : Basic Information</Text>
                        </View>

                        {sectionARows.map((r, i) => (
                            <View key={i} style={s.row}>
                                <View style={[s.cell, s.cellFirstCol, i === 0 && s.cellTop, s.labelCell]}>
                                    <Text>{r.label}</Text>
                                </View>
                                <View style={[s.cell, i === 0 && s.cellTop, s.valueCell]}>
                                    <Text>{displayValue(r.value)}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <CppSections
                        sectionB={d.sectionB}
                        sectionC={d.sectionC}
                        sectionD={d.sectionD}
                    />

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

export default FormDCpp;
