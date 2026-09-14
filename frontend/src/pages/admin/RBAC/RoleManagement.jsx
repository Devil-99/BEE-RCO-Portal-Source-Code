import React, { useState } from "react";
import {
    Flex,
    Heading,
    Button,
    Divider,
    FormControl,
    FormLabel,
    Input,
    Textarea,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import deloitte_theme from "../../../theme";
import TableComponent from "../../../components/TableComponent";
import {
    useGetRolesQuery,
    useCreateRoleMutation,
} from "../../../redux/apiSlices/Admin/RbacApi";
import { showToast } from "../../../components/toastService";

function RoleManagement() {
    const [viewAddRole, setViewAddRole] = useState(false);

    const { data: roles = [], isLoading: loadingRoles } =
        useGetRolesQuery();

    const [createRole, { isLoading: creating }] =
        useCreateRoleMutation();

    const [formData, setFormData] = useState({
        role_code: "",
        role_name: "",
        description: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleValidation = () => {
        if (!formData.role_code.trim()) {
            showToast({
                title: "Role Code is required",
                status: "error",
            });
            return false;
        }

        if (!formData.role_name.trim()) {
            showToast({
                title: "Role Name is required",
                status: "error",
            });
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!handleValidation()) return;

        try {
            await createRole(formData).unwrap();

            showToast({
                title: "Role created successfully",
                status: "success",
            });

            setFormData({
                role_code: "",
                role_name: "",
                description: "",
            });

            setViewAddRole(false);
        } catch (error) {
            console.error("Error creating role:", error);

            showToast({
                title: error?.data?.detail || "Failed to create role",
                status: "error",
            });
        }
    };

    // Dynamically generate Sl No
    const roleTableData = roles.map((role) => ({
        role_code: role.role_code,
        role_name: role.role_name,
        description: role.description || "-",
    }));

    return (
        <Flex direction="column" alignItems="center" gap={deloitte_theme.gap}>
            <Flex justify="space-between" w="full">
                <Heading
                    as="h2"
                    size="md"
                    color={deloitte_theme.textPrimary}
                >
                    Role Management
                </Heading>

                <Button
                    backgroundColor={deloitte_theme.buttonPrimary}
                    color="white"
                    _hover={{
                        backgroundColor: deloitte_theme.buttonHoverPrimary,
                    }}
                    onClick={() => setViewAddRole(!viewAddRole)}
                >
                    Add Role
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
                    animate={{ width: viewAddRole ? "69%" : "100%" }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="flex-shrink-0 z-0"
                >
                    <Flex w="full">
                        <TableComponent
                            name="List of Roles"
                            data={roleTableData}
                            isLoading={loadingRoles}
                        />
                    </Flex>
                </motion.div>

                <motion.div
                    animate={{ width: viewAddRole ? "30%" : "0%" }}
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
                        <FormControl>
                            <FormLabel>Sr No</FormLabel>
                            <Input
                                value={roles.length > 0 ? Math.max(...roles.map(r => r.id)) + 1 : 1}
                                isReadOnly
                                bg="gray.50"
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Role Code</FormLabel>
                            <Input
                                name="role_code"
                                placeholder="Enter role code"
                                value={formData.role_code}
                                onChange={handleChange}
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Role Name</FormLabel>
                            <Input
                                name="role_name"
                                placeholder="Enter role name"
                                value={formData.role_name}
                                onChange={handleChange}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Description</FormLabel>
                            <Textarea
                                name="description"
                                placeholder="Enter description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </FormControl>

                        <Button
                            width="100%"
                            backgroundColor={deloitte_theme.buttonPrimary}
                            color="black"
                            _hover={{
                                backgroundColor: deloitte_theme.buttonHoverPrimary,
                            }}
                            onClick={handleSave}
                            isLoading={creating}
                        >
                            Add Role
                        </Button>
                    </Flex>
                </motion.div>
            </Flex>
        </Flex>
    );
}

export default RoleManagement;