import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Connection,
  addEdge,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { GenerateNode, RerouteNode, TestNode, LLMNode } from './nodes/ModularNode';

const nodeTypes = {
  generateNode: GenerateNode,
  rerouteNode: RerouteNode,
  testNode: TestNode,
  llmNode: LLMNode,
};

const initialNodes: Node[] = [
  {
    id: 'generate_start_node',
    type: 'generateNode',
    position: { x: 100, y: 150 },
    deletable: false,
    data: { label: 'Generate' },
  },
];

export interface FlowCanvasProps {
  className?: string;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({ className }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, animated: false, type: 'default' }, eds)),
    [setEdges]
  );

  const { screenToFlowPosition, addNodes } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label: `${type} Node` },
      };

      addNodes(newNode);
    },
    [screenToFlowPosition, addNodes]
  );

  const onEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = `reroute_${Date.now()}`;

      const newNode: Node = {
        id: newNodeId,
        type: 'rerouteNode',
        position,
        data: {},
      };

      const newEdge1: Edge = {
        id: `e_${edge.source}-${newNodeId}`,
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: newNodeId,
        targetHandle: 'in',
        type: 'default',
        animated: false,
      };

      const newEdge2: Edge = {
        id: `e_${newNodeId}-${edge.target}`,
        source: newNodeId,
        sourceHandle: 'out',
        target: edge.target,
        targetHandle: edge.targetHandle,
        type: 'default',
        animated: false,
      };

      setNodes((nds) => nds.concat(newNode));
      setEdges((eds) => eds.filter((e) => e.id !== edge.id).concat([newEdge1, newEdge2]));
    },
    [screenToFlowPosition, setNodes, setEdges]
  );

  return (
    <div
      className={`flex flex-col flex-1 w-full h-full min-w-0 min-h-0 overflow-hidden relative ${className || ''}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeDoubleClick={onEdgeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid={true}
        snapGrid={[15, 15]}
        className="bg-[#262626]"
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={['Delete', 'Backspace']}
        panOnDrag={[2]}
        selectionOnDrag={true}
      >
        <Background id="1" gap={15} color="#353535" variant={BackgroundVariant.Lines} />
        <Background id="2" gap={150} color="#161616" variant={BackgroundVariant.Lines} />
        <Background id="3" gap={1500} color="#00000077" variant={BackgroundVariant.Lines} />
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;
