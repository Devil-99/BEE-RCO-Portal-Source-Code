import React from 'react'
import { Flex, Button } from '@chakra-ui/react'
import deloitte_theme from '../../../theme'

function FormFooter({setActiveTab, activeTab, setIsModalOpen, handleNext, isLastPage, mode}) {
    return (
        <Flex
            justify="space-between"
            py={deloitte_theme.paddingY}
            px={deloitte_theme.paddingX}
            borderTopWidth="1px"
            borderColor="gray.200"
        >
            <Button
                onClick={() =>
                    setActiveTab((prev) => Math.max(0, prev - 1))
                }
                isDisabled={activeTab === 0}
            >
                Back
            </Button>
            {activeTab === isLastPage ? 
                mode === "add" && (
                <Button
                    colorScheme="green"
                    onClick={() => setIsModalOpen(true)}
                >
                    Submit
                </Button>
            ) : (
                <Button colorScheme="green" onClick={handleNext}>
                    Next
                </Button>
            )}
        </Flex>
    )
}

export default FormFooter