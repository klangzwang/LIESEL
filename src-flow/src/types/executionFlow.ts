import type { Edge, Node } from '@xyflow/react';

// ==========================================
// 1. Pin Types & Definitions
// ==========================================

export type PinCategory = 'execution' | 'data';
export type PinDirection = 'input' | 'output';

/** Supported data types for Data Pins */
export type CustomDataType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';

/** Base Pin Interface */
export interface BasePin {
  id: string;
  name: string;
  label?: string;
  direction: PinDirection;
}

/** Execution Pin - Controls execution flow (Blueprints / ComfyUI exec flow) */
export interface ExecutionPin extends BasePin {
  category: 'execution';
}

/** Data Pin - Passes typed values between nodes */
export interface DataPin<T = unknown> extends BasePin {
  category: 'data';
  dataType: CustomDataType;
  defaultValue?: T;
  value?: T;
}

export type Pin = ExecutionPin | DataPin;

// ==========================================
// 2. Custom Node Data
// ==========================================

export interface ExecutionNodeData {
  label?: string;

  /** Execution Pins (execIn / execOut) */
  execInputs: ExecutionPin[];
  execOutputs: ExecutionPin[];

  /** Data Pins (Values: Strings, Numbers, Booleans, etc.) */
  dataInputs: DataPin[];
  dataOutputs: DataPin[];

  /** Node specific configuration or internal state */
  state?: Record<string, unknown>;

  [key: string]: unknown;
}

/** Specialized React Flow Node using ExecutionNodeData */
export type ExecutionFlowNode = Node<ExecutionNodeData>;

// ==========================================
// 3. Custom Edge Data & Edge Types
// ==========================================

export type FlowEdgeCategory = 'execution' | 'data';

export interface ExecutionEdgeData {
  category: FlowEdgeCategory;
  dataType?: CustomDataType;
  active?: boolean;
  [key: string]: unknown;
}

/** Specialized React Flow Edge using ExecutionEdgeData */
export type ExecutionFlowEdge = Edge<ExecutionEdgeData>;

/** Edge Type Constants for React Flow registration */
export const EDGE_TYPES = {
  EXECUTION: 'execution',
  DATA: 'data',
} as const;

export type EdgeType = (typeof EDGE_TYPES)[keyof typeof EDGE_TYPES];

// ==========================================
// 4. Type-Guards & Helper Utilities
// ==========================================

/** Type-Guard: Checks if a pin is an Execution Pin */
export function isExecutionPin(pin: Pin): pin is ExecutionPin {
  return pin.category === 'execution';
}

/** Type-Guard: Checks if a pin is a Data Pin */
export function isDataPin(pin: Pin): pin is DataPin {
  return pin.category === 'data';
}

/**
 * Type-Guard & Utility: Checks whether an Edge is an Execution Edge.
 * Evaluates edge.type, edge.data.category, or handle ID naming conventions.
 */
export function isExecutionEdge(edge?: Partial<Edge<Record<string, unknown>>> | null): boolean {
  if (!edge) return false;
  if (edge.type === EDGE_TYPES.EXECUTION || edge.type === 'execution') {
    return true;
  }
  if (edge.data?.category === 'execution') {
    return true;
  }
  if (edge.sourceHandle?.startsWith('exec') || edge.targetHandle?.startsWith('exec')) {
    return true;
  }
  return false;
}

/** Type-Guard & Utility: Checks whether an Edge is a Data Edge */
export function isDataEdge(edge?: Partial<Edge<Record<string, unknown>>> | null): boolean {
  if (!edge) return false;
  return !isExecutionEdge(edge);
}

/**
 * Validates connection compatibility between source and target handles.
 * Ensures Execution pins ONLY connect to Execution pins, and Data pins ONLY to Data pins.
 */
export function isValidFlowConnection(connection: {
  sourceHandle?: string | null;
  targetHandle?: string | null;
} | null | undefined): boolean {
  if (!connection || !connection.sourceHandle || !connection.targetHandle) return false;

  const isSourceExec = connection.sourceHandle.startsWith('exec');
  const isTargetExec = connection.targetHandle.startsWith('exec');

  // Execution pins must only connect to Execution pins (and Data to Data)
  if (isSourceExec !== isTargetExec) {
    return false;
  }

  return true;
}

// ==========================================
// 5. Factory Helpers (Optional Helpers for Node Building)
// ==========================================

export function createExecPin(id: string, name: string, direction: PinDirection, label?: string): ExecutionPin {
  return {
    id,
    name,
    label: label || name,
    category: 'execution',
    direction,
  };
}

export function createDataPin<T = unknown>(
  id: string,
  name: string,
  direction: PinDirection,
  dataType: CustomDataType,
  defaultValue?: T,
  label?: string
): DataPin<T> {
  return {
    id,
    name,
    label: label || name,
    category: 'data',
    direction,
    dataType,
    defaultValue,
  };
}
