import { motion } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

export const PageTransition = forwardRef<HTMLDivElement, { children: ReactNode }>(
  ({ children }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
);

PageTransition.displayName = "PageTransition";
