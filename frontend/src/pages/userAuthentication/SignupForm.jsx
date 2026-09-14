import { useState, useEffect } from "react";
import {
  Box,
  Text,
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Checkbox,
  RadioGroup,
  Radio,
  Stack,
  Button,
} from "@chakra-ui/react";
import { FaCaretRight, FaCaretLeft } from "react-icons/fa";
import deloitte_theme from "../../theme";
import { motion, AnimatePresence } from "framer-motion";
import instance from "../../api_instance";
import { useSelector, useDispatch } from "react-redux";
import { updateEntityField, updateUserField } from "../../redux/RegistrationSlice";
import { showToast } from "../../components/toastService";
import { isValidMobile, isValidEmail, isValidFormData } from "../../utils/validation";
import { useEntityRegistrationMutation } from "../../redux/apiSlices/authApi";
import { useSendOtpMutation } from "../../redux/apiSlices/smsApi";
import SuccessModal from "./SuccessModal";

const SignupForm = () => {
  const dispatch = useDispatch();

  const [mobileOtp, setMobileOtp] = useState('');
  const [showMobileVerificationField, setShowMobileVerificationField] = useState(false);

  const handleMobileOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) setMobileOtp(value);
  };

  const [sendOtp, { isLoading: sendingOtp }] = useSendOtpMutation();

  const handleSendOtp = async () => {
    if (!isValidMobile(userFormData.mobile)) return;

    try {
      const data = await sendOtp({ number: userFormData.mobile, tsFlag: false }).unwrap();
      setShowMobileVerificationField(true);
    } catch (error) {
      console.error(error);
    }
  };


  // Fetch dropdown data
  const { states, sectorTypes, organizationOptions } = useSelector(state => state.commonState)

  const [formType, setFormType] = useState(true);
  const entityFormData = useSelector((state) => state.registration.entityFormData);
  const userFormData = useSelector((state) => state.registration.userFormData);

  const [docs, setDocs] = useState({
    docOne: null,
    docTwo: null,
    otherDoc: null,
  });

  // filtering logic for organization options based on entity form data
  const [filteredOrganizationOptions, setFilteredOrganizationOptions] = useState([]);
  useEffect(() => {
    const filtered = organizationOptions.filter(
      (option) =>
        option.state_code === entityFormData.state &&
        option.entity_type === entityFormData.entityType &&
        option.sector_type === entityFormData.sectorType
    );
    setFilteredOrganizationOptions(filtered);
  }, [entityFormData.state, entityFormData.entityType, entityFormData.sectorType, organizationOptions]);


  // ============================= Form Validation Logic ============================
  const MAX_FILE_SIZE = 2 * 1024 * 1024;
  const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

  const handleValidation = (isEntityForm, formData) => {
    // Define the optional fields
    const optionalFields =
      entityFormData.entityType === "NOBE" || entityFormData.isPat === "No"
        ? ["patRegNumber", "designation", "secondaryEmail"]
        : ["designation", "secondaryEmail"];

    if (!isValidFormData(formData, optionalFields)) return false;

    if (entityFormData.entityType !== "NOBE" && entityFormData.isPat === "No" && docs.docOne == null) {
      showToast({
        title: `Please Enter Company Registration Certificate`,
        status: 'error',
      });
      return false;
    }
    if (entityFormData.entityType !== "NOBE" && entityFormData.isPat === "No" && docs.docTwo == null) {
      showToast({
        title: `Please Enter Power of Attorney Certificate`,
        status: 'error',
      });
      return false;
    }

    // Additional validations for user form
    if (!isEntityForm) {
      const { mobile, officialEmail, secondaryEmail } = formData;

      if (!isValidMobile(mobile)) return false;

      if (!isValidEmail(officialEmail)) return false;

      if (secondaryEmail && !isValidEmail(secondaryEmail)) return false;
    }
    return true;
  }

  // onChange Handler functions
  const handleEntityChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : type === "file" ? files[0] : value;

    if (type === "file") {
      const file = fieldValue;
      if (!file) return;

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        showToast({
          title: "Invalid file type",
          description: "Only PDF, JPG, JPEG, and PNG files are allowed.",
          status: "error",
        });
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        showToast({
          title: "File too large",
          description: `File size should not exceed ${MAX_FILE_SIZE}MB.`,
          status: "error",
        });
        return;
      }

      setDocs(prev => ({
        ...prev,
        [name]: fieldValue,
      }));
    } else
      dispatch(updateEntityField({ name, value: fieldValue }));
  };

  const handleUserChange = (e) => {
    const { name, value, checked } = e.target;
    const fieldValue = name === "declaration" ? checked : value;
    dispatch(updateUserField({ name, value: fieldValue }));
  };

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [response, setResponse] = useState({
    message: '',
    username: ''
  });

  const [entityRegistration, { isLoading: submitLoader }] = useEntityRegistrationMutation();

  // ============================= Form Submit Handler =============================

  const handleSubmit = async () => {
    if (!handleValidation(false, userFormData)) {
      return;
    }

    // OTP Bypass
    if (!showMobileVerificationField) {
      showToast({
        title: "OTP Not Verified",
        description: "Please verify your mobile number before submitting the form.",
        status: "error",
      });
      return;
    }
    if (showMobileVerificationField && mobileOtp.length !== 6) {
      showToast({
        title: "Invalid OTP",
        description: "Please enter a valid 6 digit OTP.",
        status: "error",
      });
      return;
    }

    const formData = new FormData();
    formData.append("entity_type", entityFormData.entityType);
    formData.append("organization_name", entityFormData.organizationName);
    formData.append("state", entityFormData.state);
    formData.append("address", entityFormData.address);
    formData.append("sector_type", entityFormData.sectorType);
    formData.append("is_pat", entityFormData.isPat);
    formData.append("pat_registration_number", entityFormData.patRegNumber);
    // If supportDocs is a single file object
    if (docs.docOne && docs.docTwo) {
      formData.append("doc_one", docs.docOne);
      formData.append("doc_two", docs.docTwo);
    }
    if (docs.otherDoc) {
      formData.append("other_doc", docs.otherDoc);
    }
    formData.append("contact_name", userFormData.contactName);
    formData.append("designation", userFormData.designation);
    formData.append("contact_number", userFormData.mobile);
    formData.append("primary_email", userFormData.officialEmail);
    formData.append("secondary_email", userFormData.secondaryEmail);
    formData.append("otp", mobileOtp);

    try {
      const res = await entityRegistration(formData).unwrap();
      setResponse({
        message: res.message,
        username: res.username
      })
      // show a modal for successful registration only when the mutation succeeded
      setShowSuccessModal(true);
    } catch ({ error }) {
      const errorMsg = error?.data?.message || "Registration failed.";
      console.log(errorMsg);
    }
  };

  // Entity Registration Form
  const entityRegistrationForm = () => {
    return (
      <div className="h-[72vh] bg-white flex flex-col rounded-lg shadow-lg">
        {/* Form Header */}
        <div className="text-center"
          style={{
            paddingTop: deloitte_theme.paddingY,
            paddingBottom: deloitte_theme.paddingY
          }}>
          <p
            className="text-2xl font-semibold text-gray-800 tracking-wide"
            style={{
              paddingTop: deloitte_theme.paddingY,
              paddingBottom: deloitte_theme.paddingY
            }}
          >
            ENTITY REGISTRATION FORM
          </p>
          <div
            className="w-40 h-1 mx-auto rounded-full"
            style={{
              backgroundColor: deloitte_theme.secondary
            }}
          ></div>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto inset-shadow-sm"
          style={{
            padding: deloitte_theme.paddingX
          }}>
          <Grid templateColumns="repeat(12, 1fr)" gap={4}>

            {/* Entity Type */}
            {(entityFormData.entityType !== "NOBE") &&
              <GridItem colSpan={12}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="medium">Entity Type</FormLabel>
                  <RadioGroup
                    name="entityType"
                    value={entityFormData.entityType}
                    onChange={(value) =>
                      handleEntityChange({ target: { name: "entityType", value } })
                    }
                    isDisabled={entityFormData.isPat === "Yes"}
                  >
                    <Stack direction='row' spacing={4}>
                      <Radio
                        value='DISCOM'
                        colorScheme="green"
                      >
                        Discom
                      </Radio>
                      <Radio
                        value='INDUSTRY'
                        colorScheme="green"
                      >
                        OA/CPP
                      </Radio>
                      {/* <Radio
                      value='NOBE'
                      colorScheme="green"
                      >
                      Non Obligated
                    </Radio> */}
                    </Stack>
                  </RadioGroup>
                </FormControl>
              </GridItem>
            }

            {/* Sector Type */}
            <GridItem colSpan={12}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium">
                  {
                    entityFormData.entityType === "NOBE" ? "Entity Type" : "Sector Type"
                  }
                </FormLabel>
                <Select
                  size="md"
                  name="sectorType"
                  value={entityFormData.sectorType}
                  onChange={handleEntityChange}
                  bg="white"
                  borderColor="gray.300"
                  _hover={{ borderColor: "gray.400" }}
                  borderRadius="md"
                  isDisabled={entityFormData.isPat === "Yes"}
                >
                  <option value="">Select</option>
                  {sectorTypes
                    .filter((option) => option.entity_type === entityFormData.entityType && option.sector_code !== "FIRM")
                    .map((option) => (
                      <option key={option.sector_code} value={option.sector_code}>
                        {option.sector_name}-{option.sector_code}
                      </option>
                    ))}
                </Select>
              </FormControl>
            </GridItem>

            {/* State */}
            {
              (
                entityFormData.entityType === "INDUSTRY" ||
                entityFormData.entityType === "DISCOM" ||
                (
                  entityFormData.entityType === "NOBE" &&
                  ["SLDC", "REDA", "SERC", "OTH", "RLDC", "SDA"].includes(entityFormData.sectorType)
                )
              ) &&
              <GridItem colSpan={12}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="medium">State</FormLabel>
                  <Select
                    size="md"
                    name="state"
                    value={entityFormData.state}
                    onChange={handleEntityChange}
                    bg="white"
                    borderColor="gray.300"
                    _hover={{ borderColor: "gray.400" }}
                    borderRadius="md"
                    isDisabled={entityFormData.isPat === "Yes"}
                  >
                    <option value="">Select State</option>
                    {states.map((state) => (
                      <option key={state.state_name} value={state.state_code}>
                        {state.state_name}-{state.state_code}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
            }

            {/* PAT Registration Number (conditional) */}
            {(entityFormData.entityType === "DISCOM" || entityFormData.entityType === "INDUSTRY") && entityFormData.isPat === "Yes" && (
              <GridItem colSpan={12}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="medium">PAT Registration Number</FormLabel>
                  <Input
                    size="md"
                    name="patRegNumber"
                    value={entityFormData.patRegNumber}
                    onChange={handleEntityChange}
                    borderColor="gray.300"
                    _hover={{ borderColor: "gray.400" }}
                    bg="white"
                    isDisabled={entityFormData.isPat === "Yes"}
                  />
                </FormControl>
              </GridItem>
            )}

            {/* Organization Name */}
            <GridItem colSpan={12}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium">Organization Name</FormLabel>
                {
                  filteredOrganizationOptions.length === 0 || entityFormData.entityType === "INDUSTRY" ?
                    <Input
                      size="md"
                      name="organizationName"
                      placeholder="Enter Organization Name"
                      value={entityFormData.organizationName}
                      onChange={handleEntityChange}
                      borderColor="gray.300"
                      _hover={{ borderColor: "gray.400" }}
                      bg="white"
                      isDisabled={entityFormData.isPat === "Yes"}
                    />
                    :
                    (
                      <Select
                        size="md"
                        name="organizationName"
                        value={entityFormData.organizationName}
                        onChange={handleEntityChange}
                        bg="white"
                        borderColor="gray.300"
                        _hover={{ borderColor: "gray.400" }}
                        borderRadius="md"
                        isDisabled={entityFormData.isPat === "Yes"}
                      >
                        <option value="">Select Organization</option>
                        {organizationOptions
                          .filter((option => option.state_code === entityFormData.state && option.entity_type === entityFormData.entityType && option.sector_type === entityFormData.sectorType))
                          .map((option) => (
                            <option key={option.organization_name} value={option.organization_code}>
                              {option.organization_name}
                            </option>
                          ))}
                      </Select>
                    )
                }
              </FormControl>
            </GridItem>

            {/* Address */}
            <GridItem colSpan={12}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium">Address</FormLabel>
                <Textarea
                  size="md"
                  rows={2}
                  name="address"
                  value={entityFormData.address}
                  onChange={handleEntityChange}
                  borderColor="gray.300"
                  _hover={{ borderColor: "gray.400" }}
                  bg="white"
                // isDisabled={entityFormData.isPat === "Yes"}
                />
              </FormControl>
            </GridItem>

            {/* Company Registration Certificate */}
            {(entityFormData.entityType !== "NOBE") &&
              <GridItem colSpan={12}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="medium">Company Registration Certificate</FormLabel>
                  <Box display="flex" alignItems="center" gap={3}>
                    <Button
                      as="label"
                      htmlFor="docOne"
                      bg={deloitte_theme.buttonPrimary}
                      _hover={{ bg: deloitte_theme.buttonHoverPrimary }}
                      color="white"
                      fontSize="sm"
                      fontWeight="semibold"
                      py={2}
                      px={4}
                      rounded="md"
                      cursor="pointer"
                      isDisabled={entityFormData.isPat === "Yes"}
                    >
                      Choose File
                    </Button>
                    <Text fontSize="sm" color="black" noOfLines={1} maxW="300px">
                      {docs.docOne ? docs.docOne.name : "No file selected"}
                    </Text>
                    <Input
                      type="file"
                      id="docOne"
                      name="docOne"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleEntityChange}
                      display="none"
                    />
                  </Box>
                </FormControl>
              </GridItem>
            }

            {/* Power of Attorney */}
            {(entityFormData.entityType !== "NOBE") &&
              <GridItem colSpan={12}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="medium">Power of Attorney</FormLabel>
                  <Box display="flex" alignItems="center" gap={3}>
                    <Button
                      as="label"
                      htmlFor="docTwo"
                      bg={deloitte_theme.buttonPrimary}
                      _hover={{ bg: deloitte_theme.buttonHoverPrimary }}
                      color="white"
                      fontSize="sm"
                      fontWeight="semibold"
                      py={2}
                      px={4}
                      rounded="md"
                      cursor="pointer"
                      isDisabled={entityFormData.isPat === "Yes"}
                    >
                      Choose File
                    </Button>
                    <Text fontSize="sm" color="black" noOfLines={1} maxW="300px">
                      {docs.docTwo ? docs.docTwo.name : "No file selected"}
                    </Text>
                    <Input
                      type="file"
                      id="docTwo"
                      name="docTwo"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleEntityChange}
                      display="none"
                    />
                  </Box>
                </FormControl>
              </GridItem>
            }

            {/* Other Documents */}
            <GridItem colSpan={12}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Other Documents</FormLabel>
                <Box display="flex" alignItems="center" gap={3}>
                  <Button
                    as="label"
                    htmlFor="otherDoc"
                    bg={deloitte_theme.buttonPrimary}
                    _hover={{ bg: deloitte_theme.buttonHoverPrimary }}
                    color="white"
                    fontSize="sm"
                    fontWeight="semibold"
                    py={2}
                    px={4}
                    rounded="md"
                    cursor="pointer"
                  >
                    Choose File
                  </Button>
                  <Text fontSize="sm" color="black" noOfLines={1} maxW="300px">
                    {docs.otherDoc ? docs.otherDoc.name : "No file selected"}
                  </Text>
                  <Input
                    type="file"
                    id="otherDoc"
                    name="otherDoc"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleEntityChange}
                    display="none"
                  />
                </Box>
              </FormControl>
            </GridItem>
          </Grid>
        </div>

        {/* Form Footer */}
        <div className="flex justify-end items-center"
          style={{
            padding: deloitte_theme.paddingY
          }}>
          <Button
            rightIcon={<FaCaretRight />}
            onClick={() => {
              if (!handleValidation(true, entityFormData)) {
                return;
              }
              setFormType(false);
            }}
            bg={deloitte_theme.buttonPrimary}
            color="white"
            _hover={{ bg: deloitte_theme.buttonHoverPrimary }}
            size="md"
            px={6}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }

  // User Registration Form
  const userRegistrationForm = () => {
    return (
      <div className="h-[72vh] bg-white flex flex-col rounded-lg shadow-lg">
        {/* Form Header */}
        <div className="text-center"
          style={{
            paddingTop: deloitte_theme.paddingY,
            paddingBottom: deloitte_theme.paddingY
          }}>
          <p
            className="text-2xl font-semibold text-gray-800 tracking-wide"
            style={{
              paddingTop: deloitte_theme.paddingY,
              paddingBottom: deloitte_theme.paddingY
            }}
          >
            PRIMARY USER REGISTRATION
          </p>
          <div
            className="w-40 h-1 mx-auto rounded-full"
            style={{
              backgroundColor: deloitte_theme.secondary
            }}
          ></div>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto inset-shadow-sm"
          style={{
            padding: deloitte_theme.paddingX
          }}>
          <Grid templateColumns="repeat(12, 1fr)" gap={4}>
            {/* Primary User Name */}
            <GridItem colSpan={12}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium">Primary User Name</FormLabel>
                <Input
                  size="md"
                  name="contactName"
                  type="text"
                  value={userFormData.contactName}
                  onChange={handleUserChange}
                  borderColor="gray.300"
                  _hover={{ borderColor: "gray.400" }}
                  bg="white"
                // isDisabled={entityFormData.isPat === "Yes"}
                />
              </FormControl>
            </GridItem>

            {/* Designation */}
            <GridItem colSpan={12}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Designation</FormLabel>
                <Input
                  size="md"
                  name="designation"
                  type="text"
                  value={userFormData.designation}
                  onChange={handleUserChange}
                  borderColor="gray.300"
                  _hover={{ borderColor: "gray.400" }}
                  bg="white"
                />
              </FormControl>
            </GridItem>

            {/* Mobile Number */}
            <GridItem colSpan={12}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium">Mobile Number</FormLabel>
                <Input
                  size="md"
                  name="mobile"
                  type="number"
                  value={userFormData.mobile}
                  onChange={handleUserChange}
                  borderColor="gray.300"
                  _hover={{ borderColor: "gray.400" }}
                  bg="white"
                />
              </FormControl>
            </GridItem>

            {/* OTP Bypass */}
            {/* Mobile Verification */}
            <GridItem colSpan={12}>
              <div className="flex items-start gap-4 w-full">
                <motion.div
                  animate={{ width: showMobileVerificationField ? "35%" : "100%" }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <Button
                    width="100%"
                    onClick={handleSendOtp}
                    color="black"
                    border="1px solid"
                    borderColor={!showMobileVerificationField && deloitte_theme.buttonHoverWarning}
                    backgroundColor={deloitte_theme.white}
                    height="2.5rem"
                    fontSize="sm"
                  >
                    {showMobileVerificationField ? "Resend" : "Verify"}
                  </Button>
                </motion.div>

                {showMobileVerificationField && (
                  <motion.div
                    animate={{ width: "65%", opacity: 1 }}
                    initial={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FormControl>
                      <Input
                        name="mobileOtp"
                        placeholder="Enter the 6 digit code"
                        value={mobileOtp}
                        onChange={handleMobileOtpChange}
                        pattern="\d{6}"
                        inputMode="numeric"
                        maxLength={6}
                        size="md"
                        borderColor="gray.300"
                      />
                    </FormControl>
                  </motion.div>
                )}
              </div>
            </GridItem>


            {/* Official Email */}
            <GridItem colSpan={12}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium">Official Email</FormLabel>
                <Input
                  size="md"
                  name="officialEmail"
                  value={userFormData.officialEmail}
                  onChange={handleUserChange}
                  borderColor="gray.300"
                  _hover={{ borderColor: "gray.400" }}
                  bg="white"
                />
              </FormControl>

            </GridItem>

            {/* Alternate Email */}
            <GridItem colSpan={12}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Alternate Email</FormLabel>
                <Input
                  size="md"
                  name="secondaryEmail"
                  value={userFormData.secondaryEmail}
                  onChange={handleUserChange}
                  borderColor="gray.300"
                  _hover={{ borderColor: "gray.400" }}
                  bg="white"
                />
              </FormControl>
            </GridItem>

            {/* Declaration */}
            <GridItem colSpan={12} mt={2}>
              <Checkbox
                name="declaration"
                onChange={handleUserChange}
                isChecked={userFormData.declaration}
                colorScheme="green"
              >
                I confirm the data is accurate and agree to the terms.
              </Checkbox>
            </GridItem>
          </Grid>
        </div>

        {/* Form Footer */}
        <div className="flex justify-between items-center"
          style={{
            paddingRight: deloitte_theme.paddingX,
            paddingLeft: deloitte_theme.paddingX,
            paddingTop: deloitte_theme.paddingY,
            paddingBottom: deloitte_theme.paddingY
          }}>
          <Button
            leftIcon={<FaCaretLeft />}
            onClick={() => setFormType(true)}
            variant="outline"
            size="md"
            px={6}
          >
            Back
          </Button>

          <Button
            isLoading={submitLoader}
            onClick={handleSubmit}
            bg="#4CAF50"
            color="white"
            _hover={{ bg: "#45a049" }}
            size="md"
            px={6}
          >
            Submit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {formType ? (
          <motion.div
            key="entity"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {entityRegistrationForm()}
          </motion.div>
        ) : (
          <motion.div
            key="user"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {userRegistrationForm()}
          </motion.div>
        )}
      </AnimatePresence>
      <SuccessModal response={response} isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
    </>
  );
};

export default SignupForm;