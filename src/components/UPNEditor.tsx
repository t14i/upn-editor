import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
import { ArrowLeft, ChevronRight, Download, StickyNote } from 'lucide-react';
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
import SlideInPanel from './SlideInPanel';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import DownloadArea from './DownloadArea';
import DownloadModal from './DownloadModal';
import { handleDownload as handleDownloadUtil } from '../utils/downloadUtils';
import NotePanel from './NotePanel';
import StickyNoteNode from './nodes/StickyNoteNode';

const UPNEditorContent: React.FC<UPNEditorProps> = ({ flowId: initialFlowId, isSlideIn = false, onClose }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; nodeId?: string; edgeId?: string }>({ visible: false, x: 0, y: 0 });
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [connectingHandle, setConnectingHandle] = useState<ConnectingHandle | null>(null);
  const [notes, setNotes] = useState('');
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const { setViewport, screenToFlowPosition, getViewport } = useReactFlow();
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [flowId, setFlowId] = useState<string | null>(initialFlowId);

  const [isUnsaved, setIsUnsaved] = useState(false);
  const [initialData, setInitialData] = useState<{ nodes: any[], edges: any[], flowName: string, note: string } | null>(null);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [closeAction, setCloseAction] = useState<'backToList' | 'closeSlideIn' | null>(null);

  const router = useRouter();

  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [newLink, setNewLink] = useState({ name: '', url: '' });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [showEditNumberDialog, setShowEditNumberDialog] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [newNodeNumber, setNewNodeNumber] = useState<number | null>(null);

  const [downloadFormat, setDownloadFormat] = useState<'PNG' | 'JPEG' | 'PDF'>('PNG');
  const [downloadResolution, setDownloadResolution] = useState<'低' | '中' | '高'>('中');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showDownloadArea, setShowDownloadArea] = useState(false);
  const [downloadArea, setDownloadArea] = useState({ width: 0, height: 0 });
  const [downloadAreaPosition, setDownloadAreaPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [showNotePanel, setShowNotePanel] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  const [showSlideInNotePanel, setShowSlideInNotePanel] = useState(false);

  const initializeDownloadArea = useCallback(() => {
    if (reactFlowWrapper.current) {
      const { width: screenWidth, height: screenHeight } = reactFlowWrapper.current.getBoundingClientRect();
      
      const areaHeight = screenHeight * 0.85; // 画面高さの85%
      const areaWidth = areaHeight * 16 / 9; // 9:16の比率

      setDownloadArea({
        width: areaWidth,
        height: areaHeight
      });

      setDownloadAreaPosition({
        x: (screenWidth - areaWidth) / 2, // 水平方向の中央
        y: screenHeight * 0.1 // 画面の上10%の位置
      });
    }
  }, []);

  useEffect(() => {
    initializeDownloadArea();
    window.addEventListener('resize', initializeDownloadArea);
    return () => {
      window.removeEventListener('resize', initializeDownloadArea);
    };
  }, [initializeDownloadArea]);

  const handleDownloadClick = useCallback(() => {
    setShowDownloadArea(true);
    initializeDownloadArea(); // DownloadArea表示時に再度サイズと位置を調整
  }, [initializeDownloadArea]);

  const handleDownloadAreaConfirm = useCallback(() => {
    setShowDownloadArea(false);
    setShowDownloadModal(true);
  }, []);

  const handleDownloadAreaCancel = useCallback(() => {
    setShowDownloadArea(false);
  }, []);

  const handleDownloadAreaMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - downloadAreaPosition.x,
        y: e.clientY - downloadAreaPosition.y
      });
    }
  };

  const handleDownloadAreaMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && reactFlowWrapper.current) {
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(e.clientX - dragStart.x, bounds.width - downloadArea.width));
      const newY = Math.max(0, Math.min(e.clientY - dragStart.y, bounds.height - downloadArea.height));
      setDownloadAreaPosition({ x: newX, y: newY });
    }
  }, [isDragging, dragStart, downloadArea]);

  const handleDownloadAreaMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDownloadAreaMouseMove);
      window.addEventListener('mouseup', handleDownloadAreaMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleDownloadAreaMouseMove);
      window.removeEventListener('mouseup', handleDownloadAreaMouseUp);
    };
  }, [isDragging, handleDownloadAreaMouseMove, handleDownloadAreaMouseUp]);

  const handleDownload = useCallback(async () => {
    if (reactFlowWrapper.current) {
      const flowElement = reactFlowWrapper.current.querySelector('.react-flow__viewport');
      if (!flowElement) return;

      const { x, y, zoom } = getViewport();
      const flowBounds = flowElement.getBoundingClientRect();
      
      await handleDownloadUtil({
        flowElement: flowElement as HTMLElement,
        downloadFormat,
        downloadResolution,
        selectedArea: {
          x: (downloadAreaPosition.x - flowBounds.left) / zoom,
          y: (downloadAreaPosition.y - flowBounds.top) / zoom,
          width: downloadArea.width / zoom,
          height: downloadArea.height / zoom,
        },
        flowName,
        zoom,
      });
    }
    setShowDownloadModal(false);
  }, [downloadFormat, downloadResolution, flowName, reactFlowWrapper, downloadArea, downloadAreaPosition, getViewport]);

  useEffect(() => {
    if (initialFlowId && initialFlowId !== 'new') {
      const fetchFlow = async () => {
        const response = await fetch(`/api/getFlow?id=${initialFlowId}`);
        const data = await response.json();
        if (data.data) {
          const fetchedNodes = data.data.flow_data.nodes || [];
          const fetchedEdges = data.data.flow_data.edges || [];
          const fetchedFlowName = data.data.name;
          const fetchedNote = data.data.note || '';

          setFlowName(fetchedFlowName);
          setNodes(fetchedNodes);
          setEdges(fetchedEdges);
          setNoteContent(fetchedNote);
          if (data.data.flow_data.viewport) {
            setViewport(data.data.flow_data.viewport);
          }
          setFlowId(initialFlowId);
          setInitialData({ nodes: fetchedNodes, edges: fetchedEdges, flowName: fetchedFlowName, note: fetchedNote });
        }
      };
      fetchFlow();
    } else {
      setInitialData({ nodes: [], edges: [], flowName: 'Untitled Flow', note: '' });
    }
  }, [initialFlowId, setViewport]);

  const isDataChanged = useCallback(() => {
    if (!initialData) return false;
    
    const nodesChanged = JSON.stringify(nodes) !== JSON.stringify(initialData.nodes);
    const edgesChanged = JSON.stringify(edges) !== JSON.stringify(initialData.edges);
    const flowNameChanged = flowName !== initialData.flowName;
    const noteChanged = noteContent !== initialData.note;

    return nodesChanged || edgesChanged || flowNameChanged || noteChanged;
  }, [nodes, edges, flowName, noteContent, initialData]);

  useEffect(() => {
    if (initialData) {
      setIsUnsaved(isDataChanged());
    }
  }, [nodes, edges, flowName, noteContent, initialData, isDataChanged]);

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

  const [contextMenuType, setContextMenuType] = useState<'canvas' | 'activity' | 'edge' | 'stickyNote'>('canvas');

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
  }, [setEdges]);

  const reverseEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.map((edge) => {
      if (edge.id === edgeId) {
        const { source, target, sourceHandle, targetHandle } = edge;
        return {
          ...edge,
          source: target,
          target: source,
          sourceHandle: targetHandle,
          targetHandle: sourceHandle,
        };
      }
      return edge;
    }));
  }, [setEdges]);

  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (rfInstance) {
        const targetElement = event.target as HTMLElement;
        const node = targetElement.closest('.react-flow__node');
        const edge = targetElement.closest('.react-flow__edge');

        const nodeId = node ? node.getAttribute('data-id') || undefined : undefined;
        const edgeId = edge ? edge.getAttribute('data-id') || undefined : undefined;
        const isActivityNode = node?.classList.contains('react-flow__node-activity');
        const isStickyNoteNode = node?.classList.contains('react-flow__node-stickyNote');
        
        if (edge) {
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

        setContextMenu({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          nodeId,
          edgeId,
        });
      }
    },
    [rfInstance]
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, []);

  const addNode = useCallback((type: 'activity' | 'start' | 'end') => {
    const newNodeId = `${type}-${Date.now()}`;
    const newNodeNumber = nodes.filter(node => node.type === 'activity').length + 1;
    const newNode = {
      id: newNodeId,
      type: type,
      position: rfInstance ? rfInstance.project({ x: contextMenu.x, y: contextMenu.y }) : { x: 0, y: 0 },
      data: {
        label: type === 'start' ? 'Start' : type === 'end' ? 'End' : '',
        verbPhrase: '',
        resources: [],
        additionalInfo: [],
        isNew: true,
        nodeNumber: type === 'activity' ? newNodeNumber : undefined,
        onChange: (newText: string, newAdditionalInfo: AdditionalInfo[]) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === newNodeId
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
  }, [nodes, contextMenu, closeContextMenu, rfInstance]);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
    setIsUnsaved(true);  // ノードデータが更新されたら未保存状態にする
  }, [setNodes]);

  const handleStickyNoteChange = useCallback((id: string, content: string) => {
    updateNodeData(id, { content });
  }, [updateNodeData]);

  const saveToSupabase = useCallback(async (): Promise<boolean> => {
    if (rfInstance) {
      const { nodes: currentNodes, edges: currentEdges, viewport } = rfInstance.toObject();
      const flow = { nodes: currentNodes, edges: currentEdges, viewport };
      const payload = {
        name: flowName,
        flow_data: flow,
        note: noteContent
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
          setInitialData({ nodes: currentNodes, edges: currentEdges, flowName, note: noteContent });
          setIsUnsaved(false);
          return true;
        } else {
          const errorText = await response.text();
          console.error('Error saving to Supabase:', errorText);
          return false;
        }
      } catch (error) {
        console.error('Network error:', error);
        return false;
      }
    }
    return false;
  }, [rfInstance, flowName, flowId, noteContent]);

  const edgeTypes = useMemo(() => ({
    custom: CustomEdge,
  }), []);

  const [drilldownFlowId, setDrilldownFlowId] = useState<string | null>(null);
  const [showSlideInPanel, setShowSlideInPanel] = useState(false);

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

  const handleCloseSlideInPanel = useCallback(() => {
    setShowSlideInPanel(false);
    setDrilldownFlowId(null);
  }, []);

  const handleSlideOut = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

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
    const saveSuccess = await saveToSupabase();
    setShowSaveDialog(false);
    if (saveSuccess) {
      if (closeAction === 'backToList') {
        router.push('/');
      } else {
        if (onClose) onClose();
      }
    } else {
      // 保存に失敗した場合、ユーザーに通知するなどの処理を追加できます
      console.error('Failed to save changes');
    }
  }, [saveToSupabase, closeAction, router, onClose]);

  const handleCloseWithoutSaving = useCallback(() => {
    setShowSaveDialog(false);
    if (closeAction === 'backToList') {
      router.push('/');
    } else {
      if (onClose) onClose();
    }
  }, [closeAction, router, onClose]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

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

  const handleNoteButtonClick = () => {
    setShowNotePanel(true);
  };

  const handleNotePanelClose = () => {
    setShowNotePanel(false);
  };

  const handleSlideInNoteButtonClick = () => {
    setShowSlideInNotePanel(true);
  };

  const handleSlideInNotePanelClose = () => {
    setShowSlideInNotePanel(false);
  };

  const addStickyNote = useCallback(() => {
    const newNodeId = `memo-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: 'stickyNote',
      position: rfInstance ? rfInstance.project({ x: contextMenu.x, y: contextMenu.y }) : { x: 0, y: 0 },
      data: {
        content: '',
        onChange: (id: string, content: string) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === id
                ? { ...node, data: { ...node.data, content } }
                : node
            )
          );
        },
      },
    };
    setNodes((nds) => nds.concat(newNode));
    closeContextMenu();
  }, [rfInstance, contextMenu, setNodes, closeContextMenu]);

  const deleteStickyNote = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setIsUnsaved(true);
  }, [setNodes]);

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

  return (
    <div className="h-screen flex flex-col relative">
      {!isSlideIn && (
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleClose('backToList')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <input
            type="text"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            placeholder="Flow Name"
            className="p-2 border rounded"
          />
          <Button onClick={saveToSupabase}>保存</Button>
          {/* ダウンロードボタンを追加 */}
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center border border-gray-300"
            onClick={handleDownloadClick}
          >
            <Download className="h-4 w-4 mr-1" />
            ダウンロード
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center border border-gray-300"
            onClick={handleNoteButtonClick}
          >
            <StickyNote className="h-4 w-4 mr-1" />
            ノート
          </Button>
        </div>
      )}
      {isSlideIn && (
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleClose('closeSlideIn')} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4" />
            <span>閉じる</span>
          </Button>
          <input
            type="text"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            placeholder="Flow Name"
            className="p-2 border rounded"
          />
          <Button onClick={saveToSupabase}>保存</Button>
          {/* ダウンロードボタンを追加 */}
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center border border-gray-300"
            onClick={handleDownloadClick}
          >
            <Download className="h-4 w-4 mr-1" />
            ダウンロード
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center border border-gray-300"
            onClick={handleSlideInNoteButtonClick}
          >
            <StickyNote className="h-4 w-4 mr-1" />
            ノート
          </Button>
        </div>
      )}
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
          onInit={onInit}
          minZoom={0.125}
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
            <DropdownMenuContent className="w-56" onClick={(e) => e.stopPropagation()}>
              {contextMenuType === 'canvas' ? (
                <>
                  <DropdownMenuItem onSelect={() => { addNode('activity'); closeContextMenu(); }}>
                    アクティビティを追加
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { addNode('start'); closeContextMenu(); }}>
                    スタートノードを追加
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { addNode('end'); closeContextMenu(); }}>
                    エンドノードを追加
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => {
                    addStickyNote();
                    closeContextMenu();
                  }}>
                    メモを追加
                  </DropdownMenuItem>
                </>
              ) : contextMenuType === 'activity' ? (
                <>
                  <DropdownMenuItem onSelect={() => {
                    setShowLinkDialog(true);
                    closeContextMenu();
                  }}>
                    関連リンクを追加
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleAddDrillDown(contextMenu.nodeId || '')}>
                    ドリルダウンを追加
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => {
                    if (contextMenu.nodeId) {
                      setEditingNodeId(contextMenu.nodeId);
                      const currentNode = nodes.find(node => node.id === contextMenu.nodeId);
                      setNewNodeNumber(currentNode?.data.nodeNumber || null);
                      setShowEditNumberDialog(true);
                    }
                    closeContextMenu();
                  }}>
                    番号を編集
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => {
                    if (contextMenu.nodeId) {
                      deleteNode(contextMenu.nodeId);
                    }
                    closeContextMenu();
                  }}>
                    削除
                  </DropdownMenuItem>
                </>
              ) : contextMenuType === 'stickyNote' ? (
                <>
                  <DropdownMenuItem onSelect={() => {
                    if (contextMenu.nodeId) {
                      deleteStickyNote(contextMenu.nodeId);
                    }
                    closeContextMenu();
                  }}>
                    削除
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onSelect={() => {
                    if (contextMenu.edgeId) {
                      reverseEdge(contextMenu.edgeId);
                    }
                    closeContextMenu();
                  }}>
                    向きを逆転
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => {
                    if (contextMenu.edgeId) {
                      deleteEdge(contextMenu.edgeId);
                    }
                    closeContextMenu();
                  }}>
                    削除
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {showSlideInPanel && (
        <SlideInPanel onClose={handleCloseSlideInPanel}>
          <UPNEditor flowId={drilldownFlowId} isSlideIn={true} onClose={handleCloseSlideInPanel} />
        </SlideInPanel>
      )}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>保存されていない変更があります</AlertDialogTitle>
            <AlertDialogDescription>
              変更を保存しますか？保存せずに閉じると、変更内容が失われます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseWithoutSaving}>
              保存せずに閉じる
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndClose}>
              保存して閉じる
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 関連リンク追加ダイアログ */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>関連リンクを追加</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="link-name" className="text-right">
                リンク名
              </Label>
              <Input
                id="link-name"
                value={newLink.name}
                onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="link-url" className="text-right">
                URL
              </Label>
              <Input
                id="link-url"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddLink}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ノード番号編集ダイアログ */}
      <Dialog open={showEditNumberDialog} onOpenChange={setShowEditNumberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ノード番号を編集</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="node-number" className="text-right">
                新しい番号
              </Label>
              <Input
                id="node-number"
                type="number"
                value={newNodeNumber !== null ? newNodeNumber : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setNewNodeNumber(value === '' ? null : parseInt(value, 10));
                  }
                }}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditNodeNumber}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DownloadModal
        showDownloadModal={showDownloadModal}
        setShowDownloadModal={setShowDownloadModal}
        downloadFormat={downloadFormat}
        setDownloadFormat={setDownloadFormat}
        downloadResolution={downloadResolution}
        setDownloadResolution={setDownloadResolution}
        handleDownload={handleDownload}
      />

      {showDownloadArea && (
        <DownloadArea
          downloadArea={downloadArea}
          downloadAreaPosition={downloadAreaPosition}
          setDownloadArea={setDownloadArea}
          setDownloadAreaPosition={setDownloadAreaPosition}
          setIsDragging={setIsDragging}
          handleDownloadAreaMouseDown={handleDownloadAreaMouseDown}
          handleDownloadAreaConfirm={handleDownloadAreaConfirm}
          handleDownloadAreaCancel={handleDownloadAreaCancel}
          reactFlowWrapper={reactFlowWrapper}
        />
      )}

      {showNotePanel && (
        <div className="fixed inset-y-0 right-0 w-80 z-50 transition-transform duration-300 ease-in-out transform translate-x-0">
          <NotePanel
            noteContent={noteContent}
            setNoteContent={setNoteContent}
            onClose={handleNotePanelClose}
          />
        </div>
      )}
      {showSlideInNotePanel && (
        <div className="fixed inset-y-0 right-0 w-80 z-50 transition-transform duration-300 ease-in-out transform translate-x-0">
          <NotePanel
            noteContent={noteContent}
            setNoteContent={setNoteContent}
            onClose={handleSlideInNotePanelClose}
          />
        </div>
      )}
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