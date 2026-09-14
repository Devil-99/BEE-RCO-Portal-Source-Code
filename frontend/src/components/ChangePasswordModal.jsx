import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  FormErrorMessage,
  Text,
  List,
  ListItem,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { usePasswordChangeMutation } from '../redux/apiSlices/authApi';
import { useSelector } from 'react-redux';

function ChangePasswordModal({ 
  isOpen, onClose
}) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const { username } = useSelector((state) => state.login);
  const [passwordChange, { isLoading }] = usePasswordChangeMutation();

  // Visibility toggles for each password field
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password rules regex patterns
  const passwordRules = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[@$!%*?&]/.test(newPassword),
  };

  const validatePassword = () => {
    if (!passwordRules.length) return 'Password must be at least 8 characters long.';
    if (!passwordRules.upper) return 'Password must include at least one uppercase letter.';
    if (!passwordRules.lower) return 'Password must include at least one lowercase letter.';
    if (!passwordRules.number) return 'Password must include at least one number.';
    if (!passwordRules.special) return 'Password must include at least one special character (@$!%*?&).';
    if (newPassword !== confirmPassword) return 'New password and confirm password do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await passwordChange({
        current_password: oldPassword,
        new_password: newPassword,
      }).unwrap();

      // Reset fields
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      onClose();
    } catch (err) {
      console.log(err);
      setError('Failed to change password. Please try again.');
    }
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Change Password</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody pb={6}>
            {/* Old Password */}
            <FormControl isRequired mb={3}>
              <FormLabel>Old Password</FormLabel>
              <InputGroup>
                <Input
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter old password"
                />
                <InputRightElement>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label={showOld ? 'Hide password' : 'Show password'}
                    icon={showOld ? <ViewOffIcon /> : <ViewIcon />}
                    onClick={() => setShowOld(!showOld)}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            {/* New Password */}
            <FormControl isRequired mb={3} isInvalid={!!error}>
              <FormLabel>New Password</FormLabel>
              <InputGroup>
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <InputRightElement>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                    icon={showNew ? <ViewOffIcon /> : <ViewIcon />}
                    onClick={() => setShowNew(!showNew)}
                  />
                </InputRightElement>
              </InputGroup>

              {/* Password Rules */}
              <Text fontSize="sm" mt={2} mb={1} fontWeight="semibold">
                Password must contain:
              </Text>
              <List spacing={1} fontSize="sm">
                <ListItem color={passwordRules.length ? 'green.500' : 'red.500'}>
                  • At least 8 characters
                </ListItem>
                <ListItem color={passwordRules.upper ? 'green.500' : 'red.500'}>
                  • One uppercase letter (A–Z)
                </ListItem>
                <ListItem color={passwordRules.lower ? 'green.500' : 'red.500'}>
                  • One lowercase letter (a–z)
                </ListItem>
                <ListItem color={passwordRules.number ? 'green.500' : 'red.500'}>
                  • One number (0–9)
                </ListItem>
                <ListItem color={passwordRules.special ? 'green.500' : 'red.500'}>
                  • One special character (@$!%*?&)
                </ListItem>
              </List>
            </FormControl>

            {/* Confirm Password */}
            <FormControl isRequired isInvalid={!!error}>
              <FormLabel>Confirm New Password</FormLabel>
              <InputGroup>
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
                <InputRightElement>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    icon={showConfirm ? <ViewOffIcon /> : <ViewIcon />}
                    onClick={() => setShowConfirm(!showConfirm)}
                  />
                </InputRightElement>
              </InputGroup>
              {error && <FormErrorMessage>{error}</FormErrorMessage>}
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} type="submit" isLoading={isLoading}>
              Save
            </Button>
            <Button onClick={onClose} variant="ghost">
              Cancel
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
    </>
    )
}

export default ChangePasswordModal;
