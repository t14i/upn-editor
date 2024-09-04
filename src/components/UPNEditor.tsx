import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  updateEdge,  // updateEdgeをここに追加
  Connection,
  Edge,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  OnConnectStartParams,
  ConnectingHandle,
  HandleType,
  useReactFlow,
  ReactFlowInstance,
  ReactFlowProvider,
  EdgeProps, // EdgePropsをここに追加
  ConnectionMode,  // ConnectionModeをインポートに追加
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import ActivityNode, { AdditionalInfo } from './nodes/ActivityNode'; // AdditionalInfoをインポート
import CustomEdge, { CustomEdgeProps } from './edges/CustomEdge';
import { Textarea } from '@/components/ui/textarea';
import sampleObject from '../sample-object.json'; // sample-object.jsonをインポート

const nodeTypes: NodeTypes = {
  activity: ActivityNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge as React.ComponentType<EdgeProps>,
};

const UPNEditorContent: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [connectingHandle, setConnectingHandle] = useState<ConnectingHandle | null>(null);
  const [notes, setNotes] = useState('');
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const { setViewport } = useReactFlow();
  const [flowObject, setFlowObject] = useState('');

  const onConnectStart = useCallback((_: React.MouseEvent, params: OnConnectStartParams) => {
    if (params.nodeId) {
      setConnectingHandle({
        nodeId: params.nodeId,
        handleId: params.handleId || '',
        type: params.handleType || 'source', // nullの場合は'source'をデフォルト値として使用
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
        }
      }
      setConnectingHandle(null);
    },
    [connectingHandle, setEdges]
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

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const addActivityNode = () => {
    const newNode = {
      id: (nodes.length + 1).toString(),
      type: 'activity',
      position: { x: contextMenu.x, y: contextMenu.y },
      data: {
        label: '',
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

  const onEdgeLabelChange = useCallback((edgeId: string, newLabel: string) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? { ...edge, data: { ...edge.data, label: newLabel } }
          : edge
      )
    );
  }, [setEdges]);

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
    // sampleEdgesの型をEdge<any>[]に変換
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

  return (
    <div className="h-screen flex flex-col relative">
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
          connectionMode={ConnectionMode.Loose}  // ここを修正
          onInit={setRfInstance}
        >
          <Controls />
          <Background />
        </ReactFlow>
        {contextMenu.visible && (
          <div
            style={{
              position: 'absolute',
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              zIndex: 1000,
            }}
            className="bg-white border rounded shadow-lg p-2"
          >
            <Button onClick={addActivityNode}>New activity</Button>
          </div>
        )}
      </div>
      <div 
        className="absolute bottom-4 right-4 w-[400px] h-[600px] flex flex-col"
        style={{ zIndex: 1000 }}
      >
        <div className="mb-2">
          <Button onClick={onSave} className="mr-2">Save</Button>
          <Button onClick={onRestore} className="mr-2">Restore</Button>
          <Button onClick={onRestoreSample}>Restore Sample</Button>
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

const UPNEditor: React.FC = () => (
  <ReactFlowProvider>
    <UPNEditorContent />
  </ReactFlowProvider>
);

export default UPNEditor;