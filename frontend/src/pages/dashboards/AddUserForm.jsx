import React, { useState } from "react";
import {
  Flex,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  FormErrorMessage,
  Modal,
  ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody,
  InputGroup,
  InputRightElement,
  Select
} from "@chakra-ui/react";
import deloitte_theme from "../../theme";
import { showToast } from "../../components/toastService";
import { useLazySearchEnergyManagerQuery } from "../../redux/apiSlices/entityDashboardApi";
import { useCreateUserMutation } from "../../redux/apiSlices/Admin/RbacApi";
import { isValidEmail, isValidMobile } from "../../utils/validation";

const AddUserForm = ({ isOpen, onClose }) => {
  const [regNo, setRegNo] = useState('');
  const [energyManagerList, setEnergyManagerList] = useState([]);
  const [searchEnergyManager, { isFetching: searching }] = useLazySearchEnergyManagerQuery();
  const handleSearch = async () => {
    try {
      const data = await searchEnergyManager(regNo).unwrap();
      if (!data || data.length === 0) {
        showToast({
          title: "No Energy Manager found with this Registration Number.",
          description:
            "Please contact with support helpline number.",
          status: "warning",
        });
        return;
      }
      setEnergyManagerList(data);
      showToast({
        title: 'Energy Manager found successfully.',
        status: 'success'
      })
    } catch (error) {
      console.error(error);
    }
  }

  const [formData, setFormData] = useState({
    full_name: "",
    primary_email: "",
    secondary_email: "",
    mobile: "",
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
        if (key !== "secondary_email") { // Allow empty secondary_email
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

    if (!isValidMobile(formData.mobile)) return;

    if (!isValidEmail(formData.primary_email)) return;

    if (formData.secondary_email && !isValidEmail(formData.secondary_email)) return;

    return true;
  };

  const [addEnergyManager, { isLoading: creating }] = useCreateUserMutation();

  const handleSubmit = async () => {
    if (!handleValidation()) return;
    const payload = {
      full_name: formData.full_name,
      primary_email: formData.primary_email,
      secondary_email: formData.secondary_email,
      mobile: formData.mobile,
      designation: "Energy Manager",
      role_code: "USR",
    };

    try {
      await addEnergyManager(payload).unwrap();
      onClose()
      setFormData({
        full_name: "",
        primary_email: "",
        secondary_email: "",
        mobile: "",
        designation: "Energy Manager",
      });
    } catch (error) {
      console.error("Error creating energy manager", error);      
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalHeader>Add New Energy Manager</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex direction="column" gap={deloitte_theme.gap}>
            {/* Search Energy Manager */}
            <FormControl isRequired>
              <FormLabel>Search Energy Manager by Registration Number</FormLabel>
              <InputGroup>
                <Input
                  placeholder="Enter Registration No (e.g. EM-0027)"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                />
                <InputRightElement width="5rem">
                  <Button size="sm" onClick={handleSearch} isLoading={searching}>
                    Search
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            {/* Full Name */}
            <FormControl isRequired>
              <FormLabel>Full Name</FormLabel>
              {
                energyManagerList.length > 0 ?
                  <Select
                    name="full_name"
                    placeholder="Select Energy Manager"
                    value={formData.full_name}
                    onChange={handleChange}
                  >
                    {energyManagerList.map(user => (
                      <option key={user.id} value={user.name}>
                        {user.name}
                      </option>
                    ))}
                  </Select>
                  :
                  <Text size="sm" color={deloitte_theme.textSecondary}>Search for a Energy Manager</Text>
              }
              {/* <Input name="full_name" value={formData.full_name} onChange={handleChange} borderColor="green.500" size="sm" /> */}
            </FormControl>

            {/* Designation */}
            <FormControl>
              <FormLabel>Designation / Dept.</FormLabel>
              <Input
                name="designation"
                value={formData.designation}
                onChange={handleChange}
              />
            </FormControl>

            {/* Email */}
            <FormControl isRequired>
              <FormLabel>Official Email</FormLabel>
              <Input
                name="primary_email"
                type="email"
                value={formData.primary_email}
                onChange={handleChange}
              />
            </FormControl>

            {/* Email */}
            <FormControl>
              <FormLabel>Secondary Email</FormLabel>
              <Input
                name="secondary_email"
                type="email"
                value={formData.secondary_email}
                onChange={handleChange}
              />
            </FormControl>

            {/* Mobile */}
            <FormControl isRequired>
              <FormLabel>Mobile Number</FormLabel>
              <Input
                name="mobile"
                type="tel"
                value={formData.mobile}
                onChange={handleChange}
              />
            </FormControl>

            <Button
              type="submit"
              size="sm"
              bg={deloitte_theme.buttonPrimary}
              color="white"
              fontWeight="bold"
              _hover={{ bg: deloitte_theme.buttonHover }}
              width="full"
              isLoading={creating}
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AddUserForm;
