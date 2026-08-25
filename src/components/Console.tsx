import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Trash2,
    Search,
    X,
    Copy,
    Check,
    ArrowDownToLine,
    ChevronRight,
    ChevronDown,
    AlertCircle,
    AlertTriangle,
    Terminal as TerminalIcon,
    Maximize2,
    Minimize2,
    Play,
} from 'lucide-react';
import { useConsoleStore } from '../store/ConsoleStore';
import { useLayoutStore } from '../store/LayoutStore';

type ConsoleTab = 'output' | 'problems' | 'debug';

export const ConsolePanel: React.FC = () => {
    const { consoleOpen, setConsoleOpen, consoleHeight, setConsoleHeight } = useLayoutStore();
    const {
        logs,
        clearLogs,
        filterText,
        setFilterText,
        filterLevel,
        setFilterLevel,
        autoScroll,
        toggleAutoScroll,
    } = useConsoleStore();

    const [activeTab, setActiveTab] = useState<ConsoleTab>('output');
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
    const [copied, setCopied] = useState(false);
    const [commandInput, setCommandInput] = useState('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);

    const scrollRef = useRef<HTMLDivElement>(null);
    const isResizingRef = useRef(false);
    const startYRef = useRef(0);
    const startHeightRef = useRef(0);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (autoScroll && scrollRef.current && consoleOpen) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, autoScroll, consoleOpen]);

    // Handle panel vertical resizing
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current) return;
            const deltaY = startYRef.current - e.clientY;
            const newHeight = Math.max(100, Math.min(window.innerHeight - 180, startHeightRef.current + deltaY));
            setConsoleHeight(newHeight);
        };

        const handleMouseUp = () => {
            if (isResizingRef.current) {
                isResizingRef.current = false;
                document.body.style.cursor = 'default';
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [setConsoleHeight]);

    const errorCount = useMemo(
        () => logs.filter((l) => l.level === 'error').reduce((sum, l) => sum + l.count, 0),
        [logs]
    );
    const warnCount = useMemo(
        () => logs.filter((l) => l.level === 'warn').reduce((sum, l) => sum + l.count, 0),
        [logs]
    );
    const logCount = useMemo(
        () =>
            logs
                .filter((l) => l.level === 'log' || l.level === 'info' || l.level === 'debug')
                .reduce((sum, l) => sum + l.count, 0),
        [logs]
    );

    const filteredLogs = useMemo(() => {
        return logs.filter((entry) => {
            // Tab-specific filter
            if (activeTab === 'problems' && entry.level !== 'error' && entry.level !== 'warn') {
                return false;
            }

            // Level filter button
            if (filterLevel === 'error' && entry.level !== 'error') return false;
            if (filterLevel === 'warn' && entry.level !== 'warn') return false;
            if (filterLevel === 'log' && (entry.level === 'error' || entry.level === 'warn')) return false;

            // Text search query
            if (filterText.trim()) {
                const query = filterText.toLowerCase();
                const msgMatch = entry.message.toLowerCase().includes(query);
                const stackMatch = entry.stack ? entry.stack.toLowerCase().includes(query) : false;
                const timeMatch = entry.timestamp.includes(query);
                return msgMatch || stackMatch || timeMatch;
            }

            return true;
        });
    }, [logs, activeTab, filterLevel, filterText]);

    const handleCopyAll = async () => {
        const text = filteredLogs
            .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}${l.stack ? `\n${l.stack}` : ''}`)
            .join('\n');
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // ignore
        }
    };

    const toggleLogExpand = (id: string) => {
        setExpandedLogs((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleExecuteCommand = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commandInput.trim()) return;

        const cmd = commandInput.trim();
        setCommandHistory((prev) => [...prev, cmd]);
        setHistoryIndex(-1);
        setCommandInput('');

        console.log(`> ${cmd}`);
        try {
            const result = window.eval(cmd);
            if (result !== undefined) {
                console.log(result);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length === 0) return;
            const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
            setHistoryIndex(nextIdx);
            setCommandInput(commandHistory[nextIdx]);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex === -1) return;
            const nextIdx = historyIndex + 1;
            if (nextIdx >= commandHistory.length) {
                setHistoryIndex(-1);
                setCommandInput('');
            } else {
                setHistoryIndex(nextIdx);
                setCommandInput(commandHistory[nextIdx]);
            }
        }
    };

    if (!consoleOpen) return null;

    const currentHeight = isExpanded ? window.innerHeight - 120 : consoleHeight;

    return (
        <div
            style={{ height: `${currentHeight}px` }}
            className="flex flex-col w-full bg-[#18181c] border-t border-[#000] shadow-2xl select-text shrink-0 text-slate-200 z-20"
        >
            {/* ─── Resizer Bar ───────────────────────────────────────────────────── */}
            <div
                onMouseDown={(e) => {
                    e.preventDefault();
                    isResizingRef.current = true;
                    startYRef.current = e.clientY;
                    startHeightRef.current = consoleHeight;
                    document.body.style.cursor = 'row-resize';
                }}
                className="flex items-center justify-center h-[5px] w-full bg-[#111] hover:bg-[#0070e0]/80 cursor-row-resize transition-colors shrink-0 group"
                title="Drag to resize console"
            >
                <div className="w-10 h-[1.5px] bg-[#333] group-hover:bg-white/80 rounded-full transition-colors" />
            </div>

            {/* ─── Panel Header (Matches LIESEL PanelHeader aesthetics) ─────────── */}
            <div className="flex items-center justify-between bg-[#1e1e1e] border-b border-[#000] h-[28px] shrink-0 select-none px-1">
                {/* Left Tabs */}
                <div className="flex items-center h-full gap-0">
                    <button
                        onClick={() => setActiveTab('output')}
                        className={`flex items-center gap-1.5 h-full px-3 text-xs font-semibold uppercase tracking-wider transition-colors border-r border-[#000] ${activeTab === 'output'
                            ? 'bg-[#2a2a2a] border-t-2 border-t-orange-500 text-white'
                            : 'text-[#888] hover:text-[#ddd] hover:bg-[#252525]'
                            }`}
                    >
                        <TerminalIcon size={12} className={activeTab === 'output' ? 'text-orange-400' : 'text-[#777]'} />
                        <span>Output</span>
                        <span className="text-[9px] px-1 py-[0.5px] rounded bg-[#181818] border border-[#333] text-[#aaa] font-mono">
                            {logs.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('problems')}
                        className={`flex items-center gap-1.5 h-full px-3 text-xs font-semibold uppercase tracking-wider transition-colors border-r border-[#000] ${activeTab === 'problems'
                            ? 'bg-[#2a2a2a] border-t-2 border-t-orange-500 text-white'
                            : 'text-[#888] hover:text-[#ddd] hover:bg-[#252525]'
                            }`}
                    >
                        <span>Problems</span>
                        {errorCount > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] px-1 py-[0.5px] rounded bg-red-950/80 border border-red-800/60 text-red-300 font-mono">
                                <AlertCircle size={9} className="text-red-400" />
                                {errorCount}
                            </span>
                        )}
                        {warnCount > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] px-1 py-[0.5px] rounded bg-amber-950/80 border border-amber-800/60 text-amber-300 font-mono">
                                <AlertTriangle size={9} className="text-amber-400" />
                                {warnCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('debug')}
                        className={`flex items-center gap-1.5 h-full px-3 text-xs font-semibold uppercase tracking-wider transition-colors border-r border-[#000] ${activeTab === 'debug'
                            ? 'bg-[#2a2a2a] border-t-2 border-t-orange-500 text-white'
                            : 'text-[#888] hover:text-[#ddd] hover:bg-[#252525]'
                            }`}
                    >
                        <span>Debug REPL</span>
                    </button>
                </div>

                {/* Right Controls & Filter Bar */}
                <div className="flex items-center gap-1.5 pr-1">
                    {/* Level Filter Buttons */}
                    <div className="flex items-center bg-[#121212] border border-[#2e2e2e] rounded p-[1px] text-[9px] font-mono">
                        <button
                            onClick={() => setFilterLevel('all')}
                            className={`px-1.5 py-[1px] rounded transition-colors ${filterLevel === 'all'
                                ? 'bg-[#2a2a2a] text-white font-bold border border-[#444]'
                                : 'text-[#888] hover:text-[#ccc]'
                                }`}
                            title="Alle Meldungen"
                        >
                            ALL ({logs.length})
                        </button>
                        <button
                            onClick={() => setFilterLevel('error')}
                            className={`flex items-center gap-1 px-1.5 py-[1px] rounded transition-colors ${filterLevel === 'error'
                                ? 'bg-red-950 text-red-300 border border-red-700 font-bold'
                                : 'text-[#888] hover:text-red-300'
                                }`}
                            title="Nur Fehler"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            ERR ({errorCount})
                        </button>
                        <button
                            onClick={() => setFilterLevel('warn')}
                            className={`flex items-center gap-1 px-1.5 py-[1px] rounded transition-colors ${filterLevel === 'warn'
                                ? 'bg-amber-950 text-amber-300 border border-amber-700 font-bold'
                                : 'text-[#888] hover:text-amber-300'
                                }`}
                            title="Nur Warnungen"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            WARN ({warnCount})
                        </button>
                        <button
                            onClick={() => setFilterLevel('log')}
                            className={`flex items-center gap-1 px-1.5 py-[1px] rounded transition-colors ${filterLevel === 'log'
                                ? 'bg-[#1e293b] text-sky-300 border border-sky-700 font-bold'
                                : 'text-[#888] hover:text-sky-300'
                                }`}
                            title="Nur Standard-Logs"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                            LOG ({logCount})
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex items-center">
                        <Search size={11} className="absolute left-1.5 text-gray-500 pointer-events-none" />
                        <input
                            type="text"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            placeholder="Filter..."
                            className="w-[140px] bg-[#121212] border border-[#2e2e2e] focus:border-[#0070e0] rounded pl-5 pr-4 py-[1px] text-[10px] text-gray-200 placeholder-gray-500 focus:outline-none"
                        />
                        {filterText && (
                            <button
                                onClick={() => setFilterText('')}
                                className="absolute right-1 text-gray-500 hover:text-gray-300"
                                title="Filter löschen"
                            >
                                <X size={10} />
                            </button>
                        )}
                    </div>

                    <div className="h-3.5 w-[1px] bg-[#333]" />

                    {/* Auto-Scroll */}
                    <button
                        onClick={toggleAutoScroll}
                        className={`flex items-center justify-center w-5 h-5 rounded border transition-colors cursor-pointer ${autoScroll
                            ? 'bg-[#0070e0] border-[#0070e0] text-white shadow-sm'
                            : 'bg-[#2a2a2a] hover:bg-[#333] border-[#333] hover:border-[#444] text-[#aaa]'
                            }`}
                        title={autoScroll ? 'Auto-Scroll: AKTIV' : 'Auto-Scroll: INAKTIV'}
                    >
                        <ArrowDownToLine size={11} />
                    </button>

                    {/* Copy All */}
                    <button
                        onClick={handleCopyAll}
                        className="flex items-center justify-center w-5 h-5 rounded bg-[#2a2a2a] hover:bg-[#333] border border-[#333] hover:border-[#444] text-[#aaa] hover:text-[#fff] transition-colors cursor-pointer"
                        title="Alle Logs kopieren"
                    >
                        {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    </button>

                    {/* Clear Console */}
                    <button
                        onClick={clearLogs}
                        className="flex items-center justify-center w-5 h-5 rounded bg-[#2a2a2a] hover:bg-[#333] border border-[#333] hover:border-[#444] text-[#aaa] hover:text-red-400 transition-colors cursor-pointer"
                        title="Konsole leeren"
                    >
                        <Trash2 size={11} />
                    </button>

                    {/* Expand / Minimize */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center justify-center w-5 h-5 rounded bg-[#2a2a2a] hover:bg-[#333] border border-[#333] hover:border-[#444] text-[#aaa] hover:text-[#fff] transition-colors cursor-pointer"
                        title={isExpanded ? 'Verkleinern' : 'Maximieren'}
                    >
                        {isExpanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
                    </button>

                    {/* Close Panel */}
                    <button
                        onClick={() => setConsoleOpen(false)}
                        className="flex items-center justify-center w-5 h-5 rounded bg-[#2a2a2a] hover:bg-red-900/60 border border-[#333] hover:border-red-700 text-[#aaa] hover:text-white transition-colors cursor-pointer"
                        title="Konsole schließen"
                    >
                        <X size={11} />
                    </button>
                </div>
            </div>

            {/* ─── Log Content Viewport ─────────────────────────────────────────── */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden p-1.5 font-mono text-[11px] leading-relaxed space-y-[1px] bg-[#141416]"
            >
                {filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 py-6 gap-2 select-none">
                        <TerminalIcon size={24} className="text-zinc-700 stroke-[1.5]" />
                        <p className="text-[11px] text-zinc-500 font-sans">Keine Konsolenausgaben vorhanden</p>
                        <div className="flex gap-2 mt-1">
                            <button
                                onClick={() => {
                                    console.log('LIESEL Signal Engine OK', { sampleRate: 44100, bufferSize: 512 });
                                }}
                                className="px-2 py-0.5 text-[10px] rounded bg-[#222] hover:bg-[#2a2a30] border border-[#333] text-gray-300 transition-colors cursor-pointer"
                            >
                                Test log
                            </button>
                            <button
                                onClick={() => {
                                    console.warn('Canvas Graph: Node position snapped to grid boundary');
                                }}
                                className="px-2 py-0.5 text-[10px] rounded bg-amber-950/40 hover:bg-amber-950/60 border border-amber-800/40 text-amber-300 transition-colors cursor-pointer"
                            >
                                Test warn
                            </button>
                            <button
                                onClick={() => {
                                    console.error(new Error('Signal Graph Exception: Missing input pin reference'));
                                }}
                                className="px-2 py-0.5 text-[10px] rounded bg-red-950/40 hover:bg-red-950/60 border border-red-800/40 text-red-300 transition-colors cursor-pointer"
                            >
                                Test error
                            </button>
                        </div>
                    </div>
                ) : (
                    filteredLogs.map((entry) => {
                        const isErr = entry.level === 'error';
                        const isWarn = entry.level === 'warn';
                        const isExpandedEntry = !!expandedLogs[entry.id];
                        const hasExpandableContent = !!entry.stack || entry.message.includes('\n');

                        let rowBg = 'hover:bg-[#1c1c20] text-gray-300';
                        let badgeBg = 'bg-[#222] text-[#999] border-[#333]';
                        let borderAccent = 'border-l-2 border-transparent';

                        if (isErr) {
                            rowBg = 'bg-red-950/15 hover:bg-red-950/25 text-red-200';
                            badgeBg = 'bg-red-950/80 text-red-300 border-red-800/80 font-bold';
                            borderAccent = 'border-l-2 border-red-500';
                        } else if (isWarn) {
                            rowBg = 'bg-amber-950/15 hover:bg-amber-950/25 text-amber-200';
                            badgeBg = 'bg-amber-950/80 text-amber-300 border-amber-800/80 font-bold';
                            borderAccent = 'border-l-2 border-amber-500';
                        }

                        return (
                            <div
                                key={entry.id}
                                className={`group flex flex-col py-[1px] px-1.5 rounded-sm transition-colors ${rowBg} ${borderAccent}`}
                            >
                                <div className="flex items-start gap-1.5 min-w-0">
                                    {/* Expand button */}
                                    {hasExpandableContent ? (
                                        <button
                                            onClick={() => toggleLogExpand(entry.id)}
                                            className="text-gray-500 hover:text-gray-300 mt-0.5 shrink-0 cursor-pointer"
                                        >
                                            {isExpandedEntry ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                        </button>
                                    ) : (
                                        <div className="w-2.5 shrink-0" />
                                    )}

                                    {/* Timestamp */}
                                    <span className="text-zinc-600 text-[10px] select-none shrink-0">{entry.timestamp}</span>

                                    {/* Level Badge */}
                                    <span
                                        className={`text-[8.5px] px-1 py-[0.5px] rounded border uppercase font-mono tracking-wider shrink-0 ${badgeBg}`}
                                    >
                                        {entry.level === 'error' ? 'ERR' : entry.level === 'warn' ? 'WARN' : entry.level.toUpperCase()}
                                    </span>

                                    {/* Message Content */}
                                    <div className="flex-1 min-w-0 break-words whitespace-pre-wrap selection:bg-[#0070e0]/40">
                                        {isExpandedEntry || !entry.message.includes('\n')
                                            ? entry.message
                                            : entry.message.split('\n')[0] + ' ...'}
                                    </div>

                                    {/* Repetition Count */}
                                    {entry.count > 1 && (
                                        <span className="px-1.5 py-[0.5px] text-[8.5px] font-bold rounded-full bg-[#0070e0]/20 border border-[#0070e0]/50 text-sky-300 shrink-0 select-none">
                                            x{entry.count}
                                        </span>
                                    )}
                                </div>

                                {/* Expanded Stack Trace */}
                                {isExpandedEntry && entry.stack && (
                                    <div className="mt-1 ml-5 p-2 bg-[#0d0d10] border border-red-900/40 rounded text-[10px] text-red-300/80 whitespace-pre-wrap overflow-x-auto selection:bg-red-800/40 font-mono">
                                        {entry.stack}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* ─── Bottom Command Input / REPL Prompt ───────────────────────────── */}
            <form
                onSubmit={handleExecuteCommand}
                className="flex items-center gap-2 px-2 py-1 bg-[#18181c] border-t border-[#000] shrink-0"
            >
                <span className="text-orange-500 font-mono font-bold text-xs select-none pl-1">&gt;</span>
                <input
                    type="text"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="JavaScript-Ausdruck ausführen (z. B. console.log(window), 2+2)..."
                    className="flex-1 bg-transparent text-gray-200 font-mono text-[11px] placeholder-gray-600 focus:outline-none selection:bg-[#0070e0]/40"
                />
                {commandInput && (
                    <button
                        type="submit"
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#2a2a2a] hover:bg-[#333] border border-[#333] hover:border-[#444] text-orange-400 text-[10px] font-mono transition-colors cursor-pointer"
                    >
                        <Play size={9} />
                        <span>Run</span>
                    </button>
                )}
            </form>
        </div>
    );
};
