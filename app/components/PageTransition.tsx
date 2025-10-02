"use client";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageTransition() {
  const [show, setShow] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
    }, 1800); // ⏱️ 1.6 saniye (daha smooth)
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key={pathname}
          className="fixed inset-0 flex items-center justify-center bg-white z-50"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }} // çıkışta yumuşak fade
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: [0.9, 1.15, 1], opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 1.6, ease: [0.25, 0.1, 0.25, 1] }} // cubic bezier easing
          >
            <Image
              src="/images/Anasayfa/Meryem_Balkan_Logo.jpg"
              alt="Logo"
              width={280}
              height={280}
              priority
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
