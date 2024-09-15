import { useState, useCallback } from 'react';
import {
  Node,
  Edge,
  Connection,
  addEdge,
  updateEdge,
  OnConnect,
  useNodesState,
  useEdgesState,
  ReactFlowInstance,
  MarkerType,
} from 'reactflow';

// AdditionalInfo の型定義をインラインで行う
type AdditionalInfo = { key: string; value: string };

export const useNodeEdgeManagement = (initialNodes: Node[] = [], initialEdges: Edge[] = []) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const onInit = useCallback((reactFlowInstance: ReactFlowInstance) => {
    setRfInstance(reactFlowInstance);
  }, []);

  const onEdgeLabelChange = useCallback((edgeId: string, newLabel: string) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? { ...edge, data: { ...edge.data, label: newLabel } }
          : edge
      )
    );
  }, [setEdges]);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      console.log('Connection attempt:', connection);

      if (connection.source && connection.target && connection.sourceHandle && connection.targetHandle) {
        const newEdge = {
          id: `e${connection.source}-${connection.target}-${connection.sourceHandle}-${connection.targetHandle}`,
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          type: 'custom',
          animated: true,
          style: { stroke: '#555' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#555',
          },
          data: { 
            label: 'New Edge',
            onLabelChange: onEdgeLabelChange
          },
        };
        setEdges((eds) => addEdge(newEdge, eds));
        console.log('Edge added successfully:', newEdge);
      } else {
        console.error('Failed to add edge. Missing required information:', connection);
      }
    },
    [setEdges, onEdgeLabelChange]
  );

  const onEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((els) => updateEdge(oldEdge, newConnection, els));
    },
    [setEdges]
  );

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  }, [setNodes]);

  const addNode = useCallback((type: 'activity' | 'start' | 'end', position: { x: number, y: number }) => {
    const newNodeId = `${type}-${Date.now()}`;
    const newNodeNumber = nodes.filter(node => node.type === 'activity').length + 1;
    const newNode = {
      id: newNodeId,
      type: type,
      position: position,
      data: {
        label: type === 'start' ? 'Start' : type === 'end' ? 'End' : '',
        verbPhrase: '',
        resources: [],
        additionalInfo: [],
        isNew: true,
        nodeNumber: type === 'activity' ? newNodeNumber : undefined,
        onChange: (newText: string, newAdditionalInfo: AdditionalInfo[]) => {
          updateNodeData(newNodeId, { 
            verbPhrase: newText, 
            label: newText, 
            additionalInfo: newAdditionalInfo,
            isNew: false
          });
        },
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [nodes, setNodes, updateNodeData]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

  const addStickyNote = useCallback((position: { x: number, y: number }) => {
    const newNodeId = `memo-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: 'stickyNote',
      position: position,
      data: {
        content: '',
        onChange: (id: string, content: string) => {
          updateNodeData(id, { content });
        },
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes, updateNodeData]);

  const deleteStickyNote = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
  }, [setNodes]);

  const reverseEdge = useCallback((edgeId: string) => {
    console.log('Reversing edge:', edgeId); // デバッグログ
    setEdges((eds) => {
      let edgeToReverse;
      if (edgeId === 'custom') {
        // 'custom'の場合、最後に追加されたエッジを逆転させる
        edgeToReverse = eds[eds.length - 1];
      } else {
        edgeToReverse = eds.find(edge => edge.id === edgeId);
      }
      if (!edgeToReverse) {
        console.error(`Edge with id ${edgeId} not found`);
        return eds;
      }
      const updatedEdges = eds.map((edge) => {
        if (edge === edgeToReverse) {
          console.log('Original edge:', edge); // デバッグログ
          const { source, target, sourceHandle, targetHandle } = edge;
          const reversedEdge = {
            ...edge,
            id: `e${target}-${source}-${targetHandle}-${sourceHandle}`,
            source: target,
            target: source,
            sourceHandle: targetHandle,
            targetHandle: sourceHandle,
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#555',
            },
          };
          console.log('Reversed edge:', reversedEdge); // デバッグログ
          return reversedEdge;
        }
        return edge;
      });
      console.log('Updated edges:', updatedEdges); // デバッグログ
      return updatedEdges;
    });
  }, [setEdges]);

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
  }, [setEdges]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,  // setEdges を追加
    onNodesChange,
    onEdgesChange,
    onConnect,
    onEdgeUpdate,
    onEdgeLabelChange,
    updateNodeData,
    addNode,
    deleteNode,
    addStickyNote,
    deleteStickyNote,
    reverseEdge,
    deleteEdge,
    rfInstance,
    onInit,
  };
};