import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
} from "@react-pdf/renderer";

// Import your logos
import RCOLogo from "../../assets/pageheader_images/RCO Logo.png";
import BEELogo from "../../assets/images/BEE_logo.png";

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 12,
    fontFamily: "Helvetica"
  },

  container: {
    width: "100%",
    border: "1px dotted gray",
    padding: 20
  },

  header: {
    alignItems: "center",
    marginBottom: 20
  },

  logo: {
    height: 80,
    width: "auto"
  },

  title: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10
  },

  subTitle: {
    textAlign: "center",
    fontSize: 22,
    marginTop: 20,
    color: "green"
  },

  detailsSection: {
    marginTop: 40,
    gap: 8
  },

  detailsRow: {
    flexDirection: "row",
    width: "100%"
  },

  detailTitle: {
    width: "50%",
    backgroundColor: "#dedede",
    paddingVertical: 10,
    paddingHorizontal: 15,
    textAlign: "left"
  },

  detailValue: {
    width: "50%",
    border: "1px solid silver",
    paddingVertical: 10,
    paddingHorizontal: 15,
    textAlign: "right"
  },

  footer: {
    marginTop: 50,
    textAlign: "center",
    fontSize: 11
  },

  footerSubSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    alignItems: "center"
  },

  supportText: {
    width: "60%",
    gap: 2
  },

  footerLogo: {
    height: 45,
    width: "auto"
  }
});

const getStatusColor = (status) => {
  if (status === "SUCCESS") return "green";
  if (status === "FAILED") return "red";
  return "black";
};

const ReceiptPDF = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.container}>

        {/* Header Logo */}
        <View style={styles.header}>
          <Image src={RCOLogo} style={styles.logo} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Payment Receipt</Text>

        {/* Sub Title */}
        <Text
          style={[
            styles.subTitle,
            { color: getStatusColor(data.status) }
          ]}
        >
          Your Payment for Entity Registration is {data.status}
        </Text>

        {/* Details Section */}
        <View style={styles.detailsSection}>

          <View style={styles.detailsRow}>
            <Text style={styles.detailTitle}>Entity Registration Number :</Text>
            <Text style={styles.detailValue}>{data.entity_registration_number}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailTitle}>Order ID :</Text>
            <Text style={styles.detailValue}>{data.order_id}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailTitle}>Transaction ID :</Text>
            <Text style={styles.detailValue}>{data.transaction_id}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailTitle}>Amount :</Text>
            <Text style={styles.detailValue}>{data.amount}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailTitle}>Bank Reference Number :</Text>
            <Text style={styles.detailValue}>{data.bank_ref_number}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailTitle}>Receipt Identification Number :</Text>
            <Text style={styles.detailValue}>{data.challan_number}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailTitle}>Payment Method :</Text>
            <Text style={styles.detailValue}>{data.payment_mode}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailTitle}>Transaction Date :</Text>
            <Text style={styles.detailValue}>{data.transaction_date}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailTitle}>BEE PAN No. :</Text>
            <Text style={styles.detailValue}>AAAAE0631J</Text>
          </View>

        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a system generated receipt.</Text>

          <View style={styles.footerSubSection}>

            <View style={styles.supportText}>
              <Text>For any support, kindly reach at -</Text>
              <Text>Email - RCO.support@beeindia.gov.in</Text>
              <Text>Contact - +91(11)26766750, 26766700</Text>
            </View>

            <Image src={BEELogo} style={styles.footerLogo} />

          </View>
        </View>

      </View>
    </Page>
  </Document>
);

export default ReceiptPDF;
