import { Box, Icon } from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import deloitte_theme from "../theme"
const StepIcon = ({ isCompleted, height, width }) => {
  // The completed state: a solid green circle with a white checkmark
  if (isCompleted) {
    return (
      <Box
        bg ={`${deloitte_theme.ternary}`}
        borderRadius="full"
        boxSize="22px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        width={`${width}`}
        height={`${height}`}
        transition="all 0.3s ease-in-out" // Smooth transition for background and transform
      >
        <Icon as={CheckIcon} color="white" boxSize="12px" />
      </Box>
    );
  }

  // The default state: a green dotted circle
  return (
    <Box
      border="2px dotted"
      borderColor={deloitte_theme.ternary}
      borderRadius="full"
      boxSize="22px"
      width={`${width}`}
      height={`${height}`}
      transition="all 0.3s ease-in-out" // Smooth transition for border and color
    />
  );
};

export default StepIcon;
