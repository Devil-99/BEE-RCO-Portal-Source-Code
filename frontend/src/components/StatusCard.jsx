import React from "react";
import { Stat, StatLabel, StatNumber, StatHelpText } from "@chakra-ui/react";
import deloitte_theme from "../theme";

const StatusCard = ({
  title,
  value,
  helpText,
  valueColor,
  highlight = false,
  ...rest
}) => {
  const bg = highlight ? deloitte_theme.secondary : deloitte_theme.white;
  const color = highlight ? deloitte_theme.white : deloitte_theme.textPrimary;
  const labelColor = highlight ? deloitte_theme.white : deloitte_theme.textSecondary;
  const numberColor = valueColor || (highlight ? deloitte_theme.black : deloitte_theme.textPrimary);

  return (
    <Stat
      bg={bg}
      color={color}
      px={deloitte_theme.paddingX}
      py={deloitte_theme.paddingY}
      borderRadius="lg"
      boxShadow="md"
      minH="7rem"
      maxW="15rem"
      w="100%"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      borderWidth={highlight ? undefined : "1px"}
      borderColor={highlight ? undefined : deloitte_theme.bordercolor}
      {...rest}
    >
      <StatLabel color={labelColor} fontSize="md" mb={2}>
        {title}
      </StatLabel>

      <StatNumber fontSize="2xl" fontWeight="bold" color={numberColor}>
        {value}
      </StatNumber>

      {helpText ? (
        <StatHelpText color={labelColor}>{helpText}</StatHelpText>
      ) : null}
    </Stat>
  );
};

export default StatusCard;
