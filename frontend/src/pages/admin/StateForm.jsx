import {
  Button,
  Flex,
  Heading,
} from "@chakra-ui/react";
import TableComponent from "../../components/TableComponent";
import deloitte_theme from "../../theme";
import { useState } from "react";
import AddStateModal from "./AddStateModal";
import { useGetStatesQuery } from "../../redux/apiSlices/stateControlApi";

function StateManager() {
    const { data: states = []} = useGetStatesQuery();
    const [addModal, setAddModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const handleRowSelect = (row) => {
    setSelectedRow(row);
    setAddModal(true);
  };

  const handleAddModal = () => {
    setSelectedRow(null);
    setAddModal(true);
  };

  return (
    <Flex direction="column" gap={deloitte_theme.gap}>
      <Flex justifyContent="space-between" alignItems="center">
        <Heading size="md">State Management</Heading>

        <Button
          bg={deloitte_theme.buttonSecondary}
          onClick={handleAddModal}
        >
          Add State
        </Button>
      </Flex>

      <TableComponent
        name="States"
        data={states}
        isFilter
        handleRowSelect={handleRowSelect}
      />

      <AddStateModal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        selectedRow={selectedRow}
      />
    </Flex>
  );
}

export default StateManager;
