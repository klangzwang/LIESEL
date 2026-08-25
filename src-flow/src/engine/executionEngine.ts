import type { Node, Edge } from '@xyflow/react';
import { isExecutionEdge } from '../types/executionFlow';

// =====================================================================
//  TYPES & INTERFACES
// =====================================================================

export interface ExecutionContext {
  nodes: Node[];
  edges: Edge[];
  /** Map of nodeId -> { outputPinId: value } */
  nodeOutputs: Map<string, Record<string, unknown>>;
  logs: string[];
  setNodes?: (updater: (nodes: Node[]) => Node[]) => void;
  setEdges?: (updater: (edges: Edge[]) => Edge[]) => void;
}

/** Action handler function for a specific node type */
export type NodeActionHandler = (
  inputs: Record<string, unknown>,
  node: Node,
  context: ExecutionContext
) => Promise<Record<string, unknown> | void> | Record<string, unknown> | void;

export interface RunGraphOptions {
  /** Delay in ms between step execution for visual feedback */
  stepDelayMs?: number;
  /** Callback when a node starts executing */
  onNodeHighlight?: (nodeId: string | null) => void;
  /** Callback when an edge is traversed */
  onEdgeHighlight?: (edgeId: string | null) => void;
  /** React Flow state setter for nodes (to update active state) */
  setNodes?: (updater: (nodes: Node[]) => Node[]) => void;
  /** React Flow state setter for edges (to animate active edge) */
  setEdges?: (updater: (edges: Edge[]) => Edge[]) => void;
  /** Custom action handlers for node types */
  customActions?: Record<string, NodeActionHandler>;
}

import { streamLLMGeneration } from '../services/llmService';

// =====================================================================
//  BUILT-IN NODE ACTIONS
// =====================================================================

export const defaultNodeRegistry: Record<string, NodeActionHandler> = {
  generateNode: async () => {
    console.log('⚡ [Engine] GenerateNode triggered execution flow');
    return { out_exec: true };
  },

  testNode: async (inputs, node, context) => {
    const count = ((node.data?.executedCount as number) || 0) + 1;
    const timeStr = new Date().toLocaleTimeString();
    console.log(`🧪 [Engine] TestNode [${node.id}] executed (Count: ${count})`);

    if (context.setNodes) {
      context.setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  executedCount: count,
                  lastExecuted: timeStr,
                },
              }
            : n
        )
      );
    }
    return { out_exec: true, count };
  },

  llmNode: async (inputs, node, context) => {
    const prompt =
      (inputs.prompt as string) ??
      (node.data?.prompt as string) ??
      'Generate a short response for this execution step.';

    console.log(`🤖 [Engine] LLMNode [${node.id}] started generation with prompt: "${prompt}"`);

    // Set generating status
    if (context.setNodes) {
      context.setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  isGeneratingLLM: true,
                  llmOutput: '',
                },
              }
            : n
        )
      );
    }

    let finalOutput = '';
    try {
      finalOutput = await streamLLMGeneration({
        prompt,
        systemPrompt: (node.data?.systemPrompt as string) || undefined,
        onToken: (accumulatedText) => {
          if (context.setNodes) {
            context.setNodes((nds) =>
              nds.map((n) =>
                n.id === node.id
                  ? {
                      ...n,
                      data: {
                        ...n.data,
                        llmOutput: accumulatedText,
                      },
                    }
                  : n
              )
            );
          }
        },
      });
    } finally {
      if (context.setNodes) {
        context.setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    isGeneratingLLM: false,
                    llmOutput: finalOutput,
                  },
                }
              : n
          )
        );
      }
    }

    return { result: finalOutput, out_exec: true };
  },

  rerouteNode: async (inputs) => {
    return inputs;
  },
};

// =====================================================================
//  INPUT RESOLUTION HELPER
// =====================================================================

/** Extract target pin ID from handle ID (e.g. data_string_input_prompt -> prompt) */
export function extractPinId(handleId?: string | null): string {
  if (!handleId) return '';
  const parts = handleId.split('_');
  if (parts.length >= 4) {
    // Format: data_{dataType}_{direction}_{pinId}
    return parts.slice(3).join('_');
  }
  if (parts.length >= 3) {
    // Format: exec_{direction}_{pinId}
    return parts.slice(2).join('_');
  }
  return handleId;
}

/** Resolves incoming data values for a node's input pins */
export function resolveNodeInputs(
  node: Node,
  edges: Edge[],
  nodeOutputs: Map<string, Record<string, unknown>>,
  allNodes: Node[] = []
): Record<string, unknown> {
  const inputs: Record<string, unknown> = {};

  // 1. Resolve values from connected data edges
  const incomingDataEdges = edges.filter(
    (edge) => edge.target === node.id && !isExecutionEdge(edge)
  );

  for (const edge of incomingDataEdges) {
    if (!edge.targetHandle || !edge.sourceHandle) continue;

    const targetPinId = extractPinId(edge.targetHandle);
    const sourcePinId = extractPinId(edge.sourceHandle);

    const sourceNodeOutputs = nodeOutputs.get(edge.source);
    if (sourceNodeOutputs && sourcePinId in sourceNodeOutputs) {
      inputs[targetPinId] = sourceNodeOutputs[sourcePinId];
    } else {
      // Check if source node is a standalone data provider (e.g. TextInputNode)
      const sourceNode = allNodes.find((n) => n.id === edge.source);
      if (sourceNode?.data) {
        const val =
          sourceNode.data.value ??
          sourceNode.data.text ??
          sourceNode.data[sourcePinId];
        if (val !== undefined) {
          inputs[targetPinId] = val;
        }
      }
    }
  }

  // 2. Fallback to default values from pin definitions or node data state
  const dataInputs = (node.data?.dataInputs as Array<{ id: string; value?: unknown; defaultValue?: unknown }>) || [];
  for (const pin of dataInputs) {
    if (!(pin.id in inputs)) {
      inputs[pin.id] = pin.value !== undefined ? pin.value : pin.defaultValue;
    }
  }

  return inputs;
}

// =====================================================================
//  MAIN EXECUTION ENGINE (RUNNER)
// =====================================================================

/**
 * Asynchronously executes the node graph starting from the entry node (GenerateNode).
 */
export async function runGraph(
  nodes: Node[],
  edges: Edge[],
  options: RunGraphOptions = {}
): Promise<ExecutionContext> {
  const {
    stepDelayMs = 400,
    onNodeHighlight,
    onEdgeHighlight,
    setNodes,
    setEdges,
    customActions = {},
  } = options;

  const registry = { ...defaultNodeRegistry, ...customActions };
  const context: ExecutionContext = {
    nodes,
    edges,
    nodeOutputs: new Map(),
    logs: [],
    setNodes,
    setEdges,
  };

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  // 1. Find Entry Node (GenerateNode or node without execInputs)
  const startNode =
    nodes.find((n) => n.type === 'generateNode') ||
    nodes.find((n) => {
      const execIns = (n.data?.execInputs as unknown[]) || [];
      return execIns.length === 0;
    });

  if (!startNode) {
    const msg = '[Engine] Warning: No entry node (GenerateNode) found in graph.';
    console.warn(msg);
    context.logs.push(msg);
    return context;
  }

  let currentNode: Node | undefined = startNode;

  // 2. Sequential Execution Traversal Loop
  while (currentNode) {
    const nodeId = currentNode.id;
    const logMsg = `▶ Executing Node [${nodeId}] (${currentNode.type || 'unknown'})`;
    console.log(logMsg);
    context.logs.push(logMsg);

    // Highlight active Node in UI
    if (onNodeHighlight) onNodeHighlight(nodeId);
    if (setNodes) {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            isExecuting: n.id === nodeId,
          },
        }))
      );
    }

    if (stepDelayMs > 0) {
      await delay(stepDelayMs);
    }

    // Resolve Data Inputs
    const inputs = resolveNodeInputs(currentNode, edges, context.nodeOutputs, nodes);

    // Execute Node Action
    const nodeType = currentNode.type || '';
    const action = registry[nodeType];

    if (action) {
      try {
        const outputs = await action(inputs, currentNode, context);
        if (outputs) {
          context.nodeOutputs.set(nodeId, outputs);
        }
      } catch (err) {
        const errLog = `❌ Execution Error in Node [${nodeId}]: ${err}`;
        console.error(errLog, err);
        context.logs.push(errLog);
        break; // Stop flow execution on error
      }
    }

    // Find outgoing execution edge from current node
    const execEdge = edges.find(
      (e) => e.source === nodeId && isExecutionEdge(e)
    );

    if (execEdge) {
      // Highlight Edge in UI
      if (onEdgeHighlight) onEdgeHighlight(execEdge.id);
      if (setEdges) {
        setEdges((eds) =>
          eds.map((e) => ({
            ...e,
            animated: e.id === execEdge.id,
            style:
              e.id === execEdge.id
                ? { ...e.style, stroke: '#e2c27d', strokeWidth: 3 }
                : e.style,
          }))
        );
      }

      if (stepDelayMs > 0) {
        await delay(stepDelayMs);
      }

      // Move to next node
      currentNode = nodes.find((n) => n.id === execEdge.target);
    } else {
      // End of execution chain
      currentNode = undefined;
    }
  }

  // 3. Clear Highlights when finished
  if (onNodeHighlight) onNodeHighlight(null);
  if (onEdgeHighlight) onEdgeHighlight(null);
  if (setNodes) {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isExecuting: false,
        },
      }))
    );
  }
  if (setEdges) {
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        animated: false,
        style: undefined,
      }))
    );
  }

  context.logs.push('✅ Graph Execution Completed.');
  return context;
}
