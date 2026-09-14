import React from "react";
import { Stat, StatLabel, StatNumber } from "@chakra-ui/react";
import deloitte_theme from "../../../theme";


const VARIANT_STYLES = {
  default: {
    bg: deloitte_theme.white,
    color: deloitte_theme.textPrimary,
    borderWidth: "1px",
    borderColor: deloitte_theme.bordercolor,
    labelColor: deloitte_theme.textSecondary,
    numberColor: deloitte_theme.textPrimary,
  },
  success: {
    bg: deloitte_theme.secondary,
    color: deloitte_theme.white,
    labelColor: "blackAlpha.800",
    numberColor: deloitte_theme.black,
  },
};

const StatsCards = ({ title, value, variant = "default" }) => {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.default;

  return (
    <Stat
      bg={styles.bg}
      color={styles.color}
      px={deloitte_theme.paddingX}
      py={5}
      borderRadius="lg"
      boxShadow="md"
      minH="7rem"
      w="100%" 
      display="flex"
      flexDirection="column"
      justifyContent="center"
      {...(styles.borderWidth && {
        borderWidth: styles.borderWidth,
        borderColor: styles.borderColor,
      })}
    >
      <StatLabel
        color={styles.labelColor}
        fontSize="sm"
        mb={2}
      >
        {title}
      </StatLabel>

      <StatNumber
        fontSize="2xl"
        fontWeight="bold"
        color={styles.numberColor}
      >
        {value}
      </StatNumber>
    </Stat>
  );
};

export default StatsCards;