import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  updateEdge,
  Connection,
  Edge,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  OnConnectStartParams,
  ConnectingHandle,
  useReactFlow,
  ReactFlowInstance,
  ReactFlowProvider,
  EdgeProps,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ActivityNode, { AdditionalInfo } from './nodes/ActivityNode';
import CustomEdge from './edges/CustomEdge';
import { Textarea } from '@/components/ui/textarea';
import sampleObject from '../sample-object.json';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';

const nodeTypes: NodeTypes = {
  activity: ActivityNode,
  start: StartNode,
  end: EndNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge as React.ComponentType<EdgeProps>,
};

interface UPNEditorProps {
  flowId: string | null;
}

const UPNEditorContent: React.FC<UPNEditorProps> = ({ flowId: initialFlowId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [connectingHandle, setConnectingHandle] = useState<ConnectingHandle | null>(null);
  const [notes, setNotes] = useState('');
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const { setViewport } = useReactFlow();
  const [flowObject, setFlowObject] = useState('');
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [flowId, setFlowId] = useState<string | null>(initialFlowId);

  const router = useRouter();

  useEffect(() => {
    if (flowId && flowId !== 'new') {
      const fetchFlow = async () => {
        const response = await fetch(`/api/getFlow?id=${flowId}`);
        const data = await response.json();
        if (data.data) {
          setFlowName(data.data.name);
          setFlowObject(JSON.stringify(data.data.flow_data));
          setNodes(data.data.flow_data.nodes || []);
          setEdges(data.data.flow_data.edges || []);
          if (data.data.flow_data.viewport) {
            setViewport(data.data.flow_data.viewport);
          }
        }
      };
      fetchFlow();
    }
  }, [flowId, setViewport]);

  const onEdgeLabelChange = useCallback((edgeId: string, newLabel: string) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? { ...edge, data: { ...edge.data, label: newLabel } }
          : edge
      )
    );
  }, [setEdges]);

  const onConnectStart = useCallback((_: React.MouseEvent, params: OnConnectStartParams) => {
    if (params.nodeId) {
      setConnectingHandle({
        nodeId: params.nodeId,
        handleId: params.handleId || '',
        type: params.handleType || 'source',
      });
    }
  }, []);

  const onConnectEnd = useCallback(
    (event: MouseEvent) => {
      const targetElement = event.target as HTMLElement;
      const targetHandle = targetElement.closest('.react-flow__handle');
      const targetNode = targetElement.closest('.react-flow__node');

      if (connectingHandle && targetHandle && targetNode) {
        const sourceId = connectingHandle.nodeId;
        const sourceHandle = connectingHandle.handleId;
        const targetId = targetNode.getAttribute('data-id');
        const targetHandleId = targetHandle.getAttribute('data-handleid');

        console.log('Connection attempt:', { sourceId, sourceHandle, targetId, targetHandleId });

        if (sourceId && targetId && sourceHandle && targetHandleId) {
          const newEdge = {
            id: `e${sourceId}-${targetId}-${sourceHandle}-${targetHandleId}`,
            source: sourceId,
            target: targetId,
            sourceHandle: sourceHandle,
            targetHandle: targetHandleId,
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
          console.error('Failed to add edge. Missing required information:', { sourceId, sourceHandle, targetId, targetHandleId });
        }
      } else {
        console.log('Connection attempt failed. Missing required elements:', { connectingHandle, targetHandle, targetNode });
      }
      setConnectingHandle(null);
    },
    [connectingHandle, setEdges, onEdgeLabelChange]
  );

  const onEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((els) => updateEdge(oldEdge, newConnection, els));
    },
    [setEdges]
  );

  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const boundingRect = reactFlowWrapper.current?.getBoundingClientRect();
      if (boundingRect) {
        setContextMenu({
          visible: true,
          x: event.clientX - boundingRect.left,
          y: event.clientY - boundingRect.top,
        });
      }
    },
    [setContextMenu]
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, []);

  const handleOutsideClick = useCallback((event: MouseEvent) => {
    if (reactFlowWrapper.current && !reactFlowWrapper.current.contains(event.target as Node)) {
      closeContextMenu();
    }
  }, [closeContextMenu]);

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [handleOutsideClick]);

  const addNode = (type: 'activity' | 'start' | 'end') => {
    const newNode = {
      id: (nodes.length + 1).toString(),
      type: type,
      position: { x: contextMenu.x, y: contextMenu.y },
      data: {
        label: type === 'start' ? 'Start' : type === 'end' ? 'End' : '',
        verbPhrase: '',
        resources: [],
        additionalInfo: [],
        isNew: true,
        onChange: (newText: string, newAdditionalInfo: AdditionalInfo[]) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === newNode.id
                ? { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      verbPhrase: newText, 
                      label: newText, 
                      additionalInfo: newAdditionalInfo,
                      isNew: false
                    } 
                  }
                : node
            )
          );
        },
      },
    };
    setNodes((nds) => nds.concat(newNode));
    closeContextMenu();
  };

  const onSave = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      setFlowObject(JSON.stringify(flow, null, 2));
    }
  }, [rfInstance]);

  const onRestore = useCallback(() => {
    const flow = JSON.parse(flowObject);
    if (flow) {
      const { x = 0, y = 0, zoom = 1 } = flow.viewport;
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
      setViewport({ x, y, zoom });
    }
  }, [flowObject, setNodes, setEdges, setViewport]);

  const onRestoreSample = useCallback(() => {
    const { nodes: sampleNodes, edges: sampleEdges, viewport } = sampleObject;
    setNodes(sampleNodes || []);
    setEdges((sampleEdges as Edge<any>[]) || []);
    if (viewport) {
      setViewport(viewport);
    }
  }, [setNodes, setEdges, setViewport]);

  useEffect(() => {
    if (rfInstance) {
      onSave();
    }
  }, [rfInstance, nodes, edges, onSave]);

  const saveToSupabase = async () => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      const payload = {
        name: flowName,
        flow_data: flow
      };

      try {
        let response;
        if (flowId) {
          response = await fetch('/api/updateFlow', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...payload, id: flowId }),
          });
        } else {
          response = await fetch('/api/createFlow', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
        }

        if (response.ok) {
          const result = await response.json();
          console.log('Saved to Supabase:', result.data);
          if (result.data && result.data[0]) {
            setFlowId(result.data[0].id);
          }
        } else {
          const errorText = await response.text();
          console.error('Error saving to Supabase:', errorText);
        }
      } catch (error) {
        console.error('Network error:', error);
      }
    }
    router.push('/');
  };

  return (
    <div className="h-screen flex flex-col relative">
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to List</span>
        </Button>
      </div>
      <div className="flex-grow" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnectStart={(event, params) => onConnectStart(event as React.MouseEvent, params)}
          onConnectEnd={(event) => onConnectEnd(event as MouseEvent)}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onContextMenu={onContextMenu}
          onClick={closeContextMenu}
          connectionMode={ConnectionMode.Loose}
          onInit={setRfInstance}
        >
          <Controls />
          <Background />
        </ReactFlow>
        {contextMenu.visible && (
          <DropdownMenu open={true} onOpenChange={(open) => !open && closeContextMenu()}>
            <DropdownMenuTrigger asChild>
              <div style={{
                position: 'absolute',
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y}px`,
                visibility: 'hidden'
              }} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={() => addNode('activity')}>
                アクティビティを追加
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addNode('start')}>
                スタートノードを追加
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addNode('end')}>
                エンドノードを追加
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div 
        className="absolute bottom-4 right-4 w-[400px] h-[600px] flex flex-col"
        style={{ zIndex: 1000 }}
      >
        <div className="mb-2">
          <input
            type="text"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            placeholder="Flow Name"
            className="w-full p-2 border rounded mb-2"
          />
        </div>
        <div className="flex mb-2">
          <Button onClick={onRestore} className="mr-2">Restore</Button>
          <Button onClick={onRestoreSample} className="mr-2">Sample</Button>
          <Button onClick={saveToSupabase}>Save Flow</Button>
        </div>
        <Textarea
          value={flowObject}
          onChange={(e) => setFlowObject(e.target.value)}
          className="w-full flex-grow resize-none"
          placeholder="Flow Objectデータ"
        />
      </div>
    </div>
  );
};

const UPNEditor: React.FC<UPNEditorProps> = (props) => (
  <ReactFlowProvider>
    <UPNEditorContent {...props} />
  </ReactFlowProvider>
);

export default UPNEditor;