import React, { useEffect } from 'react'
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Image,
    useDisclosure,
    Text,
    VStack,
} from '@chakra-ui/react'

import bannerImage from '../assets/BES-Banners-928-x-522px.jpg'

function NewsPopup() {
    const { isOpen, onOpen, onClose } = useDisclosure()

    // Open the notification modal as soon as this component mounts
    useEffect(() => {
        onOpen()
    }, [onOpen])

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="3xl">
            <ModalOverlay />
            <ModalContent>
                {/* <ModalHeader>Notification</ModalHeader> */}
                <ModalCloseButton color="white" />
                <ModalBody p={0}>
                    <Image
                        src={bannerImage}
                        alt="News banner"
                        borderRadius="md"
                        objectFit="cover"
                        w="1000px"
                        h="400px"
                    />
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}

export default NewsPopup