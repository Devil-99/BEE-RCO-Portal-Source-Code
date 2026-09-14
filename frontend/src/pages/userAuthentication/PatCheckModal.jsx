import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Select,
  Button, Input, FormControl, FormLabel, VStack, Stack, RadioGroup, Radio, useToast,
  Text,
  Box,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { useSelector, useDispatch } from "react-redux";
import {
  clearPrefillData,
  updateEntityField,
} from "../../redux/RegistrationSlice";
import ConfirmModal from '../../components/ConfirmModal';
import { useGetPatListsQuery, useSearchPatDetailsMutation } from '../../redux/apiSlices/patSearchApi';
import { useEntityRegistrationMutation } from '../../redux/apiSlices/authApi';
import SuccessModal from './SuccessModal';
import deloitte_theme from '../../theme';

function PatCheckModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { sectorTypes } = useSelector(state => state.commonState)

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // This will ensure, after PAT search, fields are disabled and Submit button appears
  const [boolSearchPat, setBoolSearchPat] = useState(false);

  const entityFormData = useSelector((state) => state.registration.entityFormData);
  const userFormData = useSelector((state) => state.registration.userFormData);

  const [patSearchText, setPatSearchText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: patLists } = useGetPatListsQuery(entityFormData.sectorType, {
    skip: !entityFormData.sectorType,
    refetchOnMountOrArgChange: true,
  });

  // Filtered PAT lists and debounced search
  const [filteredPatLists, setFilteredPatLists] = useState([]);

  useEffect(() => {
    if (patLists) {
      setIsMenuOpen(true);
    };
    const handler = setTimeout(() => {
      const query = patSearchText.trim().toLowerCase();
      const filtered = (patLists || []).filter((pat) =>
        (pat.registration_number || '').toLowerCase().includes(query)
      );
      setFilteredPatLists(filtered);
    }, 300);

    return () => clearTimeout(handler);
  }, [patSearchText, patLists]);


  const [triggerSearchPat, { isLoading: isFetching }] = useSearchPatDetailsMutation();

  const handlePatSearch = async (patRegNumber) => {
    try {
      const response = await triggerSearchPat(patRegNumber).unwrap();
      setBoolSearchPat(true);
      setIsMenuOpen(false);
    }
    catch (error) {
      console.error("Error fetching PAT details:", error);
    }
  };

  const handlePatSelection = (value) => {
    dispatch(updateEntityField({ name: "isPat", value }))
    if (value === "No") {
      onClose();
      navigate("/formpage?type=register");
    } else {
      dispatch(updateEntityField({ name: "entityType", value: "INDUSTRY" }))
    }
  }

  const handleEdit = () => {
    onClose();
    setBoolSearchPat(false);
    navigate("/formpage?type=register");
  };

  // Open confirm modal on submit button click
  const handleOpenConfirm = () => {
    setIsConfirmOpen(true);
  };

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [response, setResponse] = useState({
    message: '',
    username: ''
  })
  const [entityRegistration, { isLoading: submitLoader }] = useEntityRegistrationMutation();

  const handleSubmit = async () => {
    const fieldData = new FormData();
    fieldData.append("entity_type", entityFormData.entityType);
    fieldData.append("organization_name", entityFormData.organizationName);
    fieldData.append("state", entityFormData.state);
    fieldData.append("address", entityFormData.address);
    fieldData.append("sector_type", entityFormData.sectorType);
    fieldData.append("is_pat", entityFormData.isPat);
    fieldData.append("pat_registration_number", entityFormData.patRegNumber);
    fieldData.append("contact_name", userFormData.contactName);
    fieldData.append("designation", userFormData.designation);
    fieldData.append("contact_number", userFormData.mobile);
    fieldData.append("primary_email", userFormData.officialEmail);

    try {
      const res = await entityRegistration(fieldData).unwrap();
      setResponse({
        message: res.message,
        username: res.username
      })
      setShowSuccessModal(true);
    } catch ({ error }) {
      const errorMsg = error?.data?.message || "Registration failed.";
      console.log(errorMsg);
    } finally {
      setIsConfirmOpen(false);
      onClose();
      setBoolSearchPat(false);
      dispatch(clearPrefillData());
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Registration Popup</ModalHeader>
          <ModalCloseButton onClick={() => setBoolSearchPat(false)} />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Are you registered with PAT-NET ?</FormLabel>
                <RadioGroup
                  name="isPat"
                  value={entityFormData.isPat}
                  onChange={(value) =>
                    handlePatSelection(value)
                  }
                  isDisabled={boolSearchPat}
                >
                  <Stack direction='row'>
                    <Radio value='Yes'>Yes</Radio>
                    <Radio value='No'>No</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>

              {
                entityFormData.isPat === 'Yes' && (
                  <FormControl isRequired>
                    <FormLabel>Entity Type</FormLabel>
                    <RadioGroup
                      name="entityType"
                      value={entityFormData.entityType}
                      onChange={(value) =>
                        dispatch(updateEntityField({ name: "entityType", value }))
                      }
                      isDisabled={boolSearchPat}
                    >
                      <Stack direction='row'>
                        <Radio value='DISCOM'>Discom</Radio>
                        <Radio value='INDUSTRY'>OA/CPP</Radio>
                      </Stack>
                    </RadioGroup>
                  </FormControl>
                )
              }

              {
                entityFormData.isPat === 'Yes' && (
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="medium">Select Sector Type</FormLabel>
                    <Select
                      size="md"
                      name="sectorType"
                      value={entityFormData.sectorType}
                      onChange={(e =>
                        dispatch(updateEntityField({ name: "sectorType", value: e.target.value }))
                      )}
                      bg="white"
                      borderColor="gray.300"
                      _hover={{ borderColor: "gray.400" }}
                      borderRadius="md"
                      isDisabled={boolSearchPat}
                    >
                      <option value="">Select</option>
                      {sectorTypes
                        .filter((option) => option.entity_type === entityFormData.entityType)
                        .map((option) => (
                          <option key={option.sector_code} value={option.sector_code}>
                            {option.sector_name}-{option.sector_code}
                          </option>
                        ))}
                    </Select>
                  </FormControl>)
              }

              {entityFormData.entityType != "NOBE" && entityFormData.isPat === 'Yes' && (
                <Stack direction="row" align="flex-end">
                  <FormControl isRequired>
                    <FormLabel>PAT Registration Number</FormLabel>
                    <Box position="relative">
                      <Input
                        placeholder="Enter PAT Reg. No."
                        value={patSearchText}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPatSearchText(value);
                          setIsMenuOpen(true);
                        }}
                        onFocus={() => setIsMenuOpen(true)}
                        onBlur={() => {
                          // delay so click works
                          setTimeout(() => setIsMenuOpen(false), 150);
                        }}
                        isDisabled={boolSearchPat}
                      />

                      {isMenuOpen && (
                        <Box
                          position="absolute"
                          top="100%"
                          left="0"
                          right="0"
                          sx={deloitte_theme.glass}
                          color="white"
                          mt={1}
                          zIndex={10}
                          maxH="180px"
                          overflowY="auto"
                        >
                          {!isFetching && filteredPatLists.length === 0 && (
                            <Box px={3} py={2}>No results found</Box>
                          )}

                          {!isFetching &&
                            filteredPatLists.map((pat) => (
                              <Box
                                key={pat.registration_number}
                                px={deloitte_theme.paddingX}
                                py={deloitte_theme.paddingY}
                                cursor="pointer"
                                _hover={{ bg: deloitte_theme.glassBackground }}
                                onMouseDown={() => {
                                  // onMouseDown prevents blur before click
                                  dispatch(
                                    updateEntityField({
                                      name: "patRegNumber",
                                      value: pat.registration_number,
                                    })
                                  );
                                  setPatSearchText(pat.registration_number);
                                  setIsMenuOpen(false);
                                }}
                              >
                                {pat.registration_number}
                              </Box>
                            ))}
                        </Box>
                      )}
                    </Box>

                    {/* <Select
                      placeholder="Select PAT Reg. No."
                      name="patRegNumber"
                      value={entityFormData.patRegNumber || ""}
                      onChange={(e) =>
                        dispatch(updateEntityField({ name: "patRegNumber", value: e.target.value }))
                      }
                      isDisabled={boolSearchPat}
                    >
                      {patLists && patLists.map((pat) => (
                        <option key={pat.registration_number} value={pat.registration_number}>
                          {pat.registration_number}
                        </option>
                      ))}
                    </Select> */}
                  </FormControl>
                  <Button
                    onClick={() => handlePatSearch(entityFormData.patRegNumber)}
                    colorScheme="blue"
                    isLoading={isFetching}
                  >
                    Search
                  </Button>
                </Stack>
              )}

              {entityFormData.organizationName && [
                { label: 'State', name: 'state' },
                { label: 'Organisation Name', name: 'organizationName' },
                { label: 'Address', name: 'address' },
                { label: 'Sector Name', name: 'sectorType' }
              ].map(({ label, name }) => (
                <FormControl key={name}>
                  <FormLabel>{label}</FormLabel>
                  <Input
                    name={name}
                    value={entityFormData[name]}
                    isDisabled={boolSearchPat}
                    readOnly
                  />
                </FormControl>
              ))}

              {entityFormData.organizationName && [
                { label: 'Plant Head Name', name: 'contactName' },
                { label: 'Primary contact', name: 'mobile' },
                { label: 'Plant Head Email', name: 'officialEmail' },
                { label: 'Recovery Email', name: 'secondaryEmail' }
              ].map(({ label, name }) => (
                <FormControl key={name}>
                  <FormLabel>{label}</FormLabel>
                  <Input
                    name={name}
                    value={userFormData[name]}
                    isDisabled={boolSearchPat}
                    readOnly
                  />
                </FormControl>
              ))}

              {
                boolSearchPat &&
                <>
                  <Text padding={deloitte_theme.paddingY} color={deloitte_theme.textWarning}>
                    You can only edit Address, Mobile number, Primary email and Secondary email through Edit button. If you need to update any other fields contact to BEE on - RCO.support@beeindia.gov.in
                  </Text>
                  <Stack direction="row" justify="flex-end" pt={2}>
                    <Button variant="outline" onClick={handleEdit}>
                      Edit
                    </Button>
                    <Button colorScheme="green" onClick={handleOpenConfirm}
                      disabled={ userFormData.contactName=='' && userFormData.mobile == '' && userFormData.officialEmail == '' }
                    >
                      Submit
                    </Button>
                  </Stack>
                </>
              }
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSubmit}
        confirmText="Yes, Submit"
        cancelText="Cancel"
        isLoading={submitLoader}
      />
      <SuccessModal response={response} isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
    </>
  );
}

export default PatCheckModal;
