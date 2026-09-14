import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Text
} from '@chakra-ui/react';

function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure you want to proceed with this action?",
    message = "This change cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmColor = "green",
    cancelColor = "gray",
    isLoading = false,
}) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent maxW="400px" mx="auto">
                <ModalHeader>{title}</ModalHeader>
                <ModalBody>
                    <Text>{message}</Text>
                </ModalBody>
                <ModalFooter>
                    <Button colorScheme={cancelColor} mr={3} onClick={onClose}>
                        {cancelText}
                    </Button>
                    <Button
                        colorScheme={confirmColor}
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        {confirmText}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default ConfirmModal;
