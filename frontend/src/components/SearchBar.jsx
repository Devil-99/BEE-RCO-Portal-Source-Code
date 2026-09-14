import { Flex, Input, Button } from "@chakra-ui/react";
import { FaSearch } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import deloitte_theme from "../theme";

const SearchBar = ({ value, onChange, placeholder = "Search...", isOpen, onToggle, inputMode }) => {
    return (
        <Flex position="relative" align="center">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="search-input"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 250, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        style={{ overflow: "hidden", position: "absolute", right: "45px" }}
                    >
                        <Input
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            inputMode={inputMode}
                            size="md"
                            borderColor="gray.300"
                            bg={deloitte_theme.white}
                            _focus={{ borderColor: deloitte_theme.buttonPrimary }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            <Button
                zIndex={2}
                p={deloitte_theme.paddingY}
                bg={isOpen ? deloitte_theme.white : deloitte_theme.buttonPrimary}
                border="1px solid"
                borderColor={deloitte_theme.buttonHoverPrimary}
                _hover={{ backgroundColor: deloitte_theme.buttonHoverPrimary }}
                onClick={onToggle}
            >
                <FaSearch />
            </Button>
        </Flex>
    );
};

export default SearchBar;
