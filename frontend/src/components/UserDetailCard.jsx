import React, { useState } from 'react'
import { useSelector } from 'react-redux';
import { Flex, Stack, Text, Divider, Badge, Button, Input, IconButton } from '@chakra-ui/react'
import { EditIcon } from "@chakra-ui/icons";
import deloitte_theme from '../theme';
import { useUpdateUserDetailsMutation } from "../redux/apiSlices/Admin/RbacApi";
import { showToast } from './toastService';

function UserDetailCard({ userDetails }) {
    const { user_id, role_code, entity_type } = useSelector(state => state.login || {});
    const isSelf = userDetails?.id === user_id;
    const headerName = entity_type === "DISCOM" && userDetails?.role_name === "Plant Head"
        ? "MD/CMD"
        : userDetails?.role_name || 'User';

    const [updateUserDetails, { isLoading: updatingUserDetails }] = useUpdateUserDetailsMutation();
    const [editFlag, setEditFlag] = useState(false);
    const [updatedUserDetails, setUpdatedUserDetails] = useState({
        mobile: "",
        primary_email: "",
        secondary_email: ""
    });
    const handleEdit = (user) => {
        setEditFlag(true);
        setUpdatedUserDetails({
            mobile: user.mobile || "",
            primary_email: user.primary_email || "",
            secondary_email: user.secondary_email || ""
        });
    }
    const handleSaveEdit = async (userId) => {
        let unchanged;
        if (updatedUserDetails.mobile === userDetails.mobile && updatedUserDetails.primary_email === userDetails.primary_email && updatedUserDetails.secondary_email === userDetails.secondary_email) {
            unchanged = true;
        }
        if (unchanged) {
            showToast({
                title: "No changes detected",
                status: "info",
            });
            return;
        }
        try {
            await updateUserDetails({ user_id: userId, updatedDetails: updatedUserDetails }).unwrap();
            setEditFlag(false);
        } catch (error) {
            console.error("Error updating user details:", error);
        }
    }
    const handleCancelEdit = () => {
        setEditFlag(false);
        setUpdatedUserDetails({
            primary_email: "",
            secondary_email: "",
            mobile: "",
        });
    };

    return (
        <Stack
            p={deloitte_theme.paddingX}
            mr={isSelf ? 20 : 0}
            spacing={deloitte_theme.gap}
            minW="20vw"
            bg={isSelf ? deloitte_theme.primary : deloitte_theme.white}
            border={isSelf && "1px dotted"}
            borderColor={deloitte_theme.secondary}
            shadow="md"
            borderRadius="md"
        >
            <Flex justifyContent="space-between" alignItems="center">
                <Badge
                    colorScheme="green"
                    fontSize="md"
                    w="fit-content"
                    pr={deloitte_theme.paddingX}
                    py={1}
                    borderRadius="md"
                    borderRight={"1px solid"}
                    borderBottom={"1px solid"}
                    borderColor={deloitte_theme.buttonPrimary}
                    shadow="sm"
                >
                    {headerName}
                </Badge>
                {!isSelf && role_code === 'SLR' && !editFlag &&
                    < IconButton
                        icon={<EditIcon />}
                        size="sm"
                        aria-label="Edit Entity"
                        onClick={() => handleEdit(userDetails)}
                    />
                }
            </Flex>

            <Text fontSize="sm" color={deloitte_theme.textPrimary}>
                <strong>Full Name:</strong> {userDetails?.full_name || 'N/A'}
            </Text>

            <Text fontSize="sm" color={deloitte_theme.textPrimary}>
                <strong>Username:</strong> {userDetails?.username || 'N/A'}
            </Text>

            <Flex gap={1} alignItems="center">
                <Text fontSize="sm" fontWeight="bold" color={deloitte_theme.textPrimary}>Mobile: </Text>
                {
                    editFlag ? (
                        <Input
                            name="mobile"
                            type="text"
                            size="sm"
                            rounded="md"
                            value={updatedUserDetails.mobile}
                            onChange={(e) => setUpdatedUserDetails({ ...updatedUserDetails, mobile: e.target.value })}
                        />
                    ) : (
                        <Text fontSize="sm" color={deloitte_theme.textPrimary}>
                            {userDetails?.mobile || 'N/A'}
                        </Text>
                    )
                }
            </Flex>

            <Flex gap={1} alignItems="center" flexWrap="nowrap">
                <Text
                    as="span"
                    fontSize="sm"
                    fontWeight="bold"
                    color={deloitte_theme.textPrimary}
                    whiteSpace="nowrap"
                >
                    Primary Email:
                </Text>
                {
                    editFlag ? (
                        <Input
                            name="primary_email"
                            type="text"
                            size="sm"
                            rounded="md"
                            flex="1"
                            minW="0"
                            value={updatedUserDetails.primary_email}
                            onChange={(e) => setUpdatedUserDetails({ ...updatedUserDetails, primary_email: e.target.value })}
                        />
                    ) : (
                        <Text as="span" fontSize="sm" color={deloitte_theme.textPrimary}>
                            {userDetails?.primary_email || 'N/A'}
                        </Text>
                    )
                }
            </Flex>

            <Flex gap={1} alignItems="center">
                <Text
                    as="span"
                    fontSize="sm"
                    fontWeight="bold"
                    color={deloitte_theme.textPrimary}
                    whiteSpace="nowrap"
                >
                    Secondary Email:
                </Text>
                {
                    editFlag ? (
                        <Input
                            name="secondary_email"
                            type="text"
                            size="sm"
                            rounded="md"
                            flex="1"
                            minW="0"
                            value={updatedUserDetails.secondary_email}
                            onChange={(e) => setUpdatedUserDetails({ ...updatedUserDetails, secondary_email: e.target.value })}
                        />
                    ) : (
                        <Text fontSize="sm" color={deloitte_theme.textPrimary}>
                            {userDetails?.secondary_email || 'N/A'}
                        </Text>
                    )
                }
            </Flex>

            {
                editFlag && (
                    <Flex gap={2} pt={2}>
                        <Button
                            size="sm"
                            colorScheme="green"
                            isLoading={updatingUserDetails}
                            onClick={() => handleSaveEdit(userDetails?.id)}
                        >
                            Save
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                        >
                            Cancel
                        </Button>
                    </Flex>
                )}
        </Stack>
    )
}

export default UserDetailCard
