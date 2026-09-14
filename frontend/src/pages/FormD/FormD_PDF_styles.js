/**
 * PDF Style Bridge — thin re-export of values defined in FormD.css.
 * FormD.css is the single source of truth for all design tokens.
 * This file exists only because react-pdf requires StyleSheet.create().
 */
import { StyleSheet } from "@react-pdf/renderer";

const BORDER = "#000000";

export const shared = StyleSheet.create({
    page:                    { padding: 12, backgroundColor: "#FFFFFF" },
    container:               { flex: 1, borderTop: "4px solid #138808", borderLeft: "4px solid #138808", borderRight: "4px solid #2b2e83", borderBottom: "4px solid #2b2e83", paddingLeft: 14, paddingRight: 14, paddingTop: 6, paddingBottom: 6 },
    row:                     { flexDirection: "row", width: "100%" },
    cell:                    { borderTopWidth: 0, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderLeftWidth: 0, borderColor: BORDER, borderStyle: "solid", justifyContent: "center", paddingVertical: 2, paddingHorizontal: 6 },
    cellFirstCol:            { borderLeftWidth: 0.5 },
    cellTop:                 { borderTopWidth: 0.5 },
    headerTitle:             { backgroundColor: "#7030A0", color: "#FFFFFF", fontSize: 18, fontWeight: "bold", textAlign: "center", height: 38, paddingVertical: 5, paddingHorizontal: 10, borderWidth: 0.5, borderColor: BORDER, borderStyle: "solid" },
    sectionAHeader:          { backgroundColor: "#FFD966", fontWeight: "bold", fontSize: 12, textAlign: "left", height: 28, paddingVertical: 4, paddingHorizontal: 8, borderWidth: 0.5, borderColor: BORDER, borderStyle: "solid" },
    labelCell:               { width: "52%", backgroundColor: "#E7E6E6", fontSize: 10, fontWeight: "bold", textAlign: "left", paddingVertical: 4, paddingHorizontal: 6 },
    valueCell:               { width: "48%", backgroundColor: "#FCE4D6", fontSize: 10, fontWeight: "bold", textAlign: "left", paddingVertical: 4, paddingHorizontal: 6 },
    legendSection:           { marginTop: 10 },
    legendTitle:             { margin: 4, paddingBottom: 3, fontSize: 9, fontWeight: "bold", lineHeight: 1, textAlign: "left" },
    legendRow:               { flexDirection: "row", width: "100%" },
    legendCell:              { borderTopWidth: 0, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderLeftWidth: 0, borderColor: BORDER, borderStyle: "solid", paddingVertical: 3, paddingHorizontal: 6, textAlign: "center", fontSize: 8, fontWeight: "bold", lineHeight: 1.2, justifyContent: "center" },
    legendCellFirst:         { borderLeftWidth: 0.5 },
    legendCellTop:           { borderTopWidth: 0.5 },
    legendDisabled:          { backgroundColor: "#ECECEC", width: "52%" },
    legendUser:              { backgroundColor: "#FFFFFF", width: "24%" },
    legendCalculated:        { backgroundColor: "#FCE4D6", width: "24%" },
    undertakingBox:          { borderWidth: 0.5, borderColor: BORDER, borderStyle: "solid", paddingVertical: 8, paddingHorizontal: 10, marginTop: 0 },
    undertakingHeading:      { fontSize: 9, fontWeight: "bold", marginBottom: 5, textAlign: "left" },
    undertakingText:         { fontSize: 8, lineHeight: 1.5, textAlign: "justify", marginBottom: 5 },
    undertakingDesignation:  { marginTop: 5, fontWeight: "bold", fontSize: 9, textAlign: "left" },
    signatureArea:           { height: 50 },
    undertakingSignatureLabel: { fontWeight: "bold", fontSize: 8, textAlign: "left", paddingBottom: 5 },
    sectionHeaderGreen:      { backgroundColor: "#A9D18E", fontWeight: "bold", fontSize: 12, textAlign: "left", height: 28, paddingVertical: 4, paddingHorizontal: 8, borderWidth: 0.5, borderColor: BORDER, borderStyle: "solid" },
    sectionHeaderBlue:       { backgroundColor: "#AEC3E5", fontWeight: "bold", fontSize: 12, textAlign: "left", height: 28, paddingVertical: 4, paddingHorizontal: 8, borderWidth: 0.5, borderColor: BORDER, borderStyle: "solid" },
    sectionHeaderYellow:     { backgroundColor: "#FFD966", fontWeight: "bold", fontSize: 12, textAlign: "left", height: 28, paddingVertical: 4, paddingHorizontal: 8, borderWidth: 0.5, borderColor: BORDER, borderStyle: "solid" },
    columnHeader:            { backgroundColor: "#E7E6E6", fontWeight: "bold", fontSize: 11, height: 24 },
    childRow:                { height: 24 },
    bold:                    { fontWeight: "bold" },
    center:                  { textAlign: "center" },
    right:                   { textAlign: "right", paddingRight: 10 },
    firstRowLabel:           { backgroundColor: "#FFF2CC", fontSize: 10, fontWeight: "bold", textAlign: "left" },
    allPeachLabel:           { backgroundColor: "#E7E6E6", fontSize: 10, textAlign: "left" },
    allPeachValue:           { backgroundColor: "#FCE4D6", textAlign: "right", paddingRight: 10, fontSize: 10, fontWeight: "bold" },
    mixedLabel:              { backgroundColor: "#D9E2F3", fontSize: 10, fontWeight: "normal", textAlign: "left" },
    mixedValue:              { backgroundColor: "#FCE4D6", textAlign: "right", paddingRight: 10, fontSize: 10 },
    greenHighlight:          { backgroundColor: "#C6E0B4", fontWeight: "bold" },
    greenLabel:              { backgroundColor: "#C6E0B4", fontSize: 10, fontWeight: "bold", textAlign: "left" },
    noGreenLabel:            { backgroundColor: "#E7E6E6", fontWeight: "normal" },
    noGreenValue:            { backgroundColor: "#FCE4D6" },
    remainingLabel:          { backgroundColor: "#D9E2F3", fontWeight: "normal" },
    dRegularLabel:           { backgroundColor: "#E7E6E6", fontWeight: "normal" },
    dRegularValue:           { backgroundColor: "#FCE4D6" },
    sup:                     { fontSize: 6 },
    footnote:                { fontSize: 7, color: "#555555", textAlign: "left", marginTop: 3, fontStyle: "italic" },
});
