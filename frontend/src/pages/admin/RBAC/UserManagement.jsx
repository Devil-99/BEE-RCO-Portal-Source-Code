import React, { useState} from "react";
import {
    Box,
    Flex,
    Heading,
    Button,
    Divider,
    FormControl,
    FormLabel,
    Input,
    Select,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import deloitte_theme from "../../../theme";
import TableComponent from "../../../components/TableComponent";
import { useGetRolesQuery, useGetUserListQuery, useCreateUserMutation } from "../../../redux/apiSlices/Admin/RbacApi";
import { showToast } from "../../../components/toastService";
import { isValidEmail, isValidMobile } from "../../../utils/validation";

function UserManagement() {
    const [viewAddUser, setViewAddUser] = useState(false);

    const { data: roles, isLoading: loadingRoles } = useGetRolesQuery();
    const { data: users = [], isLoading: loadingUsers } = useGetUserListQuery();
    const [createUser, { isLoading: creating }] = useCreateUserMutation();

    const [formData, setFormData] = useState({
        full_name: "",
        primary_email: "",
        secondary_email: "",
        mobile: "",
        role_code: "",
        designation: "Energy Manager",
    });

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        const val = type === "file" ? files[0] : value;
        setFormData((prev) => ({ ...prev, [name]: val }));
    };

    const handleValidation = () => {
        for (const key in formData) {
            if (formData[key] === "") {
                if (key !== "secondary_email" && key !== "designation") { // Allow empty secondary_email, designation
                    showToast({
                        title: `${key.replace(/_/g, " ")} is required`,
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                    });
                    return false;
                }
            }
        }

        if (!isValidMobile(formData.mobile)) {
            showToast({
                title: 'Invalid Mobile Number',
                description: `Entered number has ${formData.mobile.length} digits. It must be exactly 10 digits.`,
                status: 'error',
            });
            return false;
        }

        if (!isValidEmail(formData.primary_email)) {
            showToast({
                title: 'Invalid Primary Email',
                description: 'Make sure it contains @ and a valid domain (e.g. user@example.com).',
                status: 'error',
            });
            return false;
        }

        if (formData.secondary_email && !isValidEmail(formData.secondary_email)) {
            showToast({
                title: 'Invalid Secondary Email',
                description: 'Make sure it contains @ and a valid domain (e.g. user@example.com).',
                status: 'error',
            });
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!handleValidation()) return;
        try {
            await createUser(formData).unwrap();
            setFormData({
                full_name: "",
                primary_email: "",
                secondary_email: "",
                mobile: "",
                designation: "Energy Manager",
            });
            setViewAddUser(false);
        } catch (error) {
            console.error("Error creating user:", error);
        }
    }

    return (
        <Flex direction="column" alignItems="center" gap={deloitte_theme.gap}>
            <Flex justify="space-between" w="full">
                <Heading as="h2" size="md" color={deloitte_theme.textPrimary}>
                    User Management
                </Heading>
                <Button
                    backgroundColor={deloitte_theme.buttonPrimary}
                    color="white"
                    _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                    onClick={() => setViewAddUser(!viewAddUser)}
                >
                    Add User
                </Button>
            </Flex>

            <Divider borderColor="gray.400" />

            <Flex
                w="full"
                justifyContent="space-between"
                gap={deloitte_theme.gap}
                overflow="hidden"
            >
                <motion.div
                    animate={{ width: viewAddUser ? "69%" : "100%" }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="flex-shrink-0 z-0"
                >
                    <Flex w="full">
                        <TableComponent
                            name="List of Users"
                            data={users}
                        />
                    </Flex>
                </motion.div>

                <motion.div
                    animate={{ width: viewAddUser ? "30%" : "0" }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="z-10"
                >
                    <Flex
                        direction="column"
                        gap={deloitte_theme.gap}
                        p={deloitte_theme.paddingX}
                        bg="white"
                        border="1px solid"
                        borderColor={deloitte_theme.bordercolor}
                        rounded="md"
                    >
                        <FormControl isRequired>
                            <FormLabel>Name</FormLabel>
                            <Input
                                type="text"
                                name="full_name"
                                placeholder="Enter name"
                                value={formData.full_name}
                                onChange={handleChange}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Mobile</FormLabel>
                            <Input
                                type="tel"
                                name="mobile"
                                placeholder="Enter mobile number"
                                value={formData.mobile}
                                onChange={handleChange}
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Email</FormLabel>
                            <Input
                                type="email"
                                name="primary_email"
                                placeholder="Enter email"
                                value={formData.primary_email}
                                onChange={handleChange}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Secondary Email</FormLabel>
                            <Input
                                type="email"
                                name="secondary_email"
                                placeholder="Enter secondary email"
                                value={formData.secondary_email}
                                onChange={handleChange}
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Role</FormLabel>
                            <Select
                                name="role_code"
                                placeholder="Select role"
                                value={formData.role_code}
                                onChange={handleChange}
                            >
                                {loadingRoles ? (
                                    <option>Loading roles...</option>
                                ) : (
                                    roles?.map((role) => (
                                        <option key={role.role_code} value={role.role_code}>
                                            {role.role_name}
                                        </option>
                                    ))
                                )}
                            </Select>
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Designation</FormLabel>
                            <Input
                                type="text"
                                name="designation"
                                placeholder="Select designation"
                                value={formData.designation}
                                onChange={handleChange}
                            />
                        </FormControl>

                        <Button
                            width="100%"
                            backgroundColor={deloitte_theme.buttonPrimary}
                            color="black"
                            _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                            onClick={handleSave}
                            isLoading={creating}
                        >
                            Add User
                        </Button>
                    </Flex>
                </motion.div>
            </Flex>
        </Flex>
    );
}

export default UserManagement;

