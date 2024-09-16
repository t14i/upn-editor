import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  Controls,
  Background,
  NodeTypes,
  OnConnectStartParams,
  ConnectingHandle,
  ReactFlowProvider,
  ConnectionMode,
  Connection,
  applyEdgeChanges,
  EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ActivityNode from './nodes/ActivityNode';
import CustomEdge from './edges/CustomEdge';
import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';
import SlideInPanel from './SlideInPanel';
import StickyNoteNode from './nodes/StickyNoteNode';
import UPNContextMenu from './UPNEditor/components/UPNContextMenu';
import UPNDialogManager from './UPNEditor/components/UPNDialogManager';
import { useNodeEdgeManagement } from './UPNEditor/hooks/useNodeEdgeManagement';
import { useFlowPersistence } from './UPNEditor/hooks/useFlowPersistence';
import { useViewportManagement } from './UPNEditor/hooks/useViewportManagement';
import UPNToolbar from './UPNEditor/components/UPNToolbar';

const UPNEditorContent: React.FC<UPNEditorProps> = ({ flowId: initialFlowId, isSlideIn = false, onClose }) => {
  const {
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
  } = useFlowPersistence(initialFlowId);

  const {
    nodes,
    edges,
    setNodes,
    setEdges,
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
  } = useNodeEdgeManagement();

  const {
    updateViewport,
    getFlowPosition,
    getCurrentViewport,
  } = useViewportManagement();

  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; nodeId?: string; edgeId?: string }>({ visible: false, x: 0, y: 0 });
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [connectingHandle, setConnectingHandle] = useState<ConnectingHandle | null>(null);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [closeAction, setCloseAction] = useState<'backToList' | 'closeSlideIn' | null>(null);

  const router = useRouter();

  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [newLink, setNewLink] = useState({ name: '', url: '' });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [showEditNumberDialog, setShowEditNumberDialog] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [newNodeNumber, setNewNodeNumber] = useState<number | null>(null);

  useEffect(() => {
    const loadFlow = async () => {
      if (initialFlowId && initialFlowId !== 'new') {
        const flowData = await fetchFlow(initialFlowId);
        if (flowData) {
          // エッジにCustomEdgeタイプを設定
          const updatedEdges = flowData.edges.map(edge => ({
            ...edge,
            type: 'custom',
            data: {
              ...edge.data,
              onLabelChange: onEdgeLabelChange
            }
          }));
          setNodes(flowData.nodes);
          setEdges(updatedEdges);
          if (flowData.viewport) {
            updateViewport(flowData.viewport);
          }
        }
      }
    };
    loadFlow();
  }, [initialFlowId, fetchFlow, setNodes, setEdges, updateViewport, onEdgeLabelChange]);

  useEffect(() => {
    setIsUnsaved(isDataChanged(nodes, edges));
  }, [nodes, edges, isDataChanged, setIsUnsaved]);

  const handleSaveFlow = useCallback(async (): Promise<boolean> => {
    if (rfInstance) {
      const { nodes: currentNodes, edges: currentEdges } = rfInstance.toObject();
      const viewport = getCurrentViewport();
      const saveSuccess = await saveFlow({ nodes: currentNodes, edges: currentEdges, viewport });
      if (!saveSuccess) {
        console.error('Failed to save changes');
      }
      return saveSuccess;
    }
    return false;
  }, [rfInstance, saveFlow, getCurrentViewport]);

  const onConnectStart = useCallback((_: React.MouseEvent | React.TouchEvent, params: OnConnectStartParams) => {
    if (params.nodeId) {
      setConnectingHandle({
        nodeId: params.nodeId,
        handleId: params.handleId || '',
        type: params.handleType || 'source',
      });
    }
  }, []);

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const targetElement = event.target as HTMLElement;
      const targetHandle = targetElement.closest('.react-flow__handle');
      const targetNode = targetElement.closest('.react-flow__node');

      if (connectingHandle && targetHandle && targetNode) {
        const sourceId = connectingHandle.nodeId;
        const sourceHandle = connectingHandle.handleId;
        const targetId = targetNode.getAttribute('data-id');
        const targetHandleId = targetHandle.getAttribute('data-handleid');

        if (sourceId && targetId && sourceHandle && targetHandleId) {
          const connection: Connection = {
            source: sourceId,
            sourceHandle: sourceHandle,
            target: targetId,
            targetHandle: targetHandleId,
          };
          onConnect(connection);
        }
      }
      setConnectingHandle(null);
    },
    [connectingHandle, onConnect]
  );

  const [contextMenuType, setContextMenuType] = useState<'canvas' | 'activity' | 'edge' | 'stickyNote'>('canvas');

  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (rfInstance) {
        const targetElement = event.target as HTMLElement;
        console.log('targetElement:', targetElement);

        let nodeId: string | undefined;
        let edgeId: string | undefined;

        const edge = targetElement.closest('.react-flow__edge-custom');
        const edgeLabel = targetElement.closest('.react-flow__edgelabel')
        if (edge) {
          edgeId = edge.id || edge.querySelector('.react-flow__edge-path')?.id || undefined;
        } else if (edgeLabel) {
          edgeId = edgeLabel.id || undefined;
        }

        const node = targetElement.closest('.react-flow__node');
        if (node) {
          nodeId = node.getAttribute('data-id') || undefined;
        }
        const isActivityNode = node?.classList.contains('react-flow__node-activity');
        const isStickyNoteNode = node?.classList.contains('react-flow__node-stickyNote');

        if (edgeId) {
          setContextMenuType('edge');
        } else if (isActivityNode) {
          setContextMenuType('activity');
          setSelectedNodeId(nodeId || null);
        } else if (isStickyNoteNode) {
          setContextMenuType('stickyNote');
          setSelectedNodeId(nodeId || null);
        } else {
          setContextMenuType('canvas');
        }

        console.log('Context menu opened for:', { nodeId, edgeId }); // デバッグログを追加

        setContextMenu({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          nodeId,
          edgeId,
        });
      }
    },
    [rfInstance, setSelectedNodeId]
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, []);

  const handleAddDrillDown = useCallback(async (nodeId: string) => {
    if (!nodeId) return;
    try {
      const response = await fetch('/api/createFlow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Drilldown Flow',
          flow_data: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
          parent_flow_id: flowId  // 現在編集中のフローIDを親フローIDとして設定
        }),
      });
      const result = await response.json();
      if (result.data && result.data[0]) {
        const newFlowId = result.data[0].id;
        setNodes((nds) =>
          nds.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, drilldownFlowId: newFlowId } }
              : node
          )
        );
        setDrilldownFlowId(newFlowId);
        setShowSlideInPanel(true);
      }
    } catch (error) {
      console.error('Error creating drilldown flow:', error);
    }
    closeContextMenu();
  }, [closeContextMenu, setNodes, flowId]);

  const handleOpenDrilldown = useCallback((flowId: string) => {
    setDrilldownFlowId(flowId);
    setShowSlideInPanel(true);
  }, []);

  const handleCloseSlideInPanel = useCallback(async () => {
    if (isUnsaved) {
      const saveSuccess = await handleSaveFlow();
      if (saveSuccess) {
        setShowSlideInPanel(false);
        setDrilldownFlowId(null);
      }
    } else {
      setShowSlideInPanel(false);
      setDrilldownFlowId(null);
    }
  }, [isUnsaved, handleSaveFlow]);

  const handleClose = useCallback(async (action: 'backToList' | 'closeSlideIn') => {
    if (isUnsaved) {
      setCloseAction(action);
      setShowSaveDialog(true);
    } else {
      if (action === 'backToList') {
        router.push('/');
      } else {
        if (onClose) onClose();
      }
    }
  }, [isUnsaved, router, onClose]);

  const handleSaveAndClose = useCallback(async () => {
    const saveSuccess = await handleSaveFlow();
    setShowSaveDialog(false);
    if (saveSuccess) {
      if (closeAction === 'backToList') {
        router.push('/');
      } else {
        if (onClose) onClose();
      }
    } else {
      console.error('Failed to save changes');
      // オプション: ユーザーにエラーメッセージを表示
    }
  }, [handleSaveFlow, closeAction, router, onClose]);

  const handleCloseWithoutSaving = useCallback(() => {
    setShowSaveDialog(false);
    if (closeAction === 'backToList') {
      router.push('/');
    } else {
      if (onClose) onClose();
    }
  }, [closeAction, router, onClose]);

  const handleAddLink = useCallback(() => {
    if (selectedNodeId && newLink.name && newLink.url) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  links: [...(node.data.links || []), newLink],
                },
              }
            : node
        )
      );
      setNewLink({ name: '', url: '' });
      setShowLinkDialog(false);
    }
  }, [selectedNodeId, newLink, setNodes]);

  const handleEditNodeNumber = useCallback(() => {
    if (editingNodeId !== null && newNodeNumber !== null) {
      updateNodeData(editingNodeId, { nodeNumber: newNodeNumber });
      setShowEditNumberDialog(false);
      setEditingNodeId(null);
      setNewNodeNumber(null);
    }
  }, [editingNodeId, newNodeNumber, updateNodeData]);

  const edgeTypes = useMemo(() => ({
    custom: CustomEdge,
  }), []);

  const [drilldownFlowId, setDrilldownFlowId] = useState<string | null>(null);
  const [showSlideInPanel, setShowSlideInPanel] = useState(false);

  const handleStickyNoteChange = useCallback((id: string, content: string) => {
    updateNodeData(id, { content });
  }, [updateNodeData]);

  const nodeTypes: NodeTypes = useMemo(() => ({
    activity: (props) => (
      <ActivityNode
        {...props}
        onChange={(newText, newAdditionalInfo) =>
          updateNodeData(props.id, { verbPhrase: newText, additionalInfo: newAdditionalInfo })
        }
        onOpenDrilldown={handleOpenDrilldown}
        onAddDrilldown={() => handleAddDrillDown(props.id)}
        onContextMenu={(event) => onContextMenu(event)}
      />
    ),
    start: StartNode,
    end: EndNode,
    stickyNote: (props) => (
      <StickyNoteNode
        {...props}
        data={{
          ...props.data,
          onChange: handleStickyNoteChange,
          onContextMenu: (event) => onContextMenu(event),
        }}
      />
    ),
  }), [updateNodeData, handleOpenDrilldown, handleAddDrillDown, onContextMenu, handleStickyNoteChange]);

  const handleAddNode = useCallback((type: 'activity' | 'start' | 'end') => {
    const position = getFlowPosition(contextMenu.x, contextMenu.y);
    addNode(type, position);
    closeContextMenu();
  }, [addNode, contextMenu, getFlowPosition, closeContextMenu]);

  const handleAddStickyNote = useCallback(() => {
    const position = getFlowPosition(contextMenu.x, contextMenu.y);
    addStickyNote(position);
    closeContextMenu();
  }, [addStickyNote, contextMenu, getFlowPosition, closeContextMenu]);

  return (
    <div className="h-screen flex flex-col relative">
      <UPNToolbar
        isSlideIn={isSlideIn}
        flowName={flowName}
        setFlowName={setFlowName}
        handleClose={handleClose}
        handleSaveFlow={handleSaveFlow}
        rfInstance={rfInstance}
        reactFlowWrapper={reactFlowWrapper}
        noteContent={noteContent}
        setNoteContent={setNoteContent}
      />
      <div className="flex-grow" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onEdgeUpdate={onEdgeUpdate}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onContextMenu={onContextMenu}
          onClick={closeContextMenu}
          connectionMode={ConnectionMode.Loose}
          onInit={onInit}
          minZoom={0.125}
        >
          <Controls />
          <Background />
        </ReactFlow>
        {contextMenu.visible && (
          <UPNContextMenu
            contextMenu={contextMenu}
            contextMenuType={contextMenuType}
            addNode={handleAddNode}
            addStickyNote={handleAddStickyNote}
            setShowLinkDialog={setShowLinkDialog}
            handleAddDrillDown={handleAddDrillDown}
            setEditingNodeId={setEditingNodeId}
            setNewNodeNumber={setNewNodeNumber}
            setShowEditNumberDialog={setShowEditNumberDialog}
            deleteNode={deleteNode}
            deleteStickyNote={deleteStickyNote}
            reverseEdge={reverseEdge}
            deleteEdge={deleteEdge}
            closeContextMenu={closeContextMenu}
            nodes={nodes}
          />
        )}
      </div>
      {showSlideInPanel && (
        <SlideInPanel onClose={handleCloseSlideInPanel}>
          <UPNEditor flowId={drilldownFlowId} isSlideIn={true} onClose={handleCloseSlideInPanel} />
        </SlideInPanel>
      )}
      <UPNDialogManager
        showSaveDialog={showSaveDialog}
        setShowSaveDialog={setShowSaveDialog}
        handleSaveAndClose={handleSaveAndClose}
        handleCloseWithoutSaving={handleCloseWithoutSaving}
        showLinkDialog={showLinkDialog}
        setShowLinkDialog={setShowLinkDialog}
        newLink={newLink}
        setNewLink={setNewLink}
        handleAddLink={handleAddLink}
        showEditNumberDialog={showEditNumberDialog}
        setShowEditNumberDialog={setShowEditNumberDialog}
        newNodeNumber={newNodeNumber}
        setNewNodeNumber={setNewNodeNumber}
        handleEditNodeNumber={handleEditNodeNumber}
      />
    </div>
  );
};

interface UPNEditorProps {
  flowId: string | null;
  isSlideIn?: boolean;
  onClose?: () => void;
}

const UPNEditor: React.FC<UPNEditorProps> = (props) => (
  <ReactFlowProvider>
    <UPNEditorContent {...props} />
  </ReactFlowProvider>
);

export default UPNEditor;