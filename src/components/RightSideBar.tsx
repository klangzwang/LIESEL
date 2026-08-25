import { useRef, useEffect, useState, useCallback } from 'react';
import { useLayoutStore } from '../store/LayoutStore';
import { useStatusStore } from '../store/StatusStore';
import { PanelHeader } from './widgets/PanelWidget';
import { Sparkles, RotateCcw, Copy, Check, Info } from 'lucide-react';

export const RightSidebar: React.FC = () => {
  const { rightSidebarOpen, rightSidebarWidth, setRightSidebarWidth, setRightSidebarOpen } = useLayoutStore();
  const { setText, clearText } = useStatusStore();
  const isResizing = useRef(false);

  // const { systemPrompt, setSystemPrompt, resetSystemPrompt } = useSystemPromptStore();
  const [copied, setCopied] = useState(false);

  const DEFAULT_WIDTH = 260;
  const HANDLE_TEXT_OPENED = 'LeftMouse: Resize / DoubleClick: Reset';
  const HANDLE_TEXT_CLOSED = 'SingleClick: Open';

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const minWidth = 260;
      const maxWidth = 800;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, window.innerWidth - e.clientX));
      setRightSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setRightSidebarWidth]);

  // const handleCopy = useCallback(() => {
  //   navigator.clipboard.writeText(systemPrompt);
  //   setCopied(true);
  //   setTimeout(() => setCopied(false), 1500);
  // }, [systemPrompt]);

  // const isDefault = systemPrompt === DEFAULT_SYSTEM_PROMPT;
  // const charCount = systemPrompt.length;
  // const wordCount = systemPrompt.trim().split(/\s+/).filter(Boolean).length;

  if (!rightSidebarOpen) {
    return (
      <div className="flex flex-row w-[9px] h-full shrink-0">
        <div
          className="flex grow w-full h-full bg-[#111] border-l-2 border-[#111] hover:border-[#0070e0]"
          onMouseEnter={() => setText(HANDLE_TEXT_CLOSED)}
          onMouseLeave={() => clearText()}
          onMouseDown={(e) => {
            e.preventDefault();
            setRightSidebarOpen(true);
          }}
        />
        <div className="flex w-[2px] h-full bg-[#0070e0]" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-row h-full shrink-0 select-none"
      style={{ width: rightSidebarWidth }}
    >
      <div
        className="flex w-[9px] h-full bg-[#111] cursor-col-resize hover:bg-[#0070e0]/80 transition-colors shrink-0"
        onMouseEnter={() => setText(HANDLE_TEXT_OPENED)}
        onMouseLeave={() => clearText()}
        onMouseDown={(e) => {
          e.preventDefault();
          isResizing.current = true;
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
        }}
        onDoubleClick={() => {
          setRightSidebarWidth(DEFAULT_WIDTH);
        }}
      />

      <div className="flex flex-col grow w-full h-full bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent_70%)] overflow-hidden">

        <PanelHeader title="LLM Settings" extras={false} />

        <div className="flex-1 flex flex-col p-3 overflow-y-auto gap-3">
          {/* Header Card */}
          {/* <div className="flex flex-col gap-1 p-2.5 rounded bg-[#1b1b1b] border border-[#2c2c2c]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-200">
                <Sparkles size={13} className="text-[#0070e0]" />
                <span>Output Node System-Prompt</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-gray-200 transition-colors"
                  title="Prompt kopieren"
                >
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                </button>
                <button
                  onClick={resetSystemPrompt}
                  disabled={isDefault}
                  className={`p-1 rounded transition-colors ${
                    isDefault
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-400 hover:text-amber-400 hover:bg-white/10'
                  }`}
                  title="Auf Standard zurücksetzen"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>

            <div className="text-[11px] text-gray-400 leading-normal flex items-start gap-1 mt-0.5">
              <Info size={12} className="text-gray-500 shrink-0 mt-0.5" />
              <span>
                Steuert, wie das LLM in der OutputNode verbundene Eingaben in AI-Bildgenerierungs-Prompts übersetzt.
              </span>
            </div>
          </div> */}

          {/* Textarea Editor */}
          {/* <div className="flex-1 flex flex-col min-h-[300px]">
            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center justify-between">
              <span>System Prompt</span>
              <span className="font-mono text-[9px] text-gray-500">
                {wordCount} Wörter | {charCount} Zeichen
              </span>
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="flex-1 w-full p-2.5 bg-[#121212] text-gray-200 font-mono text-[11px] leading-relaxed border border-[#2a2a2a] focus:border-[#0070e0] rounded outline-none resize-none selection:bg-[#0070e0]/40"
              placeholder="System-Prompt eingeben..."
              spellCheck={false}
            />
          </div> */}

          {/* Status info */}
          {/* <div className="flex items-center justify-between px-2 py-1.5 bg-[#161616] border border-[#252525] rounded text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isDefault ? 'bg-emerald-500' : 'bg-[#0070e0]'
                }`}
              />
              {isDefault ? 'Standard-Prompt' : 'Benutzerdefiniert'}
            </span>
            {!isDefault && (
              <button
                onClick={resetSystemPrompt}
                className="text-amber-400/80 hover:text-amber-300 underline text-[10px]"
              >
                Reset
              </button>
            )}
          </div> */}
        </div>
      </div>
    </div>
  );
};
