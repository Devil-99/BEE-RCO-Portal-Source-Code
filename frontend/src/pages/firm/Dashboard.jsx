import { Flex } from "@chakra-ui/react"
import EntityDetailCard from "../../components/EntityDetailCard";
import deloitte_theme from "../../theme";

function Dashboard() {
    return (
        <Flex direction={"column"} gap={deloitte_theme.gap} >
            <EntityDetailCard />
        </Flex>
    )
}

export default Dashboard
