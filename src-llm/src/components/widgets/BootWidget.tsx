import type { LLMEngineState } from 'llm/hooks/useLLMEngine';
import { AnimatedLogo } from '@/components/effects/AnimatedLogo';
import { useState, useEffect } from 'react';
import { Maximize, Copy } from 'lucide-react';
import { ChevronDown, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerAnchor, Version } from '@/components/widgets/VersionWidget';
import { Button } from '@/components/widgets/ButtonWidget';
import { MeteorShowerCanvas } from '@/components/effects/Meteor';

const MenuBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!('__TAURI_INTERNALS__' in window)) return;
    const appWindow = getCurrentWindow();
    appWindow.isMaximized().then(setIsMaximized);

    const unlisten = appWindow.onResized(async () => {
      setIsMaximized(await appWindow.isMaximized());
    });

    return () => {
      unlisten.then((cleanup) => cleanup());
    };
  }, []);

  const handleToggleMaximize = async () => {
    if (!('__TAURI_INTERNALS__' in window)) return;
    const appWindow = getCurrentWindow();
    await appWindow.toggleMaximize();
    setIsMaximized(await appWindow.isMaximized());
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{
          x: "-400px",
          opacity: 0,
        }}
        animate={{
          x: 0,
          opacity: 1,
        }}
        exit={{
          x: '100%',
          opacity: 0,
        }}
        transition={{
          x: {
            type: "spring",
            stiffness: 400,
            damping: 30,
          },
          duration: 1.45,
          opacity: {
            duration: 1.0
          },
          ease: "easeInOut"
        }}
        className="flex flex-col"
      >
        <div className="flex h-[42px] bg-transparent justify-between">

          <div data-tauri-drag-region className="flex w-full items-center font-black text-[2.1rem] tracking-tighter text-[#f9eedf]/80 scale-y-[1.1] -translate-y-0.5 pl-2">
            {/* LIESEL */}
          </div>
          <div className="flex items-center text-[#777] pr-2">
            <Button icon={ChevronDown} onClick={() => { if ('__TAURI_INTERNALS__' in window) getCurrentWindow().hide() }} />
            {isMaximized ? (
              <Button
                icon={Copy}
                onClick={handleToggleMaximize}
              />
            ) : (
              <Button
                icon={Maximize}
                onClick={handleToggleMaximize}
              />
            )}
            <Button icon={X} onClick={() => { if ('__TAURI_INTERNALS__' in window) invoke("close_app") }} />
          </div>

        </div>

      </motion.div>
    </AnimatePresence>
  );
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

interface LLMBootScreenProps {
  engineState: LLMEngineState;
}

export const BootWidget: React.FC<LLMBootScreenProps> = ({ engineState }) => {

  const { status, message, downloadProgress, done, retry } = engineState;
  const percent = downloadProgress?.percent ?? 0;

  return (
    <div className="relative flex flex-col w-full h-full min-h-screen bg-black overflow-hidden select-none">

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 1 }}
        data-tauri-drag-region
        className="flex flex-row w-full h-[42px] items-center"
      >
        <div className="flex grow w-full" />
        <div className="flex z-10">
          <MenuBar />
        </div>
      </motion.div>

      <motion.div
        className="absolute left-1/2 top-1/2 w-64 h-64 z-20 pointer-events-none"
        initial={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <AnimatedLogo
          variant={percent == 0 ? "continuous" : "progress"}
          percent={percent}
          className="w-full h-full"
        />
      </motion.div>

      {downloadProgress && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="absolute right-4 bottom-3 w-1/4 flex justify-between text-xs text-slate-400"
        >
          <span>{percent ? `${downloadProgress.percent.toFixed(1)}%` : 'Downloading...'}</span>
          <span>
            {formatBytes(downloadProgress.downloadedBytes)}
            {downloadProgress.totalBytes ? ` / ${formatBytes(downloadProgress.totalBytes)}` : ''}
          </span>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, filter: 'blur(10px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        transition={{ delay: 1, duration: 1.5 }}
        className="absolute left-1/2 -translate-x-16 top-1/2 translate-y-14 flex font-black text-[2.7rem] tracking-tighter text-[#f9eedf]/80 scale-y-[1.1] z-20 pointer-events-none"
      >
        LiESEL
      </motion.div>

      <MeteorShowerCanvas progress={done ? 100 : percent} />

      <div className="flex grow w-full items-center justify-center">

        {/* First radial gradient (pulsates irregularly after 50%) */}
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.03),transparent_70%)]"
          style={{
            filter: `saturate(${done ? 1.0 : percent / 100})`,
            animation: 'pulseRadial1 4.3s ease-in-out infinite alternate',
            transformOrigin: '50% 50%',
          }}
        />

        {/* Second radial gradient (pulsates with asynchronous timing & rhythm after 50%) */}
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.05),transparent_70%)]"
          style={{
            filter: `saturate(${done ? 1.0 : percent / 100})`,
            animation: 'pulseRadial2 6.7s ease-in-out infinite alternate',
            transformOrigin: '20% 30%',
          }}
        />

        <div
          className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]`}
          style={{
            opacity: `${done ? 1.0 : percent / 100}`
          }}
        />

        <div
          className="absolute inset-0 opacity-20 transition-[filter] duration-300 ease-out"
          style={{
            background: 'radial-gradient(ellipse at bottom, #082f49 0%, #020617 80%)',
            filter: `saturate(${done ? 1.0 : percent / 100})`
          }}
        />
        <div
          data-tauri-drag-region
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            filter: `saturate(${done ? 1.0 : percent / 100})`
          }}
        />

      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 70%)',
          filter: `saturate(${done ? 1.0 : percent / 100})`
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
      >
        <Version anchor={CornerAnchor.LowerLeft} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="absolute left-1/2 bottom-3 -translate-x-1/2 text-xs text-slate-400"
      >
        {message}
      </motion.div>

      <style>{`
        @keyframes pulseRadial1 {
          0% {
            transform: scale(1) translate(0px, 0px);
            opacity: 0.6;
          }
          35% {
            transform: scale(1.22) translate(1.5%, -1%);
            opacity: 1.15;
          }
          70% {
            transform: scale(0.92) translate(-1%, 2%);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.15) translate(0.5%, -1.5%);
            opacity: 0.95;
          }
        }

        @keyframes pulseRadial2 {
          0% {
            transform: scale(1) translate(0px, 0px);
            opacity: 0.7;
          }
          45% {
            transform: scale(0.85) translate(-2.5%, 1.5%);
            opacity: 0.45;
          }
          65% {
            transform: scale(1.28) translate(2%, -2%);
            opacity: 1.25;
          }
          100% {
            transform: scale(1.08) translate(-1%, -1%);
            opacity: 0.85;
          }
        }

        @keyframes shimmer {
          0%   { left: -33%; }
          100% { left: 100%; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};
