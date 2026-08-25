import { useReactFlow } from '@xyflow/react';

const DEFAULT_CATEGORIES = [
  { id: 'subject', name: 'Subject', defaultValue: 'Teekanne' },
  { id: 'location', name: 'Location', defaultValue: 'Leerer Raum' },
  { id: 'lighting', name: 'Lighting', defaultValue: 'Punktlicht' },
  { id: 'camera', name: 'Camera', defaultValue: 'Standard Kamera' },
  { id: 'perspective', name: 'Perspective', defaultValue: 'Augenhöhe' },
  { id: 'aspectRatio', name: 'AspectRatio', defaultValue: '1:1' },
  { id: 'style', name: 'Style', defaultValue: 'Minimalismus' },
  { id: 'colorPalette', name: 'ColorPalette', defaultValue: 'Monochrom' },
  { id: 'composition', name: 'Composition', defaultValue: 'Zentriert' },
  { id: 'material', name: 'Material', defaultValue: 'Keramik' },
  { id: 'atmosphere', name: 'Atmosphere', defaultValue: 'Neutral' },
  { id: 'technical', name: 'Technical', defaultValue: 'Low-Poly' },
];

export function useEvaluateNodeText() {
  const { getNode, getEdges } = useReactFlow();
  
  const evaluateNodeText = (
    nodeId: string,
    visited: Set<string> = new Set(),
    sourceHandle?: string | null
  ): string => {
    if (visited.has(nodeId)) return '';
    visited.add(nodeId);

    const node = getNode(nodeId);
    if (!node) return '';

    const allEdges = getEdges();

    // Specific handling for originalPromptNode
    if (node.type === 'originalPromptNode') {
      const extracted =
        (node.data?.values as Record<string, string>) ||
        (node.data?.extractedValues as Record<string, string>) ||
        {};

      if (sourceHandle && sourceHandle !== 'output') {
        const direct = extracted[sourceHandle];
        if (direct !== undefined && direct.trim().length > 0) return direct;

        for (const [k, v] of Object.entries(extracted)) {
          if (k.toLowerCase() === sourceHandle.toLowerCase() && v.trim().length > 0) {
            return v;
          }
        }
      }

      // If no specific category handle requested or connected from main 'output'
      const activeLines = Object.entries(extracted)
        .filter(([_, v]) => v && v.trim().length > 0)
        .map(([k, v]) => `${k}: ${v}`);

      if (activeLines.length > 0) {
        return activeLines.join('\n');
      }

      return (node.data?.prompt as string) || (node.data?.text as string) || '';
    }

    // Specific handling for elementNode
    if (node.type === 'elementNode') {
      const summary = DEFAULT_CATEGORIES.map((cat) => {
        const edge = allEdges.find(
          (e) => e.target === nodeId && (e.targetHandle === cat.id || e.targetHandle === cat.name)
        );
        let val = '';
        if (edge) {
          val = evaluateNodeText(edge.source, new Set(visited), edge.sourceHandle).trim();
        }
        if (!val) {
          val =
            (node.data?.values as any)?.[cat.id] ??
            (node.data?.activeValues as any)?.[cat.id] ??
            cat.defaultValue;
        }
        return `${cat.name}: ${val}`;
      }).join('\n');

      return summary;
    }
    
    if (node.type === 'imageToTextNode' || node.type === 'videoToTextNode') {
      return (
        (node.data?.text as string) ||
        (node.data?.prompt as string) ||
        (node.data?.generatedText as string) ||
        ''
      );
    }

    const directText =
      (node.data?.prompt as string) ||
      (node.data?.generatedText as string) ||
      (node.data?.value as string) ||
      (node.data?.text as string) ||
      '';

    const incomingEdges = allEdges.filter((e) => e.target === nodeId);

    if (incomingEdges.length === 0) {
      return directText;
    }

    incomingEdges.sort((a, b) => {
      const handleCompare = (a.targetHandle || '').localeCompare(b.targetHandle || '');
      if (handleCompare !== 0) return handleCompare;
      
      const nodeA = getNode(a.source);
      const nodeB = getNode(b.source);
      const yA = nodeA?.position?.y || 0;
      const yB = nodeB?.position?.y || 0;
      return yA - yB;
    });
    
    const upstreamTexts = incomingEdges
      .map((edge) => evaluateNodeText(edge.source, new Set(visited), edge.sourceHandle))
      .filter((t) => t.trim().length > 0);
    
    if (directText && upstreamTexts.length > 0) {
      return `${upstreamTexts.join('\n\n')}\n\n${directText}`;
    }
    
    if (upstreamTexts.length > 0) {
      if (node.type === 'rerouteNode') {
        return upstreamTexts.join(', ');
      }
      return upstreamTexts.join('\n\n');
    }

    return directText;
  };

  return evaluateNodeText;
}
