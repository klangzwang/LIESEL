import React from 'react';
import {
  Handle,
  NodeProps,
  Position,
  IsValidConnection,
  useReactFlow,
  useHandleConnections,
} from '@xyflow/react';
import { useStatusStore } from 'store/StatusStore';
import { Route, Play, Circle, FlaskConical, Sparkles } from 'lucide-react';
import {
  ExecutionPin,
  DataPin,
  CustomDataType,
  isValidFlowConnection,
} from '../types/executionFlow';
import { runGraph } from '../engine/executionEngine';

// Helper mapping for Data Pin colors based on data type
export const DATA_TYPE_COLORS: Record<CustomDataType, { bg: string; border: string; text: string }> = {
  string: { bg: 'bg-pink-500', border: 'border-pink-400', text: 'text-pink-400' },
  number: { bg: 'bg-teal-400', border: 'border-teal-300', text: 'text-teal-300' },
  boolean: { bg: 'bg-red-500', border: 'border-red-400', text: 'text-red-400' },
  object: { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-400' },
  array: { bg: 'bg-yellow-400', border: 'border-yellow-300', text: 'text-yellow-300' },
  any: { bg: 'bg-purple-400', border: 'border-purple-300', text: 'text-purple-300' },
};

// =====================================================================
//  PIN HANDLE COMPONENTS
// =====================================================================

interface ExecutionPinHandleProps {
  pin: ExecutionPin;
  isValidConnection?: IsValidConnection;
}

export const ExecutionPinHandle: React.FC<ExecutionPinHandleProps> = ({
  pin,
  isValidConnection = isValidFlowConnection,
}) => {
  const isInput = pin.direction === 'input';
  const handleId = `exec_${pin.direction}_${pin.id}`;

  return (
    <div className={`flex items-center gap-2 py-1 my-0.5 ${isInput ? 'flex-row' : 'flex-row-reverse'}`}>
      <Handle
        type={isInput ? 'target' : 'source'}
        position={isInput ? Position.Left : Position.Right}
        id={handleId}
        isValidConnection={isValidConnection}
        className="!relative !transform-none !top-auto !left-auto !right-auto !bottom-auto !w-4 !h-4 !bg-transparent !border-none flex items-center justify-center cursor-crosshair group z-10"
      >
        <div className="w-3.5 h-3.5 flex items-center justify-center text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.6)] group-hover:scale-125 transition-transform pointer-events-none">
          <Play className="w-3.5 h-3.5 fill-white text-white" />
        </div>
      </Handle>
      <span className="text-xs font-mono font-semibold text-slate-100 tracking-wide select-none">
        {pin.label || pin.name}
      </span>
    </div>
  );
};

interface DataPinHandleProps {
  pin: DataPin;
  isValidConnection?: IsValidConnection;
}

export const DataPinHandle: React.FC<DataPinHandleProps> = ({
  pin,
  isValidConnection = isValidFlowConnection,
}) => {
  const isInput = pin.direction === 'input';
  const handleId = `data_${pin.dataType}_${pin.direction}_${pin.id}`;
  const colorScheme = DATA_TYPE_COLORS[pin.dataType] || DATA_TYPE_COLORS.any;

  return (
    <div className={`flex items-center gap-2 py-1 my-0.5 ${isInput ? 'flex-row' : 'flex-row-reverse'}`}>
      <Handle
        type={isInput ? 'target' : 'source'}
        position={isInput ? Position.Left : Position.Right}
        id={handleId}
        isValidConnection={isValidConnection}
        className="!relative !transform-none !top-auto !left-auto !right-auto !bottom-auto !w-4 !h-4 !bg-transparent !border-none flex items-center justify-center cursor-crosshair group z-10"
      >
        <div
          className={`w-3 h-3 rounded-full ${colorScheme.bg} border ${colorScheme.border} shadow-[0_0_6px_rgba(0,0,0,0.5)] group-hover:scale-125 transition-transform flex items-center justify-center pointer-events-none`}
        >
          <Circle className="w-1.5 h-1.5 fill-slate-900 text-slate-900 opacity-60" />
        </div>
      </Handle>
      <span className="text-xs font-sans text-slate-300 select-none flex items-center gap-1">
        {pin.label || pin.name}
        <span className={`text-[10px] opacity-75 font-mono ${colorScheme.text}`}>
          ({pin.dataType})
        </span>
      </span>
    </div>
  );
};

// =====================================================================
//  FUNCTION NODE COMPONENT
// =====================================================================

export interface FunctionNodeProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  isExecuting?: boolean;
  /** Enables local LLM calculation and automatically adds the Live Generation View */
  hasLLM?: boolean;
  llmOutput?: string;
  isGeneratingLLM?: boolean;
  execInputs?: ExecutionPin[];
  execOutputs?: ExecutionPin[];
  dataInputs?: DataPin[];
  dataOutputs?: DataPin[];
  isValidConnection?: IsValidConnection;
  children?: React.ReactNode;
  className?: string;
}

export const FunctionNode: React.FC<FunctionNodeProps> = ({
  label = 'Function',
  icon,
  selected,
  isExecuting,
  hasLLM = false,
  llmOutput,
  isGeneratingLLM = false,
  execInputs = [],
  execOutputs = [],
  dataInputs = [],
  dataOutputs = [],
  isValidConnection = isValidFlowConnection,
  children,
  className = '',
  ...props
}) => {
  const hasExecPins = execInputs.length > 0 || execOutputs.length > 0;
  const hasDataPins = dataInputs.length > 0 || dataOutputs.length > 0;

  return (
    <div
      className={`flex flex-col min-w-[240px] bg-[#15161b] rounded-lg border text-slate-100 shadow-xl overflow-hidden transition-all duration-150 ${
        isExecuting
          ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
          : selected
          ? 'border-amber-400 ring-2 ring-amber-400/30'
          : 'border-slate-800 hover:border-slate-600'
      } ${className}`}
      {...props}
    >
      {/* Node Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1e2029] border-b border-slate-800/80">
        {icon || <Route className="w-4 h-4 text-amber-400" />}
        <span className="font-semibold text-xs text-slate-100 tracking-wide uppercase font-mono">
          {label}
        </span>
        <span
          className={`ml-auto text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold transition-opacity duration-150 ${
            isExecuting ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          RUNNING
        </span>
      </div>

      {/* Node Body */}
      <div className="flex flex-col p-3 gap-3 bg-[#15161b]">
        {/* 1. Execution Pins Section (Top) */}
        {hasExecPins && (
          <div className="flex justify-between gap-4 pb-2 border-b border-slate-800/50">
            <div className="flex flex-col items-start">
              {execInputs.map((pin) => (
                <ExecutionPinHandle
                  key={pin.id}
                  pin={pin}
                  isValidConnection={isValidConnection}
                />
              ))}
            </div>
            <div className="flex flex-col items-end">
              {execOutputs.map((pin) => (
                <ExecutionPinHandle
                  key={pin.id}
                  pin={pin}
                  isValidConnection={isValidConnection}
                />
              ))}
            </div>
          </div>
        )}

        {/* 2. Data Pins Section (Bottom) */}
        {hasDataPins && (
          <div className="flex justify-between gap-4">
            <div className="flex flex-col items-start">
              {dataInputs.map((pin) => (
                <DataPinHandle
                  key={pin.id}
                  pin={pin}
                  isValidConnection={isValidConnection}
                />
              ))}
            </div>
            <div className="flex flex-col items-end">
              {dataOutputs.map((pin) => (
                <DataPinHandle
                  key={pin.id}
                  pin={pin}
                  isValidConnection={isValidConnection}
                />
              ))}
            </div>
          </div>
        )}

        {/* Custom Inner Content */}
        {children && <div className="mt-1">{children}</div>}

        {/* Automatic LLM Live View Generation Display Area */}
        {hasLLM && (
          <div className="flex flex-col gap-1.5 mt-2 border-t border-slate-800/80 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono font-semibold text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                LLM Live Generation View
              </span>
              <span
                className={`text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono font-bold transition-opacity duration-150 ${
                  isGeneratingLLM ? 'opacity-100 animate-pulse' : 'opacity-0 pointer-events-none'
                }`}
              >
                GENERATING...
              </span>
            </div>

            <div className="w-full min-h-[90px] max-h-[220px] bg-slate-950/90 border border-slate-800 rounded-md p-2.5 text-xs font-mono text-slate-200 overflow-y-auto whitespace-pre-wrap select-text shadow-inner">
              {llmOutput ? (
                llmOutput
              ) : (
                <span className="italic text-slate-600 font-sans text-xs">
                  (Awaiting Execution Flow to trigger LLM generation...)
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================================
//  SIDEBAR NODE COMPONENT
// =====================================================================

interface SideBarNodeProps {
  type: string;
  label: string;
}

export const SideBarNode: React.FC<SideBarNodeProps> = ({ type = '', label = '' }) => {
  const { setText, clearText } = useStatusStore();

  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setText(`Drag ${label} to Canvas`)}
      onMouseLeave={() => clearText()}
      className="flex flex-row w-full h-full p-1"
    >
      <div className="flex items-center pr-2">
        <Route size={16} />
      </div>

      <div className="flex grow font-[Roboto] text-[0.8rem] text-[#d2d2d2] hover:text-[#fff] tracking-wide cursor-pointer transition-colors">
        {label}
      </div>
    </div>
  );
};

// =====================================================================
//  SYSTEM & LLM NODES
// =====================================================================

/** Generate Node - Entry point for graph execution with a Run Button */
export const GenerateNode = ({ selected, data }: NodeProps) => {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const [isRunning, setIsRunning] = React.useState(false);

  const execOutputs = [
    { id: 'out_exec', name: 'Exec', direction: 'output' as const, category: 'execution' as const },
  ];

  const handleRun = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning) return;
    setIsRunning(true);
    try {
      await runGraph(getNodes(), getEdges(), {
        setNodes,
        setEdges,
        stepDelayMs: 400,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <FunctionNode
      label="Generate"
      selected={selected}
      isExecuting={(data?.isExecuting as boolean) || isRunning}
      execOutputs={execOutputs}
    >
      <button
        onClick={handleRun}
        disabled={isRunning}
        className="w-full mt-1 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold px-3 py-1.5 rounded flex items-center justify-center gap-1.5 text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
      >
        <Play className="w-3.5 h-3.5 fill-slate-950" />
        {isRunning ? 'Running...' : 'Run'}
      </button>
    </FunctionNode>
  );
};

export const RerouteNode = ({ selected }: NodeProps) => {
  return (
    <div
      className={`w-3.5 h-3.5 rounded-full bg-[#444] border-2 ${
        selected ? 'border-[#e2c27d]' : 'border-[#111]'
      } relative flex items-center justify-center`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="opacity-0 absolute w-full h-full inset-0 m-0 rounded-full"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="opacity-0 absolute w-full h-full inset-0 m-0 rounded-full"
      />
    </div>
  );
};

/** Test Node - Has ExecIn and ExecOut pins for testing execution flow */
export const TestNode = ({ selected, data }: NodeProps) => {
  const execInputs = [
    { id: 'in_exec', name: 'In', direction: 'input' as const, category: 'execution' as const },
  ];
  const execOutputs = [
    { id: 'out_exec', name: 'Out', direction: 'output' as const, category: 'execution' as const },
  ];

  const executedCount = (data?.executedCount as number) || 0;
  const lastExecuted = (data?.lastExecuted as string) || null;

  return (
    <FunctionNode
      label="Test Node"
      icon={<FlaskConical className="w-4 h-4 text-emerald-400" />}
      selected={selected}
      isExecuting={data?.isExecuting as boolean}
      execInputs={execInputs}
      execOutputs={execOutputs}
    >
      <div className="flex flex-col gap-1 mt-1 bg-slate-900/60 p-2 rounded border border-slate-800 text-xs">
        <div className="flex items-center justify-between text-slate-300">
          <span className="text-[10px] uppercase font-mono text-slate-400">Exec Count:</span>
          <span className="font-mono font-bold text-emerald-400">{executedCount}</span>
        </div>
        {lastExecuted && (
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Last Run:</span>
            <span>{lastExecuted}</span>
          </div>
        )}
      </div>
    </FunctionNode>
  );
};

/** LLM Node - Performs local LLM calculation with live generation view when activated by Execution Flow */
export const LLMNode = ({ id, selected, data }: NodeProps) => {
  const { updateNodeData } = useReactFlow();
  const promptConnections = useHandleConnections({
    type: 'target',
    id: 'data_string_input_prompt',
  });
  const isPromptConnected = promptConnections.length > 0;

  const execInputs = [
    { id: 'in_exec', name: 'Exec In', direction: 'input' as const, category: 'execution' as const },
  ];
  const execOutputs = [
    { id: 'out_exec', name: 'Exec Out', direction: 'output' as const, category: 'execution' as const },
  ];
  const dataInputs = [
    {
      id: 'prompt',
      name: 'Prompt',
      direction: 'input' as const,
      category: 'data' as const,
      dataType: 'string' as const,
    },
  ];
  const dataOutputs = [
    {
      id: 'result',
      name: 'Result',
      direction: 'output' as const,
      category: 'data' as const,
      dataType: 'string' as const,
    },
  ];

  const nodePrompt = (data?.prompt as string) ?? 'Write a short summary for this task.';

  return (
    <FunctionNode
      label="LLM Task"
      icon={<Sparkles className="w-4 h-4 text-purple-400" />}
      selected={selected}
      isExecuting={data?.isExecuting as boolean}
      hasLLM={true}
      llmOutput={data?.llmOutput as string}
      isGeneratingLLM={data?.isGeneratingLLM as boolean}
      execInputs={execInputs}
      execOutputs={execOutputs}
      dataInputs={dataInputs}
      dataOutputs={dataOutputs}
    >
      {!isPromptConnected && (
        <div className="flex flex-col gap-1 mt-1">
          <span className="text-[10px] uppercase font-mono text-slate-400">Node Prompt:</span>
          <textarea
            value={nodePrompt}
            onChange={(e) => updateNodeData(id, { prompt: e.target.value })}
            rows={2}
            placeholder="Enter node prompt..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-purple-400 text-slate-200 text-xs p-2 rounded outline-none font-mono resize-y min-h-[50px]"
          />
        </div>
      )}
    </FunctionNode>
  );
};