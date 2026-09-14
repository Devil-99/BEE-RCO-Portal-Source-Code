import { useState, useRef, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  FormControl,
  FormLabel,
  useToast,
  VStack,
} from '@chakra-ui/react';
import deloitte_theme from '../../theme'
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { showToast } from '../../components/toastService';
import { trackStatus } from '../../redux/LoginSlice';
import { useLazyTrackStatusQuery } from '../../redux/apiSlices/trackStatusApi';
import { useSendOtpMutation } from '../../redux/apiSlices/smsApi';
import { isValidMobile } from '../../utils/validation';

const TrackStatusModal = ({ isOpen, onClose }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const phoneInputRef = useRef(null);
  const otpInputRef = useRef(null);

  const toast = useToast();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const resetForm = () => {
    setPhone('');
    setOtp('');
    setOtpSent(false);
  };

  const [sendOtp, { isLoading: sendingOtp }] = useSendOtpMutation();
  const [triggerTrackStatus, { isLoading: trackingLoader }] =
    useLazyTrackStatusQuery();

//auto focus for otp
  useEffect(() => {
    if (otpSent) {
      otpInputRef.current?.focus();
    }
  }, [otpSent]);

  const handleSendOtp = async () => {
    if (!isValidMobile(phone)) return;

    try {
      const data = await sendOtp({ number: phone, tsFlag: true }).unwrap();
      setOtpSent(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    if (!otp) {
      showToast({
        title: 'OTP Required',
        description: 'Please enter the OTP before proceeding.',
        status: 'warning'
      });
      return;
    }

    try {
      const data = await triggerTrackStatus({
        mobile: phone,
        otp,
      }).unwrap();

      if (data) {
        dispatch(trackStatus(data));
        navigate('/status-pending');
        handleClose();
      }
    } catch (error) {
      showToast({
        title: 'Please check your number',
        description:
          error?.data?.detail ||
          'This Mobile number is not registered.',
        status: 'error'
      });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isCentered
      initialFocusRef={phoneInputRef}
    >
      <ModalOverlay />
      <ModalContent maxW="400px" p={deloitte_theme.paddingX}>
        <ModalHeader p={deloitte_theme.paddingY}>Track Status</ModalHeader>
        <ModalCloseButton />
        <ModalBody p={deloitte_theme.paddingY}>
          <VStack spacing={4} align="stretch">   
            <FormControl>
              <FormLabel>Phone Number</FormLabel>
              <Input
                ref={phoneInputRef}
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value.replace(/\D/g, '').slice(0, 10)
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendOtp();
                  }
                }}
              />
            </FormControl>

            <Button
              colorScheme="blue"
              onClick={handleSendOtp}
              isLoading={sendingOtp}
            >
              Send OTP
            </Button>

            {otpSent && (
              <>
                <FormControl>
                  <FormLabel>OTP</FormLabel>
                  <Input
                    ref={otpInputRef}
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                </FormControl>

                <Button
                  colorScheme="green"
                  onClick={handleSubmit}
                  isDisabled={!otp}
                  isLoading={trackingLoader}
                >
                  Proceed
                </Button>
              </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TrackStatusModal;
