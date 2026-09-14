import React from "react";
import { SlEnergy } from "react-icons/sl";
import { MdEnergySavingsLeaf, MdOutlineReport } from "react-icons/md";
import { HiDocumentReport } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import deloitte_theme from "../../../theme";

const icons = [
    SlEnergy,
    MdEnergySavingsLeaf,
    HiDocumentReport,
];

function TabHeader({ activeTab, setActiveTab, tabs }) {
    return (
        <div className="w-full relative py-2">
            {/* Icons + connectors */}
            <div className="flex items-center justify-evenly px-54">
                {tabs.map((tab, index) => {
                    const Icon = icons[index] || MdOutlineReport;
                    const isActive = index === activeTab;
                    const isCompleted = index < activeTab;

                    return (
                        <React.Fragment key={index}>
                            {/* Icon */}
                            <div
                                // onClick={() => setActiveTab(index)}
                                className="flex items-center justify-center cursor-pointer"
                            >
                                <motion.div
                                    layout
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    className="flex items-center justify-center rounded-full"
                                    style={{
                                        width: isActive ? "3rem" : "2.25rem",
                                        height: isActive ? "3rem" : "2.25rem",
                                        backgroundColor: isActive
                                            ? deloitte_theme.buttonPrimary
                                            : "transparent",
                                        border: isActive ? "none" : "1px solid #9ca3af",
                                    }}
                                >
                                    <Icon
                                        size={isActive ? 24 : 20}
                                        className={isActive ? "text-white" : "text-gray-500"}
                                    />
                                </motion.div>
                            </div>

                            {/* Connector */}
                            {index < tabs.length - 1 && (
                                <div className="flex-1 h-[2px] mx-2">
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            backgroundColor: isCompleted ? "#000" : "#9ca3af",
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className="h-full w-full"
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            <div className="flex items-center justify-evenly">
                {tabs.map((tab, index) => {
                    const isActive = index === activeTab;

                    return (
                        <div className="relative h-5 mt-2 overflow-hidden w-full text-center">
                            <AnimatePresence initial={false} mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ x: 40, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -40, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="absolute left-1/2 -translate-x-1/2 text-sm font-medium w-full"
                                    style={{
                                        color: isActive ?  "black":"transparent"
                                    }}
                                >
                                    {tabs[activeTab]?.title}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    )
                })
                }
            </div>
        </div >
    );
}

export default TabHeader;