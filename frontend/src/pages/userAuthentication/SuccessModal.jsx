import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Link,
    VStack,
    Text
} from '@chakra-ui/react';

function SuccessModal({ response, isOpen, onClose }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent maxW="500px" mx="auto">
                <ModalHeader color="green">Thank you for submitting your application!</ModalHeader>
                <ModalBody>
                    <VStack spacing={3} align="start">
                        <Text fontSize="md">
                            {response?.message}
                        </Text>
                        {
                            response?.username ?
                                <Text fontSize="md">
                                    You can login with your generated username - <h2><b>{response.username}</b></h2>
                                    The password has been sent to your registered mobile number.
                                </Text>
                                :
                                <Text fontSize="sm" color="gray.600">
                                    You can track your application status via <span className='text-gray-800 font-medium'>Track Status</span> above.
                                </Text>
                        }
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Link color="blue.500" sx={{ textDecoration: 'underline' }} href='/'>
                        Go to Home
                    </Link>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}

export default SuccessModal