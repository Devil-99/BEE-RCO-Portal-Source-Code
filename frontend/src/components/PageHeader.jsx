import React, { useState, useEffect } from "react";
import logo1 from "../assets/images/logo1.png";
import logo2 from "../assets/images/BEE_logo.png";
import inlineLogo from "../assets/pageheader_images/RCO Logo.png";
import deloitte_theme from "../theme";
import { Button, Menu, MenuButton, MenuList, MenuItem, background } from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";

const PageHeader = () => {
  const [language, setLanguage] = useState("en"); // "en" or "hi"

  // Title text based on language
  // const titleText = language === "hi" ? "राष्ट्रीय आरसीओ पोर्टल" : "National RCO Portal";

  return (
    <header
      className="flex items-center justify-between w-full bg-white border-b shadow-md"
      style={{
        paddingTop: "0.20rem",
        paddingBottom: "0.20rem",
        paddingLeft: deloitte_theme.paddingX,
        paddingRight: deloitte_theme.paddingX,
      }}
    >
      <a className="w-[25%]" href="https://powermin.gov.in/" target="_blank" rel="noopener noreferrer">
        <img
          src={logo1}
          alt="Logo 1"
          className="object-contain"
          style={{ width: "150px"}}
        />
      </a>

      <div className="w-[50%] flex items-center justify-center gap-2">
        <img
          src={inlineLogo}
          alt="Inline Logo"
          className="object-contain"
          style={{ width: "300px" }}
        />
        {/* <h2
          style={{
            fontFamily: "Calibri",
            color: deloitte_theme.black,
            fontWeight: "bold",
            fontSize: "2rem",
            margin: 0,
          }}
        >
          {titleText}
        </h2> */}
      </div>

      <div className="flex items-center justify-center pr-2">
        <Menu>
          <MenuButton w="5.5rem" fontSize="md" fontWeight="normal" p={deloitte_theme.paddingY} as={Button} rightIcon={<ChevronDownIcon />} variant="ghost">
            {language === "hi" ? "हिन्दी" : "English"}
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => setLanguage("en")}>English</MenuItem>
            <MenuItem onClick={() => setLanguage("hi")}>हिन्दी</MenuItem>
          </MenuList>
        </Menu>
      </div>

      <a className="w-[23%]" href="https://beeindia.gov.in/" target="_blank" rel="noopener noreferrer">
        <img
          src={logo2}
          alt="BEE Logo"
          className="object-contain"
          style={{ width: "300px" }}
        />
      </a>
    </header>
  );
};

export default PageHeader;
