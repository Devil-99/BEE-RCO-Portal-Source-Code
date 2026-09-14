import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Icon,
  Divider,
  Spinner,
} from "@chakra-ui/react";
import { WarningIcon } from "@chakra-ui/icons";
import deloitte_theme from "../../theme";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import instance from "../../api_instance";
import { showToast } from "../../components/toastService";

const PaymentDashboard = () => {
  const navigate = useNavigate();
  const { entity_id, user_id } = useSelector((state) => state.login);
  const [loading, setLoading] = useState(false);

  const loadBillDeskSDK = () => {
    return new Promise((resolve, reject) => {
      if (window.loadBillDeskSdk) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://uat1.billdesk.com/merchant-uat/sdk/dist/"; 
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1️⃣ Call your backend API to initiate BillDesk payment
      const response = await instance.post(`initiate`, {
        user_id: user_id || "USR001",
        entity_id,
        amount: 5900, // can be dynamic from backend
        payment_mode: "ONLINE",
      });

      const { bdOrderId, authToken } = response.data;
      console.log("✅ Payment initiated:", bdOrderId, authToken);

      // 2️⃣ Load the BillDesk SDK
      await loadBillDeskSDK();

      // 3️⃣ Define what happens after payment
      const responseHandler = function (txnResponse) {
        console.log("💳 BillDesk Transaction Response:", txnResponse);

        if (txnResponse?.auth_status === "0300") {
          showToast({
            title: "Payment Successful!",
            description: "Your payment was successfully processed.",
            status: "success",
          });
          navigate("/formpage?type=login");
        } else {
          showToast({
            title: "Payment Failed or Cancelled",
            description: txnResponse?.transaction_error_desc || "Try again later.",
            status: "error",
          });
        }
      };

      // 4️⃣ Launch BillDesk payment checkout
      const config = {
        bdOrderId,
        authToken,
        responseHandler,
        childWindow: true,
      };

      window.loadBillDeskSdk(config);
    } catch (error) {
      console.error("❌ Payment initiation failed:", error);
      showToast({
        title: "Payment Initiation Failed",
        description: error?.response?.data?.detail || "Could not start payment process.",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bg={deloitte_theme.primary}
      px={deloitte_theme.paddingX}
      py={deloitte_theme.paddingY}
    >
      <Heading mb={6} fontSize="1.8rem" fontFamily="Calibri">
        Payment Dashboard
      </Heading>

      <Flex direction={{ base: "column", md: "row" }} gap={6}>
        <div
          style={{
            background: "#fff",
            borderRadius: "1rem",
            padding: "1.5rem",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
            flex: 1,
          }}
        >
          <Flex align="center" gap={3} mb={2}>
            <Icon as={WarningIcon} color={"orange.400"} boxSize={6} />
            <Heading fontSize="lg" color={"orange.400"}>
              Payment Pending
            </Heading>
          </Flex>

          <Text color={deloitte_theme.textSecondary} fontSize="0.8rem" mb={4}>
            Keep track of your payment and application approval status here.
          </Text>

          <Heading fontSize="md" mb={4} color={deloitte_theme.textPrimary}>
            Payment Invoice
          </Heading>

          <table
            style={{ width: "100%", fontSize: "0.8rem", marginBottom: "1rem" }}
          >
            <tbody>
              <tr>
                <td>Amount:</td>
                <td style={{ textAlign: "right" }}>₹5,000</td>
              </tr>
              <tr>
                <td>CGST (9%):</td>
                <td style={{ textAlign: "right" }}>₹450</td>
              </tr>
              <tr>
                <td>SGST (9%):</td>
                <td style={{ textAlign: "right" }}>₹450</td>
              </tr>
              <tr>
                <td colSpan="2">
                  <Divider my={2} />
                </td>
              </tr>
              <tr style={{ fontWeight: "bold" }}>
                <td>Total:</td>
                <td style={{ textAlign: "right" }}>₹5,900</td>
              </tr>
            </tbody>
          </table>

          <Button
            colorScheme="blue"
            width="full"
            onClick={handlePayment}
            fontWeight="bold"
            isDisabled={loading}
          >
            {loading ? <Spinner size="sm" mr={2} /> : null}
            {loading ? "Processing..." : "Make Payment"}
          </Button>
        </div>
      </Flex>
    </Box>
  );
};

export default PaymentDashboard;
