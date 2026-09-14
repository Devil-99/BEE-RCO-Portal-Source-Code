import React, { useEffect } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  Text,
  Box
} from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import bellIcon from "../assets/navbar_images/bels.png";
import deloitte_theme from '../theme';

function NotificationPopover({ isOpen, onOpen, onClose }) {
  const { pendingFormStatus } = useSelector((state) => state.formState);

  return (
    <Popover
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      placement="bottom-end"
      closeOnBlur
    >
      <PopoverTrigger>
        <Box position="relative" cursor="pointer">
          <img src={bellIcon} alt="Notifications" className="w-8 h-8" />
          {pendingFormStatus.length > 0 && (
            <Box
              position="absolute"
              top="-4px"
              right="-4px"
              bg="red.500"
              color="white"
              fontSize="xs"
              fontWeight="bold"
              rounded="full"
              w="18px"
              h="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {pendingFormStatus.length}
            </Box>
          )}
        </Box>
      </PopoverTrigger>

      <PopoverContent
        w="25vw"
        maxH="50vh"
        p={2}
        sx={deloitte_theme.glass}
      >
        <PopoverArrow bg="rgba(150, 150, 150, 0.5)" />
        <PopoverCloseButton />
        <PopoverHeader fontWeight="semibold">Notifications</PopoverHeader>
        <PopoverBody overflowY="auto">
          {pendingFormStatus.length > 0 ? (
            pendingFormStatus.map((form, index) => (
              <Text key={index} mb={2}>
                You have pending action on <b>{form.entity_name}</b>.
              </Text>
            ))
          ) : (
            <Text>No new notifications yet! 🎉</Text>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationPopover;
