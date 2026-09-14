import React, { useState, useEffect, useRef } from "react";
import firms from "../assets/empaneled_firms.json";
import deloitte_theme from "../theme";

const EmpaneledFirmsComponent = ({ isOpen, onClose }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const autoScrollInterval = useRef(null);
  const resumeTimeout = useRef(null);
  const scrollDirection = useRef(1);
  const userInteracting = useRef(false);

  useEffect(() => {
    setData(firms);
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
  }, [isOpen]);

  const startAutoScroll = () => {
    clearInterval(autoScrollInterval.current);
    scrollDirection.current = 1;
    const el = scrollRef.current;
    if (!el) return;

    autoScrollInterval.current = setInterval(() => {
      if (!scrollRef.current) return;
      if (userInteracting.current) return;

      const container = scrollRef.current;
      if (container.scrollHeight <= container.clientHeight) return;

      container.scrollTop += 1.2 * scrollDirection.current;

      if (scrollDirection.current === 1 && container.scrollTop + container.clientHeight >= container.scrollHeight - 1) {
        scrollDirection.current = -1;
      } else if (scrollDirection.current === -1 && container.scrollTop <= 0) {
        scrollDirection.current = 1;
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
      setTimeout(() => {
        startAutoScroll();
      }, 700);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute z-10" style={{ bottom: "4.5rem", left: 0 }}>
      <div className="flex flex-col bg-white/90 shadow-2xl rounded-xl backdrop-blur-md border border-white/20">
        <div
          className="rounded-t-xl border-b"
          style={{
            background: "linear-gradient(to right, #F2F9F2, #E8F5E9)",
            borderColor: "#C8E6C9"
          }}
        >
          <p
            className="font-bold text-xl py-3 px-4 flex items-center gap-2"
            style={{ color: deloitte_theme.ternary }}
          >
            Empaneled Audit Firms
          </p>
        </div>

        <div
          ref={scrollRef}
          className="px-5 py-4 h-[18rem] overflow-y-auto bg-white/95 rounded-b-xl"
          style={{ scrollBehavior: "smooth", width: "22rem" }}
        >
          {loading ? (
            <p className="text-center text-sm py-4" style={{ color: deloitte_theme.textSecondary }}>
              Loading data...
            </p>
          ) : data.length > 0 ? (
            <ul className="space-y-2">
              {data.map((item) => (
                <li
                  key={item.id}
                  className="border-b last:border-0 pb-3 transition-colors rounded-md px-2"
                  style={{
                    borderColor: "#E8E8E8",
                    backgroundColor: item.id % 2 === 0 ? "#FAFFFA" : "transparent"
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: deloitte_theme.secondary, minWidth: "1.5rem" }}
                    >
                      {item.sr_no}
                    </span>
                    <div className="flex flex-col">
                      <span
                        className="font-medium text-[14px] leading-relaxed"
                        style={{ color: "#333" }}
                      >
                        {item.name}
                      </span>
                      <span className="text-[12px]" style={{ color: deloitte_theme.textSecondary }}>
                        Empanelled No: {item.empanelled_no}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-sm py-4" style={{ color: deloitte_theme.textSecondary }}>
              No data available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export { EmpaneledFirmsComponent };
