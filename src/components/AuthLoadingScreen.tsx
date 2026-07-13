"use client";

import { AnimatePresence, motion } from "framer-motion";

import { BrandIcon } from "@/components/BrandIcon";

const META_GRADIENT = "linear-gradient(90deg, #0064E1, #A033FF, #FF4E7E, #FF9142)";

function MetaWordmark() {
  return (
    <div className="flex items-center gap-1.5">
      <svg viewBox="0 0 120 48" className="h-5 w-12" role="img" aria-label="Meta">
        <defs>
          <linearGradient id="meta-loading-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0064E1" />
            <stop offset="45%" stopColor="#A033FF" />
            <stop offset="75%" stopColor="#FF4E7E" />
            <stop offset="100%" stopColor="#FF9142" />
          </linearGradient>
        </defs>
        <path
          d="M60,24 C60,6 20,6 20,24 C20,42 60,42 60,24 C60,6 100,6 100,24 C100,42 60,42 60,24"
          fill="none"
          stroke="url(#meta-loading-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="bg-clip-text text-xl font-semibold text-transparent"
        style={{ backgroundImage: META_GRADIENT }}
      >
        Meta
      </span>
    </div>
  );
}

export function AuthLoadingScreen({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0e13]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: [1, 1.06, 1], opacity: 1 }}
            transition={{
              opacity: { duration: 0.3 },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <BrandIcon className="h-24 w-24" />
          </motion.div>

          <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
            <span className="text-sm text-neutral-500">from</span>
            <MetaWordmark />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
