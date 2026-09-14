import React from 'react'
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverBody, Button, Text, Flex, Link, Divider } from "@chakra-ui/react";
import deloitte_theme from '../theme';
import CircularIcon from './CircularIcon';

import { BiSupport } from "react-icons/bi";
import { MdEmail, MdPhone, MdOutlineHelp } from "react-icons/md";
import { HiDocument } from "react-icons/hi2";
import { FaMobileAlt } from "react-icons/fa";

function SupportComponent({ isLoggedIn }) {
    const navigate = useNavigate();

    return (
        <Popover placement="bottom-start">
            <PopoverTrigger>
                <Button
                    variant="ghost"
                    fontWeight="normal"
                    size="lg"
                    px={0}
                    display="flex"
                    alignItems="center"
                    gap={2}
                    aria-label="Support"
                    title="Support"
                    sx={{
                        _focus: { boxShadow: "none", backgroundColor: "transparent" },
                        _active: { backgroundColor: "transparent" },
                        _hover: { backgroundColor: "transparent" },
                    }}
                >
                    <CircularIcon bg={deloitte_theme.buttonHoverTernary}>
                        <BiSupport className="w-4 h-4 text-white" />
                    </CircularIcon>
                    <Text fontSize="lg" fontWeight="normal">Support</Text>
                </Button>
            </PopoverTrigger>

            <PopoverContent w="350px" p={deloitte_theme.paddingY} sx={deloitte_theme.glass}>
                <PopoverArrow />
                <PopoverBody fontSize="md">
                    <Flex direction="column" align="start" gap={1}>
                        <div className='flex flex-col gap-1'>
                            <Text className="font-bold">
                                For any support, kindly reach at -
                            </Text>

                            <div className="flex items-center gap-2">
                                <MdEmail className="text-blue-300 text-lg" />
                                <Text>Email : RCO.support@beeindia.gov.in</Text>
                            </div>

                            <div className="flex items-center gap-2">
                                <MdPhone className="text-green-300 text-lg" />
                                <Text>Contact : +91(11)26766750, 26766700</Text>
                            </div>

                            <div className="flex items-center gap-2">
                                <FaMobileAlt className="text-white text-lg" />
                                <Text>Secondary Contact : +91 8796046137</Text>
                            </div>
                        </div>

                    </Flex>
                </PopoverBody>
            </PopoverContent>
        </Popover>
    )
}

export default SupportComponent