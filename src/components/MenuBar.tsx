import { useState, useEffect } from 'react';
import { Save, FolderOpen, FilePlus, Settings, Maximize, Copy, Dot, Cpu, Server, LucidePanelBottom, LucidePanelLeft, LucidePanelRight } from 'lucide-react';
import { ChevronDown, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { useReactFlow } from '@xyflow/react';
import { useLayoutStore } from 'store/LayoutStore';
import { useDocumentStore } from 'store/DocumentStore';
import { useLLMEngine } from 'llm/hooks/useLLMEngine';
import { StatusButton } from '@/components/widgets/ButtonWidget';
import { DividerVertical } from './widgets/DividerWidget';

export const MenuBar: React.FC = () => {

    const { leftSidebarOpen, rightSidebarOpen, consoleOpen, toggleLeftSidebar, toggleRightSidebar, toggleConsole } = useLayoutStore();
    const { createNew, openDocument, saveDocument } = useDocumentStore();
    const [isMaximized, setIsMaximized] = useState(false);
    const { setNodes } = useReactFlow();
    const engineState = useLLMEngine();

    const isReady = engineState.status === 'ready';

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
        <div className="flex flex-col">

            <div data-tauri-drag-region className="flex flex-row h-[42px] bg-[#222]">

                <div data-tauri-drag-region className="flex w-[340px] items-center pl-2">

                    <StatusButton icon={FilePlus} onClick={createNew} statusText="New Project" />
                    <StatusButton icon={FolderOpen} onClick={openDocument} statusText="Open Project" />
                    <StatusButton icon={Save} onClick={saveDocument} statusText="Save Project" />
                    <StatusButton icon={Dot} onClick={() => { }} disabled={true} statusText="" />
                    <StatusButton icon={Dot} onClick={() => { }} disabled={true} statusText="" />
                    <StatusButton icon={Dot} onClick={() => { }} disabled={true} statusText="" />

                </div>

                <div data-tauri-drag-region className="flex grow items-center justify-start gap-4 pr-4">

                    <div data-tauri-drag-region className="flex items-center font-black text-[2.1rem] tracking-tighter text-[#f9eedf]/80 scale-y-[1.1] -translate-y-0.5 select-none">
                        LIESEL
                    </div>

                    {/* LLM & Server Status Display */}
                    <div className="flex items-center gap-3 bg-[#18181c] border border-[#2e2e34] px-3 py-1 rounded-lg shadow-sm">

                        {/* LLM Model Info */}
                        <div className="flex items-center gap-2 pr-3 border-r border-[#2e2e34]">
                            <Cpu size={14} className="text-indigo-400 shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold leading-none">LLM Model</span>
                                <span className="text-[11px] text-gray-200 font-bold font-mono leading-tight">Llama-3.2-3B-Instruct</span>
                            </div>
                            <div className="flex items-center gap-1.5 ml-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                                <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-emerald-400 shadow-[0_0_6px_#10b981] animate-pulse' : 'bg-amber-400'}`} />
                                <span>{isReady ? 'Läuft' : engineState.status}</span>
                            </div>
                        </div>

                        {/* Server Status */}
                        <div className="flex items-center gap-2">
                            <Server size={14} className="text-blue-400 shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold leading-none">Server</span>
                                <span className="text-[11px] text-gray-200 font-bold font-mono leading-tight">llama-server (8080)</span>
                            </div>
                            <div className="flex items-center gap-1.5 ml-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                                <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-rose-500'}`} />
                                <span>{isReady ? 'Gestartet (OK)' : 'Gestoppt'}</span>
                            </div>
                        </div>

                    </div>

                </div>

                <div className="flex items-center text-[#777] pr-2">
                    <DividerVertical />
                    <StatusButton icon={LucidePanelLeft} onClick={toggleLeftSidebar} active={leftSidebarOpen} statusText="Toggle Left Sidebar" />
                    <StatusButton icon={LucidePanelBottom} onClick={toggleConsole} active={consoleOpen} statusText="Toggle Console" />
                    <StatusButton icon={LucidePanelRight} onClick={toggleRightSidebar} active={rightSidebarOpen} statusText="Toggle Right Sidebar" />
                    <DividerVertical />
                    <StatusButton icon={Settings} onClick={() => {
                        setNodes((nodes) => nodes.map(n => ({ ...n, selected: false })));
                        toggleRightSidebar();
                    }} statusText="Settings" />
                    <DividerVertical />
                    <StatusButton icon={ChevronDown} onClick={() => { if ('__TAURI_INTERNALS__' in window) getCurrentWindow().hide() }} statusText="Hide Window" />
                    {isMaximized ? (
                        <StatusButton
                            icon={Copy}
                            onClick={handleToggleMaximize}
                            statusText="Restore Window"
                        />
                    ) : (
                        <StatusButton
                            icon={Maximize}
                            onClick={handleToggleMaximize}
                            statusText="Maximize Window"
                        />
                    )}
                    <StatusButton icon={X} onClick={() => { if ('__TAURI_INTERNALS__' in window) invoke("close_app") }} statusText="Close Window" />
                </div>

            </div>

            <div className="flex w-full h-[4px] bg-[#111]" />
        </div>
    );
};
