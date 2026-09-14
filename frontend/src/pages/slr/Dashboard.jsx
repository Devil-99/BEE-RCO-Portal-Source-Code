import { Box, Flex } from "@chakra-ui/react"
import EntityDetailCard from "../../components/EntityDetailCard";
import SubmissionDetails from "./SubmissionDetails";
import deloitte_theme from "../../theme";

function Dashboard() {
    return (
        <Flex direction={"column"} gap={deloitte_theme.gap} >
            <EntityDetailCard />
            <Box bg="white" border="1px solid" borderColor={deloitte_theme.bordercolor} padding={deloitte_theme.paddingX}>
                <SubmissionDetails />
            </Box>
        </Flex>
    )
}

export default Dashboard