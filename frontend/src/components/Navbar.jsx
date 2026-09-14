import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useState, useRef, useEffect } from "react";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
  Button,
  Text,
  Avatar,
  Popover,
  PopoverContent,
  useDisclosure,
  PopoverTrigger,
  PopoverArrow,
  PopoverBody,
  Divider,
  Badge
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

import { IoMdHome, IoMdLogOut } from "react-icons/io";
import { GrStatusInfo } from "react-icons/gr";
import { HiDocument } from "react-icons/hi2";
import { FaUserPlus } from "react-icons/fa";
import { AiOutlineLogin } from "react-icons/ai";
import { MdEmail, MdPhone, MdOutlineHelp } from "react-icons/md";

import deloitte_theme from "../theme";
import TrackStatusModal from "../pages/trackstatus/TrackStatusModal";
import PatCheckModal from "../pages/userAuthentication/PatCheckModal";
import { clearPrefillData, updateEntityField } from "../redux/RegistrationSlice";
import { useLogoutMutation } from "../redux/apiSlices/authApi";
import NotificationModal from "./NotificationModal";
import SupportComponent from "./SupportComponent";
import CircularIcon from "./CircularIcon"
import { formatTime } from "../utils/formatter";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const notificationDisclosure = useDisclosure();
  const [regModalShow, setRegModalShow] = useState(false);
  const userDetails = useSelector((state) => state.login);
  const isLoggedIn = Boolean(userDetails?.full_name)

  const sessionDetails = useSelector((state) => state.session);
  const lastActivitytime = formatTime(sessionDetails?.lastActivity);
  const loginTime = formatTime(sessionDetails?.loginTime);
  const timeLeft = sessionDetails?.timeLeft;
  const timeleftMinute = Math.floor(sessionDetails?.timeLeft / 60);
  const timeleftSecond = sessionDetails?.timeLeft % 60;


  const { pendingFormStatus } = useSelector((state) => state.formState);

  const [logoutApi] = useLogoutMutation();
  const handleLogout = () => {
    try {
      logoutApi().unwrap();
      navigate("/");
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (pendingFormStatus?.length > 0) {
      notificationDisclosure.onOpen();
    } else {
      notificationDisclosure.onClose();
    }
  }, [pendingFormStatus?.length, notificationDisclosure.onOpen, notificationDisclosure.onClose]);

  return (
    <>
      <header className="flex items-center justify-between w-full border-b shadow-sm text-lg z-50"
        style={{
          paddingTop: deloitte_theme.paddingY,
          paddingBottom: deloitte_theme.paddingY,
          paddingLeft: deloitte_theme.paddingX,
          paddingRight: deloitte_theme.paddingX,
          gap: deloitte_theme.gap,
        }}>

        {/* Left section - Navigation */}
        <div className="flex items-center gap-2">
          {
            !isLoggedIn &&
            <Button
              as={Link}
              to="/"
              variant="ghost"
              size="lg"
              px={0}
              py={0}
              display="flex"
              alignItems="center"
              gap={2}
              sx={{
                _focus: { boxShadow: "none", backgroundColor: "transparent" },
                _hover: { backgroundColor: "transparent" },
              }}
              mr={deloitte_theme.paddingX}
            >
              <CircularIcon>
                <IoMdHome className="w-4 h-4 text-white" />
              </CircularIcon>
              <Text fontSize="lg" fontWeight='normal'>Home</Text>
            </Button>
          }

          {/* About Us Dropdown */}
          <Menu>
            <MenuButton
              as={Button}
              paddingLeft={1}
              paddingRight={2}
              variant="ghost"
              colorScheme="gray"
              fontWeight="normal"
              rightIcon={<ChevronDownIcon />}
              size="lg"
              sx={{
                _focus: { boxShadow: "none", backgroundColor: "transparent" },
                _active: { backgroundColor: "transparent" },
                _hover: { backgroundColor: "transparent" },
              }}
            >
              About Us
            </MenuButton>
            <MenuList
              bg="transparent"
              paddingRight={deloitte_theme.paddingX}
              minW="auto"
              w="auto"
              sx={deloitte_theme.glass}
            >
              <MenuItem
                bg="transparent"
                sx={{
                  transition: "transform 0.12s ease",
                  transformOrigin: "left center",
                  willChange: "transform",
                  _hover: { transform: "scale(1.05)" },
                }}
                onClick={() => navigate("/about-bee")}
              >
                About BEE
              </MenuItem>
              <MenuItem
                bg="transparent" sx={{
                  transition: "transform 0.12s ease",
                  transformOrigin: "left center",
                  willChange: "transform",
                  _hover: { transform: "scale(1.05)" },
                }}
                onClick={() => navigate("/about-rco")}
              >
                About RCO
              </MenuItem>
            </MenuList>
          </Menu>

          {/* ----------------------------------
                 SUPPORT POPUP (NOT A MODAL)
          ----------------------------------- */}
          <SupportComponent isLoggedIn={isLoggedIn} />

          {/* ✅ Helpdesk */}
          {isLoggedIn &&
            <Button
              variant="ghost"
              fontWeight="normal"
              size="lg"
              px={2}
              display="flex"
              alignItems="center"
              gap={2}
              aria-label="Bug Report"
              title="Bug Report"
              sx={{
                _focus: { boxShadow: "none", backgroundColor: "transparent" },
                _active: { backgroundColor: "transparent" },
                _hover: { backgroundColor: "transparent" },
              }}
              onClick={() => navigate("/helpdesk")}
            >
              <CircularIcon bg={deloitte_theme.buttonWarning}>
                <MdOutlineHelp className="w-4 h-4 text-white"/>
              </CircularIcon>
              Helpdesk
            </Button>
          }

          <Button
            as="a"
            href="/USER_MANUAL_BEE_RCO_PORTAL_v11052026.pdf"
            target="_self"
            rel="noopener noreferrer"
            size="lg"
            px={deloitte_theme.paddingX}
            mx={isLoggedIn ? 0 : deloitte_theme.paddingX}
            backgroundColor={isLoggedIn ? deloitte_theme.white : deloitte_theme.ternary}
            _hover={isLoggedIn ? { backgroundColor: deloitte_theme.borderColor } : { backgroundColor: deloitte_theme.ternary }}
            color={isLoggedIn ? "black" : "white"}
            display="flex"
            alignItems="center"
            gap={2}
          >
            <CircularIcon bg={isLoggedIn ? deloitte_theme.ternary : deloitte_theme.white} p={6}>
              <HiDocument className="w-4 h-4" color={isLoggedIn ? deloitte_theme.white : deloitte_theme.ternary} />
            </CircularIcon>
            User Manual
          </Button>

        </div>

        {/* Right section */}
        {
          isLoggedIn ?
            (
              <Flex alignItems="center" gap={deloitte_theme.gap}>
                {timeLeft <= 180 && timeLeft > 0 &&
                  <Badge fontSize="lg" colorScheme="red" rounded="md" px={deloitte_theme.paddingY}>{timeLeft}</Badge>
                }
                <NotificationModal
                  isOpen={notificationDisclosure.isOpen}
                  onOpen={notificationDisclosure.onOpen}
                  onClose={notificationDisclosure.onClose}
                />

                <Popover placement="bottom">
                  <PopoverTrigger>
                    <Avatar
                      name={userDetails?.full_name || "User"}
                      bg={deloitte_theme.ternary}
                      color="white"
                      size="sm"
                      cursor="pointer"
                    />
                  </PopoverTrigger>
                  <PopoverContent w="200px" p={0} sx={deloitte_theme.glass}>
                    <PopoverArrow />
                    <PopoverBody>
                      <Flex direction="column" justifyContent="center" gap={1}>
                        <Flex direction="column" align="start" gap={1} w={"full"}>
                          <Text>
                            <span className="font-normal text-sm">Welcome,</span> <br />
                            <span className="font-semibold text-md">{userDetails?.full_name}</span>
                          </Text>
                        </Flex>
                        <Divider />
                        <Flex direction="column" align="start" gap={0} w={"full"}>
                          <Text>
                            <span className="font-normal text-sm">Login time- </span>
                            <span className="font-semibold text-sm">{loginTime}</span>
                          </Text>
                          <Text>
                            <span className="font-normal text-sm">Last activity- </span>
                            <span className="font-semibold text-sm">{lastActivitytime}</span>
                          </Text>
                          <Text>
                            <span className="font-normal text-sm">Time left- </span>
                            <span className="font-semibold text-md">{timeleftMinute}:{String(timeleftSecond).padStart(2, "0")}</span>
                          </Text>
                        </Flex>
                      </Flex>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  h="fit-content"
                  backgroundColor="transparent"
                  textColor={deloitte_theme.black}
                  _hover={{ backgroundColor: "red.200" }}
                  px={deloitte_theme.paddingY}
                  py={deloitte_theme.paddingY}
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <CircularIcon bg={deloitte_theme.textWarning} p={6}>
                    <IoMdLogOut className="w-4 h-4 text-white" />
                  </CircularIcon>
                  <Text fontSize="lg" fontWeight='normal'>Logout</Text>
                </Button>
              </Flex>
            ) :
            (
              <Flex alignItems="center" gap={deloitte_theme.gap}>
                {/* Track Status Button */}
                <Button
                  variant="ghost"
                  size="lg"
                  px={deloitte_theme.paddingX}
                  py={deloitte_theme.paddingY}
                  display="flex"
                  alignItems="center"
                  gap={2}
                  onClick={onOpen}
                  sx={{
                    _focus: { boxShadow: "none", backgroundColor: "transparent" },
                    _hover: { backgroundColor: "transparent" },
                  }}
                >
                  <CircularIcon bg={deloitte_theme.buttonHoverSecondary}>
                    <GrStatusInfo className="w-4 h-4 text-white" />
                  </CircularIcon>
                  <Text fontSize="lg" fontWeight='normal'>Track Status</Text>
                </Button>

                {/* Login Button */}
                <Button
                  size="lg"
                  h={"fit-content"}
                  px={deloitte_theme.paddingX}
                  py={deloitte_theme.paddingY}
                  border={"2px solid"}
                  borderColor={deloitte_theme.buttonPrimary}
                  backgroundColor={"transparent"}
                  color="black"
                  display="flex"
                  alignItems="center"
                  gap={2}
                  sx={{
                    transition: "box-shadow 0.14s ease",
                    _hover: { boxShadow: "2px 2px 5px rgba(40,40,40,0.3)", '.nav-btn-content': { transform: 'scale(1.05)' } },
                  }}
                  onClick={() => navigate("/formpage?type=login")}
                >
                  <span className="nav-btn-content flex items-center gap-2" style={{ transition: "transform 0.12s ease", transformOrigin: "center" }}>
                    <CircularIcon bg={deloitte_theme.ternary} p={6}>
                      <AiOutlineLogin className="w-4 h-4 text-white" />
                    </CircularIcon>
                    <Text fontSize="lg" fontWeight='normal'>Login</Text>
                  </span>
                </Button>

                {/* Registration Button */}

                <Menu>
                  <MenuButton
                    as={Button}
                    h={"fit-content"}
                    size="lg"
                    px={deloitte_theme.paddingX}
                    py={deloitte_theme.paddingY}
                    display="flex"
                    alignItems="center"
                    backgroundColor={deloitte_theme.buttonPrimary}
                    sx={{
                      _focus: { boxShadow: "none", bg: deloitte_theme.buttonHoverPrimary },
                      _active: { bg: deloitte_theme.buttonHoverPrimary },
                      _hover: { bg: deloitte_theme.buttonHoverPrimary },
                    }}
                    onClick={() => dispatch(clearPrefillData())}
                  >
                    <Flex align="center" gap={2}>
                      <CircularIcon bg={deloitte_theme.ternary} p={6}>
                        <FaUserPlus className="w-4 h-4 text-white" />
                      </CircularIcon>
                      <Text fontSize="lg" fontWeight='normal' color="white">Register</Text>
                      <ChevronDownIcon boxSize={4} />
                    </Flex>
                  </MenuButton>

                  <MenuList
                    bg="transparent"
                    minW="auto"
                    w="auto"
                    paddingRight={deloitte_theme.paddingX}
                    sx={deloitte_theme.glass}>
                    <MenuItem
                      bg="transparent"
                      sx={{
                        transition: "transform 0.12s ease",
                        transformOrigin: "left center",
                        willChange: "transform",
                        _hover: { transform: "scale(1.1)" },
                      }}
                      onClick={() => setRegModalShow(true)}
                    >
                      Obligated Entity
                    </MenuItem>
                    <MenuItem
                      bg="transparent"
                      sx={{
                        transition: "transform 0.12s ease",
                        transformOrigin: "left center",
                        willChange: "transform",
                        _hover: { transform: "scale(1.1)" },
                      }}
                      onClick={() => {
                        dispatch(updateEntityField({ name: "isPat", value: "No" }));
                        dispatch(updateEntityField({ name: "entityType", value: "NOBE" }));
                        dispatch(updateEntityField({ name: "state", value: "OT" }));
                        navigate("/formpage?type=register");
                      }}>
                      Non Obligated Entity
                    </MenuItem>
                    <MenuItem
                      bg="transparent"
                      sx={{
                        transition: "transform 0.12s ease",
                        transformOrigin: "left center",
                        willChange: "transform",
                        _hover: { transform: "scale(1.1)" },
                      }}
                      onClick={() => navigate("/formpage?type=registerAEA")}
                    >
                      Accredited Energy Auditor
                    </MenuItem>
                    <MenuItem
                      bg="transparent"
                      sx={{
                        transition: "transform 0.12s ease",
                        transformOrigin: "left center",
                        willChange: "transform",
                        _hover: { transform: "scale(1.1)" },
                      }}
                      onClick={() => navigate("/formpage?type=registerFirm")}
                    >
                      Empanelled Audit Firm
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Flex>
            )
        }
      </header >

      {/* Modals */}
      < TrackStatusModal isOpen={isOpen} onClose={onClose} />

      <PatCheckModal
        isOpen={regModalShow}
        onClose={() => setRegModalShow(false)}
      />
    </>
  );
};

export default Navbar;
