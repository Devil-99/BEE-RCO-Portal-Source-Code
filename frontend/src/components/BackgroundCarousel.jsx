import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

import img1 from "../assets/images/1000353647.jpg";
import img2 from "../assets/images/1000353650.jpg";
import img3 from "../assets/images/homepage-14.jpg";
import img4 from "../assets/images/homepage-4.jpg";
import img5 from "../assets/images/homepage-5.jpg";
import img6 from "../assets/images/homepage-7.jpg";
import img7 from "../assets/images/homepage-15.jpg";
import img8 from "../assets/images/homepage-2.jpg";
import img9 from "../assets/images/homepage-9.jpg";


const images = [img1, img2, img3, img4, img5, img6, img7, img8, img9];

const BackgroundCarousel = () => {
  const [[index, direction], setIndex] = useState([0, 1]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(([prevIndex]) => [
        (prevIndex + 1) % images.length,
        1, // direction right
      ]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 1,
      position: "absolute",
    }),
    center: {
      x: "0%",
      opacity: 1,
      position: "absolute",
    },
    exit: (direction) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 1,
      position: "absolute",
    }),
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden -z-10">
      <AnimatePresence custom={direction}>
        <motion.img
          key={index}
          src={images[index]}
          className="full-media w-full h-full object-cover"
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
      </AnimatePresence>
    </div>
  );
};

export default BackgroundCarousel;
