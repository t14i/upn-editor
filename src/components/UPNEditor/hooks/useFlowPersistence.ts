import { useState, useCallback, useEffect } from 'react';
import { Node, Edge, Viewport } from 'reactflow';
import { useRouter } from 'next/navigation';

interface FlowData {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
}

interface InitialData {
  nodes: Node[];
  edges: Edge[];
  flowName: string;
  note: string;
}

export const useFlowPersistence = (initialFlowId: string | null) => {
  const [flowId, setFlowId] = useState<string | null>(initialFlowId);
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [noteContent, setNoteContent] = useState('');
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [initialData, setInitialData] = useState<InitialData | null>(null);

  const router = useRouter();

  const fetchFlow = useCallback(async (id: string) => {
    const response = await fetch(`/api/getFlow?id=${id}`);
    const data = await response.json();
    if (data.data) {
      const fetchedNodes = data.data.flow_data.nodes || [];
      const fetchedEdges = data.data.flow_data.edges || [];
      const fetchedFlowName = data.data.name;
      const fetchedNote = data.data.note || '';
      const fetchedViewport = data.data.flow_data.viewport;

      setFlowName(fetchedFlowName);
      setNoteContent(fetchedNote);
      setFlowId(id);
      setInitialData({ nodes: fetchedNodes, edges: fetchedEdges, flowName: fetchedFlowName, note: fetchedNote });

      return {
        nodes: fetchedNodes,
        edges: fetchedEdges,
        viewport: fetchedViewport,
        flowName: fetchedFlowName,
        note: fetchedNote,
      };
    }
    return null;
  }, []);

  const saveFlow = useCallback(async (flowData: FlowData): Promise<boolean> => {
    const payload = {
      name: flowName,
      flow_data: flowData,
      note: noteContent
    };

    try {
      let response;
      if (flowId) {
        response = await fetch('/api/updateFlow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: flowId }),
        });
      } else {
        response = await fetch('/api/createFlow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        const result = await response.json();
        console.log('Saved to Supabase:', result.data);
        if (result.data && result.data[0]) {
          setFlowId(result.data[0].id);
        }
        setInitialData({ 
          nodes: flowData.nodes, 
          edges: flowData.edges, 
          flowName, 
          note: noteContent 
        });
        setIsUnsaved(false);
        return true;
      } else {
        console.error('Error saving to Supabase:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Network error:', error);
      return false;
    }
  }, [flowId, flowName, noteContent]);

  const isDataChanged = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    if (!initialData) return false;
    
    const nodesChanged = JSON.stringify(currentNodes) !== JSON.stringify(initialData.nodes);
    const edgesChanged = JSON.stringify(currentEdges) !== JSON.stringify(initialData.edges);
    const flowNameChanged = flowName !== initialData.flowName;
    const noteChanged = noteContent !== initialData.note;

    return nodesChanged || edgesChanged || flowNameChanged || noteChanged;
  }, [initialData, flowName, noteContent]);

  useEffect(() => {
    if (initialFlowId && initialFlowId !== 'new') {
      fetchFlow(initialFlowId);
    } else {
      setInitialData({ nodes: [], edges: [], flowName: 'Untitled Flow', note: '' });
    }
  }, [initialFlowId, fetchFlow]);

  return {
    flowId,
    flowName,
    setFlowName,
    noteContent,
    setNoteContent,
    isUnsaved,
    setIsUnsaved,
    fetchFlow,
    saveFlow,
    isDataChanged,
  };
};