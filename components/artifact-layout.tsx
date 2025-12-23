'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useWindowSize } from 'usehooks-ts';
import { useSidebar } from './ui/sidebar';
import type { UIArtifact } from './artifact';
import type { ReactNode } from 'react';

interface ArtifactLayoutProps {
  artifact: UIArtifact;
  isCurrentVersion: boolean;
  isMobile: boolean;
  sidebar: ReactNode;
  content: ReactNode;
}

export function ArtifactLayout({
  artifact,
  isCurrentVersion,
  isMobile,
  sidebar,
  content,
}: ArtifactLayoutProps) {
  const { open: isSidebarOpen } = useSidebar();
  const { width: windowWidth, height: windowHeight } = useWindowSize();

  return (
    <AnimatePresence>
      {artifact.isVisible && (
        <motion.div
          data-testid="artifact"
          className="flex flex-row h-dvh w-dvw fixed top-0 left-0 z-50 bg-transparent"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.4 } }}
        >
          {!isMobile && (
            <motion.div
              className="fixed bg-background h-dvh"
              initial={{
                width: isSidebarOpen ? (windowWidth || 0) - 256 : windowWidth || 0,
                right: 0,
              }}
              animate={{ width: windowWidth || 0, right: 0 }}
              exit={{
                width: isSidebarOpen ? (windowWidth || 0) - 256 : windowWidth || 0,
                right: 0,
              }}
            />
          )}

          {!isMobile && (
            <motion.div
              className="relative w-[400px] bg-muted dark:bg-background h-dvh shrink-0"
              initial={{ opacity: 0, x: 10, scale: 1 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
                transition: {
                  delay: 0.2,
                  type: 'spring',
                  stiffness: 200,
                  damping: 30,
                },
              }}
              exit={{
                opacity: 0,
                x: 0,
                scale: 1,
                transition: { duration: 0 },
              }}
            >
              <AnimatePresence>
                {!isCurrentVersion && (
                  <motion.div
                    className="left-0 absolute h-dvh w-[400px] top-0 bg-zinc-900/50 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>
              {sidebar}
            </motion.div>
          )}

          <motion.div
            className="fixed dark:bg-muted bg-background h-dvh flex flex-col overflow-y-scroll md:border-l dark:border-zinc-700 border-zinc-200"
            initial={{
              opacity: 1,
              x: artifact.boundingBox.left,
              y: artifact.boundingBox.top,
              height: artifact.boundingBox.height,
              width: artifact.boundingBox.width,
              borderRadius: 50,
            }}
            animate={
              isMobile
                ? {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    height: windowHeight || 0,
                    width: windowWidth || 'calc(100dvw)',
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: 'spring',
                      stiffness: 200,
                      damping: 30,
                      duration: 5000,
                    },
                  }
                : {
                    opacity: 1,
                    x: 400,
                    y: 0,
                    height: windowHeight || 0,
                    width: windowWidth
                      ? windowWidth - 400
                      : 'calc(100dvw-400px)',
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: 'spring',
                      stiffness: 200,
                      damping: 30,
                      duration: 5000,
                    },
                  }
            }
            exit={{
              opacity: 0,
              scale: 0.5,
              transition: {
                delay: 0.1,
                type: 'spring',
                stiffness: 600,
                damping: 30,
              },
            }}
          >
            {content}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

