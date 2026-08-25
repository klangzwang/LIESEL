import { createRoot } from 'react-dom/client';
import { MenuBar } from './components/MenuBar';
import { StatusBar } from './components/StatusBar';
import { RightSidebar } from './components/RightSideBar';
import { LeftSidebar } from './components/LeftSideBar';
import { FlowCanvas } from 'flow/FlowCanvas';
import { BootWidget } from 'llm/components/widgets/BootWidget';
import { useDocumentStore } from './store/DocumentStore';
import { useLLMEngine } from 'llm/hooks/useLLMEngine';
import { ReactFlowProvider } from '@xyflow/react';

import '@css/style.css';
import { CanvasHeader } from './components/widgets/PanelWidget';
import { Cog, LucideAd } from 'lucide-react';
import { useState } from 'react';

const CurrentCanvas = ({page}: any) => {
    switch (page) {
        case 0:
            return (
                <FlowCanvas />
            );
        case 1:
            return (
                <iframe
                    src="https://labs.google/fx/de/tools/flow"
                    className="w-full h-full border-0 bg-[#151515]"
                    title="Google Flow"
                    allow="microphone; camera; clipboard-write;"
                />
            );
    }
};

if (typeof window !== 'undefined') {
  const originalErrorHandler = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (
      typeof message === 'string' &&
      (message.includes('ResizeObserver loop completed with undelivered notifications') ||
        message.includes('ResizeObserver loop limit exceeded'))
    ) {
      return true;
    }
    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }
    return false;
  };
}

export function Editor() {
  const [activeCanvas, setActiveCanvas] = useState<number>(0);
  const documentId = useDocumentStore((state) => state.documentId);
  const engineState = useLLMEngine();

  return (
    <ReactFlowProvider>
      <div
        className="flex flex-col h-screen w-screen overflow-hidden bg-[#151515] text-slate-200 font-sans select-none"
        onContextMenu={(e) => e.preventDefault()}
        key={documentId}
      >
        {engineState.status !== 'ready' && engineState.status !== 'developer' ?
          <div className="flex flex-1 overflow-hidden">
            <BootWidget engineState={engineState} />
          </div>
          :
          <>
            <MenuBar />
            <div className="flex flex-1 overflow-hidden">

              <LeftSidebar />

              <div className="flex flex-col w-full h-full">
                <div className="flex flex-row w-full">

                  <div className="flex">
                    <CanvasHeader icon={Cog} title='NodeGraph' onClick={() => setActiveCanvas(0)} />
                  </div>
                  <div className="flex">
                    <CanvasHeader icon={LucideAd} title='GoogleFlow' onClick={() => setActiveCanvas(1)} />
                  </div>
                  <div className="flex grow">
                  </div>

                </div>
                <div className="flex grow h-full">
                  <CurrentCanvas page={activeCanvas} />
                </div>
              </div>

              <RightSidebar />

            </div>
            <StatusBar />
          </>
        }
      </div>
    </ReactFlowProvider>
  );
}

const container = document.getElementById('root')!;
const root = (container as any)._reactRoot || createRoot(container);
(container as any)._reactRoot = root;
root.render(<Editor />);
