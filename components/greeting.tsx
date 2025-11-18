import { motion } from 'framer-motion';
import type { Session } from 'next-auth';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export const Greeting = ({ session }: { session?: Session | null }) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      key="overview"
      className="size-full flex items-center justify-center"
    >
      {/* Logo minimalista estilo adaflow */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex items-center justify-center"
      >
        {mounted && (
          <Image
            src={theme === 'dark' ? '/images/logo-dark.svg' : '/images/logo-light.svg'}
            alt="Logo Adaflow"
            width={250}
            height={250}
            className="object-contain opacity-20"
          />
        )}
      </motion.div>
    </div>
  );
};
