import { useParams } from "react-router-dom";
import { useGetPaymentDetailsQuery } from "../../redux/apiSlices/trackStatusApi";
import {
  Flex,
  Box,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftAddon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Spinner,
} from "@chakra-ui/react";

import deloitte_theme from "../../theme";
import { FaFilePdf } from "react-icons/fa";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ReceiptPDF from "./ReceiptPDF";
import failurePaymentImg from "../../assets/status/payment_failed.png";

function PaymentFailurePage() {
  const { order_id } = useParams();
  const { data: paymentDetails, isLoading } = useGetPaymentDetailsQuery(order_id);

  const invoiceFields = [
    { label: "Transaction ID", key: "transaction_id" },
    { label: "Order ID", key: "order_id" },
    { label: "Receipt Identification Number", key: "challan_number" },
    { label: "Transaction Date", key: "transaction_date" },
    { label: "Payment Mode", key: "payment_mode" },
    { label: "Amount", key: "amount" },
    { label: "Status", key: "status" }
  ];

  return (
    <Flex
      w="full"
      h="75vh"
      justifyContent="space-evenly"
      alignItems="top"
      gap={deloitte_theme.gap}
    >
      {/* Left Image */}
      <Flex w="45%" h="full" justifyContent="center" alignItems="center">
        <img
          src={failurePaymentImg}
          alt="Payment Failed"
          style={{
            width: "100%",
            maxWidth: "600px",
            height: "auto",
            objectFit: "contain",
          }}
        />
      </Flex>

      {/* Right Section */}
      <Flex
        w="55%"
        overflowY={"auto"}
        direction="column"
        gap={deloitte_theme.gap}
        p={deloitte_theme.paddingX}
      >
        <Heading as="h2" size="lg" color="red.500">
          Payment Unsuccessful
        </Heading>

        <Text>
          {paymentDetails?.reason || "Your payment has failed."} Kindly refer below for more details.
        </Text>

        {isLoading ? (
          <Spinner />
        ) : (
          <Flex w="full" direction="column" gap={deloitte_theme.gap}>
            <Accordion defaultIndex={[0]} allowMultiple>
              <AccordionItem>
                <AccordionButton>
                  <Box as="span" flex="1" textAlign="left">
                    Payment Invoice
                  </Box>
                  <AccordionIcon />
                </AccordionButton>

                <AccordionPanel>
                  <Flex
                    justifyContent="space-between"
                    gap={deloitte_theme.gap}
                    px={deloitte_theme.paddingX}
                  >
                    <Flex direction="column" w="full">
                      {invoiceFields.map(({ label, key }) => {
                        const value = paymentDetails?.[key];

                        return (
                          <InputGroup key={key}>
                            <InputLeftAddon w="40%">
                              {label} :
                            </InputLeftAddon>

                            <Input
                              value={
                                key === "amount"
                                  ? `₹${value || 0}`
                                  : value || "-"
                              }
                              isReadOnly
                              textAlign="right"
                              bg={
                                key === "status"
                                  ? "red.100"
                                  : deloitte_theme.lightGray
                              }
                              color={
                                key === "status"
                                  ? "red.600"
                                  : "inherit"
                              }
                              p={deloitte_theme.paddingY}
                            />
                          </InputGroup>
                        );
                      })}
                      <InputGroup>
                        <InputLeftAddon w="40%">BEE PAN No. :</InputLeftAddon>
                        <Input value={"AAAAE0631J"} isReadOnly textAlign="right" bg={deloitte_theme.lightGray} p={deloitte_theme.paddingY} />
                      </InputGroup>
                    </Flex>

                    {/* PDF Button */}
                    {paymentDetails?.order_id && (
                      <Flex
                        direction="column"
                        justifyContent="end"
                        alignItems="center"
                        gap={deloitte_theme.gap}
                        p={deloitte_theme.paddingY}
                      >
                        <PDFDownloadLink
                          document={<ReceiptPDF data={paymentDetails} />}
                          fileName={`receipt_${paymentDetails?.order_id}.pdf`}
                          style={{ textDecoration: "none" }}
                        >
                          {({ loading }) => (
                            <Box
                              bg="red.500"
                              color={deloitte_theme.white}
                              p={deloitte_theme.paddingY}
                              borderRadius="100%"
                              cursor="pointer"
                              _hover={{ bg: "red.600" }}
                            >
                              {loading ? (
                                <Spinner size="sm" />
                              ) : (
                                <FaFilePdf size={25} />
                              )}
                            </Box>
                          )}
                        </PDFDownloadLink>
                      </Flex>
                    )}
                  </Flex>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

export default PaymentFailurePage;
