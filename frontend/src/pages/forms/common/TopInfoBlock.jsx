import { Grid, GridItem, Text, Box, Divider } from "@chakra-ui/react";
import { useSectorName, useStateName } from "../../../Hooks/useLookUp";
import deloitte_theme from "../../../theme";

export default function TopInfoBlock({
  org_name,
  entity_registration_number,
  pat_number,
  sector_type,
  address,
  state,
  fyLabel,
  periodLabel,
}) {
  const getSectorName = useSectorName();
  const getStateName = useStateName();

  const Label = ({ children }) => (
    <Text fontWeight="semibold" color={deloitte_theme.ternary}>
      {children}
    </Text>
  );

  const Value = ({ children }) => (
    <Text color={deloitte_theme.textPrimary}>{children || "—"}</Text>
  );

  return (
    <Box
      bg={deloitte_theme.primary}
      p={deloitte_theme.paddingX}
      borderBottom="1px dashed gray"
    >
      <Grid
        templateColumns={{ base: "1fr", md: "1fr 1fr" }}
        gap={8}
        fontSize="sm"
      >
        {/* LEFT BLOCK */}
        <GridItem>
          <Grid templateColumns="220px 15px 1fr" rowGap={deloitte_theme.gap}>
            <Label>Obligated Designated Consumer</Label>
            <Text>:</Text>
            <Value>{org_name}</Value>

            <Label>Registration Number</Label>
            <Text>:</Text>
            <Value>{entity_registration_number}</Value>

            <Label>PAT Registration Number</Label>
            <Text>:</Text>
            <Value>{pat_number}</Value>

            <Label>Energy Intensive Sector</Label>
            <Text>:</Text>
            <Value>{getSectorName(sector_type)}</Value>
          </Grid>
        </GridItem>

        {/* RIGHT BLOCK */}
        <GridItem>
          <Grid templateColumns="150px 15px 1fr" rowGap={deloitte_theme.gap}>
            <Label>Address</Label>
            <Text>:</Text>
            <Value>
              {address}, {getStateName(state)}
            </Value>

            <Label>State</Label>
            <Text>:</Text>
            <Value>
              {getStateName(state)}
            </Value>

            <Label>Target Year (FY)</Label>
            <Text>:</Text>
            <Value>{fyLabel}</Value>

            <Label>Compliance Period</Label>
            <Text>:</Text>
            <Value>{periodLabel}</Value>

          </Grid>
        </GridItem>
      </Grid>
    </Box>
  );
}
