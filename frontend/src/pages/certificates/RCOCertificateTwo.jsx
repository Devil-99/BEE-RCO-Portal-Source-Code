import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from "@react-pdf/renderer";

import RCOLogo from "../../assets/pageheader_images/RCO Logo.png";
import BEELogo from "../../assets/images/BEE_logo.png";

const COL = 53;

const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontFamily: "Helvetica",
        fontSize: 12,
    },

    container: {
        flex: 1,
        borderTop: "4px solid #138808",
        borderLeft: "4px solid #138808",
        borderRight: "4px solid #2b2e83",
        borderBottom: "4px solid #2b2e83",
        paddingLeft: 25,
        paddingRight: 25,
        paddingTop: 25,
        paddingBottom: 15,
        position: "relative",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    leftLogo: {
        width: 130,
        height: 50,
    },

    rightLogo: {
        width: 150,
        height: 55,
    },

    titleContainer: {
        flex: 1,
        alignItems: "center",
    },

    title: {
        fontSize: 22,
        fontWeight: "bold",
    },

    body: {
        marginTop: 30,
    },

    paragraph: {
        fontSize: 14,
        lineHeight: 1.7,
        textAlign: "justify",
    },

    footer: {
        marginTop: "auto",
        paddingTop: 20,
    },
    footerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    date: {
        fontSize: 13,
    },

    note: {
        marginTop: 15,
        fontSize: 11,
        fontStyle: "italic",
        marginBottom: 5,
    },

    supportBox: {
        border: "1px solid gray",
        padding: 10,
        fontSize: 10,
        width: 220,
    },
    email: {
        color: "#0066cc",
        textDecoration: "underline",
        marginTop: 4,
    },

    table: {
        marginTop: 25,
        borderWidth: 1,
        borderColor: "#8c8c8c",
    },

    row: {
        flexDirection: "row",
    },

    groupTop: {
        height: 38,
        justifyContent: "center",
        alignItems: "center",
        borderBottomWidth: 1,
        borderRightWidth: 1,
        borderColor: "#8c8c8c",
        backgroundColor: "#f5f5f5",
        padding: 2,
        fontSize: 8,
        textAlign: "center",
    },

    groupTopLast: {
        height: 38,
        justifyContent: "center",
        alignItems: "center",
        borderBottomWidth: 1,
        borderColor: "#8c8c8c",
        backgroundColor: "#f5f5f5",
        padding: 2,
        fontSize: 8,
        textAlign: "center",
    },

    groupText: {
        fontSize: 7,
        textAlign: "center",
    },

    spanCell: {
        height: 68,
        justifyContent: "center",
        alignItems: "center",
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#8c8c8c",
        backgroundColor: "#f5f5f5",
        padding: 2,
    },

    subCell: {
        width: COL,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#8c8c8c",
        backgroundColor: "#f5f5f5",
        padding: 2,
        fontSize: 8,
        textAlign: "center",
    },

    subCellLast: {
        width: COL,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
        borderBottomWidth: 1,
        borderColor: "#8c8c8c",
        backgroundColor: "#f5f5f5",
        padding: 2,
        fontSize: 8,
        textAlign: "center",
    },

    valueCell: {
        width: COL,
        height: 25,
        justifyContent: "center",
        alignItems: "center",
        borderRightWidth: 1,
        borderColor: "#8c8c8c",
        padding: 2,
        fontSize: 9,
        textAlign: "center",
    },


});

const RCOCertificate2 = ({ data }) => (
    <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Image src={RCOLogo} style={styles.leftLogo} />

                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>
                            RCO Compliance Certificate
                        </Text>
                    </View>

                    <Image src={BEELogo} style={styles.rightLogo} />
                </View>

                {/* Body */}
                <View style={styles.body}>
                    <Text style={styles.paragraph}>
                        This is to certify that{" "}
                        {data?.entity_name || "________________"},
                        {" "}bearing RCO Registration No.{" "}
                        {data?.registration_no || "____________________"},
                        {" "}had obligated energy consumption of{" "}
                        {data?.energy_consumption || "____"} MU during FY{" "}
                        {data?.financial_year || "20__-__"},
                        {" "}corresponding to an RCO target of{" "}
                        {data?.rco_target_percentage || "29.91"}%
                        {" "}i.e.{" "}
                        {data?.rco_target_mu || "____"} MU, and has duly fulfilled its
                        Renewable Consumption Obligation (RCO) for the said financial year
                        through below mechanisms as per RCO notification dt 27th Sept’2025:
                    </Text>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    <View style={styles.row}>
                        {/* RCO Target (MU) — 4 columns */}
                        <View style={{ width: COL * 4, flexDirection: "column" }}>
                            <Text style={styles.groupTop}>RCO Target (MU)</Text>
                            <View style={styles.row}>
                                <Text style={styles.subCell}>Wind</Text>
                                <Text style={styles.subCell}>Hydro</Text>
                                <Text style={styles.subCell}>Other RE</Text>
                                <Text style={styles.subCell}>Distributed RE</Text>
                            </View>
                        </View>

                        {/* RE Procurement (MU) — 4 columns */}
                        <View style={{ width: COL * 4, flexDirection: "column" }}>
                            <Text style={styles.groupTop}>Renewable Energy Procurement (MU)</Text>
                            <View style={styles.row}>
                                <Text style={styles.subCell}>Wind</Text>
                                <Text style={styles.subCell}>Hydro</Text>
                                <Text style={styles.subCell}>Other RE</Text>
                                <Text style={styles.subCell}>Distributed RE</Text>
                            </View>
                        </View>

                        {/* RE Certificates (MU) — spans both rows, no borderBottom */}
                        <View style={[styles.spanCell, { width: COL }]}>
                            <Text style={styles.groupText}>Renewable Energy Certificates (MU)</Text>
                        </View>

                        {/* RCO Buyout — spans both rows, no borderBottom */}
                        <View style={[styles.spanCell, { width: COL}]}>
                            <Text style={styles.groupText}>RCO Buyout</Text>
                        </View>

                        {/* RCO Compliance (MU) — 2 columns */}
                        <View style={{ width: COL * 2, flexDirection: "column" }}>
                            <Text style={styles.groupTop}>RCO Compliance (MU)</Text>
                            <View style={styles.row}>
                                <Text style={[styles.subCell, { fontSize: 7, lineHeight: 1.4 }]}>Wind + Hydro + Other RE</Text>
                                <Text style={styles.subCell}>DRE</Text>
                            </View>
                        </View>

                        {/* RCO Compliance (%) — 2 columns, last group */}
                        <View style={{ width: COL * 2, flexDirection: "column" }}>
                            <Text style={styles.groupTopLast}>RCO Compliance (%)</Text>
                            <View style={styles.row}>
                                <Text style={[styles.subCell, { fontSize: 7, lineHeight: 1.4 }]}>Wind + Hydro + Other RE</Text>
                                <Text style={styles.subCellLast}>DRE</Text>
                            </View>
                        </View>
                    </View>

                    {/* Values Row */}
                    <View style={styles.row}>
                        {[
                            data?.target_wind,
                            data?.target_hydro,
                            data?.target_other_re,
                            data?.target_dre,
                            data?.procurement_wind,
                            data?.procurement_hydro,
                            data?.procurement_other_re,
                            data?.procurement_dre,
                            data?.renewable_energy_certificates,
                            data?.rco_buyout,
                            data?.compliance_who_re_mu,
                            data?.compliance_dre_mu,
                            data?.compliance_who_re_percent,
                            data?.compliance_dre_percent,
                        ].map((value, i) => (
                            <Text
                                key={i}
                                style={[styles.valueCell, i === 13 && { borderRightWidth: 0 }]}
                            >
                                {value ?? "XX.XXX"}
                            </Text>
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerTop}>
                        <Text style={styles.date}>
                            Date: {data?.date || "DD/MM/YYYY"}
                        </Text>

                        <View style={styles.supportBox}>
                            <Text>
                                For any support, kindly reach at:
                            </Text>

                            <Text style={styles.email}>
                                rco.support@beeindia.gov.in
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.note}>
                        Note: This is a system-generated certificate and
                        does not require any physical or digital signature.
                    </Text>
                </View>
            </View>
        </Page>
    </Document>
);

export default RCOCertificate2;