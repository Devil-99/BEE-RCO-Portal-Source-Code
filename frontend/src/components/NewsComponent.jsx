import React, { useState, useEffect, useRef } from "react";
import notices from "../assets/Notices.json";
import deloitte_theme from "../theme";
import CircularIcon from "./CircularIcon";
import { Box, Flex } from "@chakra-ui/react";

import { IoNewspaperOutline } from "react-icons/io5";
import { FaFilePdf, FaFileExcel, FaFileWord, FaLink } from "react-icons/fa6";

const NewsComponent = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const autoScrollInterval = useRef(null);
  const resumeTimeout = useRef(null);
  const userInteracting = useRef(false);

  useEffect(() => {
    setNews(notices);
    setLoading(false);

    startAutoScroll();

    const el = scrollRef.current;
    if (el) {
      el.addEventListener("wheel", handleUserInteraction, { passive: true });
      el.addEventListener("touchstart", handleUserInteraction, { passive: true });
      el.addEventListener("pointerdown", handleUserInteraction, { passive: true });
    }

    return () => {
      clearInterval(autoScrollInterval.current);
      clearTimeout(resumeTimeout.current);

      if (el) {
        el.removeEventListener("wheel", handleUserInteraction);
        el.removeEventListener("touchstart", handleUserInteraction);
        el.removeEventListener("pointerdown", handleUserInteraction);
      }
    };
  }, []);

  const startAutoScroll = () => {
    clearInterval(autoScrollInterval.current);
    const el = scrollRef.current;
    if (!el) return;

    autoScrollInterval.current = setInterval(() => {
      if (!scrollRef.current) return;
      if (userInteracting.current) return;

      const container = scrollRef.current;

      if (container.scrollHeight <= container.clientHeight) return;

      container.scrollTop += 1.5;

      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 1) {
        clearInterval(autoScrollInterval.current);

        container.scrollTo({ top: 0, behavior: "smooth" });

        setTimeout(() => {
          startAutoScroll();
        }, 1000);
      }
    }, 40);
  };

  const handleUserInteraction = () => {
    userInteracting.current = true;
    clearInterval(autoScrollInterval.current);
    clearTimeout(resumeTimeout.current);

    resumeTimeout.current = setTimeout(() => {
      userInteracting.current = false;

      const el = scrollRef.current;
      if (!el) {
        startAutoScroll();
        return;
      }

      el.scrollTo({ top: 0, behavior: "smooth" });

      setTimeout(() => {
        startAutoScroll();
      }, 700);
    }, 1500);
  };

  const isDownloadable = (url) => {
    return url.endsWith(".xlsx") || url.endsWith(".docx");
  };

  const renderIcon = (item) => {
    if (item.endsWith(".pdf")) {
      return <FaFilePdf size={20} />;
    }
    if (item.endsWith(".xlsx")) {
      return <FaFileExcel size={20} />;
    }
    if (item.endsWith(".docx")) {
      return <FaFileWord size={20} />;
    }
    return <FaLink size={20} />;
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-start items-center rounded-md" style={{
        backgroundColor: deloitte_theme.primary,
        padding: deloitte_theme.paddingX,
        gap: deloitte_theme.gap
      }}>
        <CircularIcon bg={deloitte_theme.ternary}>
          <IoNewspaperOutline className="w-5 h-5 text-white" />
        </CircularIcon>
        <p className="font-bold text-xl flex items-center"
          style={{
            color: deloitte_theme.ternary
          }}>
          What's New
        </p>
      </div>

      <div
        ref={scrollRef}
        className="h-[28rem] overflow-y-auto flex flex-col"
        style={{
          scrollBehavior: "smooth",
          padding: deloitte_theme.paddingY,
          gap: deloitte_theme.gap
        }}
      >
        {loading ? (
          <p className="text-center text-gray-500 text-sm py-4">Loading news...</p>
        ) : news.length > 0 ?
          news.map((item) => (
            <Flex gap={deloitte_theme.gap} py={deloitte_theme.paddingY} px={deloitte_theme.paddingX} sx={deloitte_theme.glass} >
              <div className="flex justify-center items-center">
                {renderIcon(item.value)}
              </div>
              <a
                href={item.value}
                target={isDownloadable(item.value) ? "_self" : "_blank"}
                rel="noopener noreferrer"
                download={isDownloadable(item.value) ? true : undefined}
              >
                <span>{item.label}</span>
              </a>
            </Flex>
          ))
          : (
            <p className="text-gray-500 text-center text-sm py-4">No news available.</p>
          )}
      </div>
    </div>
  );
};

export { NewsComponent };
