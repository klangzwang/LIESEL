//
// Console Store & Monkey Patching for global console.log / warn / error
//

import { create } from 'zustand';

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
    id: string;
    timestamp: string;
    timeRaw: number;
    level: LogLevel;
    message: string;
    args: any[];
    count: number;
    stack?: string;
}

interface ConsoleState {
    logs: LogEntry[];
    filterText: string;
    filterLevel: 'all' | 'log' | 'warn' | 'error';
    autoScroll: boolean;

    // Actions
    addLog: (level: LogLevel, args: any[]) => void;
    clearLogs: () => void;
    setFilterText: (text: string) => void;
    setFilterLevel: (level: 'all' | 'log' | 'warn' | 'error') => void;
    setAutoScroll: (autoScroll: boolean) => void;
    toggleAutoScroll: () => void;
}

function formatArg(arg: any, seen = new WeakSet()): string {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
    if (typeof arg === 'function') return `[Function: ${arg.name || 'anonymous'}]`;
    if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;

    if (typeof arg === 'object') {
        if (seen.has(arg)) return '[Circular Reference]';
        seen.add(arg);
        try {
            return JSON.stringify(arg, (key, value) => {
                if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
                if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) return '[Circular]';
                    seen.add(value);
                }
                return value;
            }, 2);
        } catch {
            return Object.prototype.toString.call(arg);
        }
    }

    return String(arg);
}

function formatTimestamp(): string {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
}

export const useConsoleStore = create<ConsoleState>((set, get) => ({
    logs: [
        {
            id: 'init_welcome',
            timestamp: formatTimestamp(),
            timeRaw: Date.now(),
            level: 'info',
            message: 'LIESEL Studio Console initialized. Listening to runtime logs...',
            args: ['LIESEL Studio Console initialized. Listening to runtime logs...'],
            count: 1,
        }
    ],
    filterText: '',
    filterLevel: 'all',
    autoScroll: true,

    addLog: (level: LogLevel, args: any[]) => {
        const formattedMessage = args.map((a) => formatArg(a)).join(' ');
        const timestamp = formatTimestamp();
        const timeRaw = Date.now();

        // Check if error instance with stack exists
        let stack: string | undefined = undefined;
        for (const a of args) {
            if (a instanceof Error && a.stack) {
                stack = a.stack;
                break;
            }
        }

        set((state) => {
            const prevLogs = state.logs;
            const last = prevLogs[prevLogs.length - 1];

            // Group identical consecutive logs
            if (last && last.level === level && last.message === formattedMessage) {
                const updated = [...prevLogs];
                updated[updated.length - 1] = {
                    ...last,
                    count: last.count + 1,
                    timestamp,
                    timeRaw,
                };
                return { logs: updated };
            }

            // Max buffer size: 1000 logs
            const maxLogs = 1000;
            const newEntry: LogEntry = {
                id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                timestamp,
                timeRaw,
                level,
                message: formattedMessage,
                args,
                count: 1,
                stack,
            };

            const newLogs = prevLogs.length >= maxLogs ? [...prevLogs.slice(1), newEntry] : [...prevLogs, newEntry];
            return { logs: newLogs };
        });
    },

    clearLogs: () => set({ logs: [] }),
    setFilterText: (filterText) => set({ filterText }),
    setFilterLevel: (filterLevel) => set({ filterLevel }),
    setAutoScroll: (autoScroll) => set({ autoScroll }),
    toggleAutoScroll: () => set((s) => ({ autoScroll: !s.autoScroll })),
}));

//
// Monkey Patching Implementation
//
let isPatched = false;
let isInternalLogging = false;

export function setupConsoleMonkeyPatch() {
    if (isPatched || typeof window === 'undefined') return;
    isPatched = true;

    const originalConsole = {
        log: window.console.log,
        info: window.console.info,
        warn: window.console.warn,
        error: window.console.error,
        debug: window.console.debug,
    };

    function createPatchedMethod(level: LogLevel, origFn: (...args: any[]) => void) {
        return function (...args: any[]) {
            // Call original console method so DevTools inspector stays 100% functional
            try {
                origFn.apply(window.console, args);
            } catch {
                // ignore
            }

            // Prevent recursive loop if logger itself triggers console
            if (isInternalLogging) return;
            isInternalLogging = true;

            try {
                useConsoleStore.getState().addLog(level, args);
            } catch (err) {
                origFn.apply(window.console, ['[ConsoleStore Internal Error]', err]);
            } finally {
                isInternalLogging = false;
            }
        };
    }

    window.console.log = createPatchedMethod('log', originalConsole.log);
    window.console.info = createPatchedMethod('info', originalConsole.info);
    window.console.warn = createPatchedMethod('warn', originalConsole.warn);
    window.console.error = createPatchedMethod('error', originalConsole.error);
    window.console.debug = createPatchedMethod('debug', originalConsole.debug);

    // Global uncaught errors
    window.addEventListener('error', (event) => {
        if (isInternalLogging) return;
        isInternalLogging = true;
        try {
            useConsoleStore.getState().addLog('error', [
                `Uncaught ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
                event.error,
            ]);
        } catch {
            // ignore
        } finally {
            isInternalLogging = false;
        }
    });

    // Global unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        if (isInternalLogging) return;
        isInternalLogging = true;
        try {
            useConsoleStore.getState().addLog('error', [
                `Unhandled Promise Rejection: ${event.reason?.message || event.reason || 'Unknown error'}`,
                event.reason,
            ]);
        } catch {
            // ignore
        } finally {
            isInternalLogging = false;
        }
    });
}

// Auto-run monkey patching on module import
setupConsoleMonkeyPatch();
