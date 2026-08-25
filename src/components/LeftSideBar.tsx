import { useRef, useEffect } from 'react';
import { useLayoutStore } from '../store/LayoutStore';
import { useStatusStore } from '../store/StatusStore';
import { PanelHeader, CollapsibleSection } from './widgets/PanelWidget';
import { SideBarNode } from 'flow/nodes/ModularNode';
import { Pill } from 'lucide-react';

export const LeftSidebar: React.FC = () => {
  const { leftSidebarOpen, leftSidebarWidth, setLeftSidebarWidth, setLeftSidebarOpen } = useLayoutStore();
  const { setText, clearText } = useStatusStore();
  const isResizing = useRef(false);

  const DEFAULT_WIDTH = 260;
  const HANDLE_TEXT_OPENED = 'LeftMouse: Resize / DoubleClick: Reset';
  const HANDLE_TEXT_CLOSED = 'SingleClick: Open';

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const minWidth = 260;
      const maxWidth = 800;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
      setLeftSidebarWidth(newWidth);
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
  }, [setLeftSidebarWidth]);

  if (!leftSidebarOpen) {
    return (
      <div className="flex flex-row w-[9px] h-full shrink-0">
        <div className="flex w-[2px] h-full bg-[#0070e0]" />
        <div
          className="flex grow w-full h-full bg-[#111] border-r-2 border-[#111] hover:border-[#0070e0]"
          onMouseEnter={() => setText(HANDLE_TEXT_CLOSED)}
          onMouseLeave={() => clearText()}
          onMouseDown={(e) => {
            e.preventDefault();
            setLeftSidebarOpen(true);
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex flex-row h-full shrink-0 select-none"
      style={{ width: leftSidebarWidth }}
    >
      <div className="flex flex-col grow w-full h-full bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent_70%)] overflow-hidden">

        <PanelHeader title="NODES" extras={true} />

        <div className="flex flex-col w-full flex-1 overflow-y-auto overflow-x-hidden">
          <CollapsibleSection title="Function" defaultOpen={true}>
            <SideBarNode type="testNode" label="Test Node" />
            <SideBarNode type="llmNode" label="LLM Task" />
          </CollapsibleSection>

        </div>
      </div>

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
          setLeftSidebarWidth(DEFAULT_WIDTH);
        }}
      />
    </div>
  );
};
