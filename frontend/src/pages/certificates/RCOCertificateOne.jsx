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
        marginTop: 35,
    },

    paragraph: {
        fontSize: 15,
        lineHeight: 1.8,
        textAlign: "justify",
    },

    table: {
        marginTop: 35,
        borderWidth: 1,
        borderColor: "#8c8c8c",
    },

    row: {
        flexDirection: "row",
    },

    headerCell: {
        flex: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#8c8c8c",
        padding: 10,
        textAlign: "center",
        fontSize: 11,
        backgroundColor: "#f5f5f5",
    },

    valueCell: {
        flex: 1,
        borderRightWidth: 1,
        borderColor: "#8c8c8c",
        paddingVertical: 16,
        textAlign: "center",
        fontSize: 12,
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

    supportBox: {
        border: "1px solid #8c8c8c",
        padding: 10,
        fontSize: 10,
        width: 210,
    },

    email: {
        color: "#0066cc",
        textDecoration: "underline",
        marginTop: 4,
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
});

const RCOCertificate1 = ({ data }) => (
    <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Image src={RCOLogo} style={styles.leftLogo} />

                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>
                            RCO Compliance Certificate
                        </Text>
                    </View>

                    <Image src={BEELogo} style={styles.rightLogo} />
                </View>

                <View style={styles.body}>
                    <Text style={styles.paragraph}>
                        This is to certify that{" "}
                        {data?.entity_name || "________________"},
                        bearing RCO Registration No.{" "}
                        {data?.registration_no || "________________"},
                        had obligated energy consumption of{" "}
                        {data?.energy_consumption || "____"} MU during
                        FY {data?.financial_year || "20__-__"},
                        corresponding to an RCO target of{" "}
                        {data?.rco_target_percentage || "29.91"}%
                        i.e. {data?.rco_target_mu || "____"} MU,
                        and has duly fulfilled its Renewable
                        Consumption Obligation (RCO) for the said
                        financial year through below mechanisms as
                        per RCO notification dt 27th Sept’2025:
                    </Text>

                </View>

                {/* Table */}
                <View style={styles.table}>
                    <View style={styles.row}>
                        <Text style={styles.headerCell}>
                            RCO Target (MU)
                        </Text>

                        <Text style={styles.headerCell}>
                            Renewable Energy Procurement (MU)
                        </Text>

                        <Text style={styles.headerCell}>
                            Renewable Energy Certificates (MU)
                        </Text>

                        <Text style={styles.headerCell}>
                            RCO Buyout (MU)
                        </Text>

                        <Text style={styles.headerCell}>
                            RCO Compliance (MU)
                        </Text>

                        <Text
                            style={[
                                styles.headerCell,
                                { borderRightWidth: 0 },
                            ]}
                        >
                            RCO Compliance (%)
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.valueCell}>
                            {data?.rco_target || "XX.XXX"}
                        </Text>

                        <Text style={styles.valueCell}>
                            {data?.procurement || "XX.XXX"}
                        </Text>

                        <Text style={styles.valueCell}>
                            {data?.rec || "XX.XXX"}
                        </Text>

                        <Text style={styles.valueCell}>
                            {data?.buyout || "XX.XXX"}
                        </Text>

                        <Text style={styles.valueCell}>
                            {data?.compliance || "XX.XXX"}
                        </Text>

                        <Text
                            style={[
                                styles.valueCell,
                                { borderRightWidth: 0 },
                            ]}
                        >
                            {data?.compliance_percentage ||
                                "XX.XX"}
                        </Text>
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
                        Note: This is a system-generated certificate and does not
                        require any physical or digital signature.
                    </Text>
                </View>
            </View>
        </Page>
    </Document>
);

export default RCOCertificate1;