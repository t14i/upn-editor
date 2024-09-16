import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UPNContextMenuProps {
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    nodeId?: string;
    edgeId?: string;
  };
  contextMenuType: 'canvas' | 'activity' | 'edge' | 'stickyNote';
  addNode: (type: 'activity' | 'start' | 'end') => void;
  addStickyNote: () => void;
  setShowLinkDialog: (show: boolean) => void;
  handleAddDrillDown: (nodeId: string) => void;
  setEditingNodeId: (nodeId: string) => void;
  setNewNodeNumber: (number: number | null) => void;
  setShowEditNumberDialog: (show: boolean) => void;
  deleteNode: (nodeId: string) => void;
  deleteStickyNote: (nodeId: string) => void;
  reverseEdge: (edgeId: string) => void;
  deleteEdge: (edgeId: string) => void;
  closeContextMenu: () => void;
  nodes: any[];
}

const UPNContextMenu: React.FC<UPNContextMenuProps> = ({
  contextMenu,
  contextMenuType,
  addNode,
  addStickyNote,
  setShowLinkDialog,
  handleAddDrillDown,
  setEditingNodeId,
  setNewNodeNumber,
  setShowEditNumberDialog,
  deleteNode,
  deleteStickyNote,
  reverseEdge,
  deleteEdge,
  closeContextMenu,
  nodes,
}) => {
  return (
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
              setShowLinkDialog(true);
              closeContextMenu();
            }}>
              関連リンクを編集
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleAddDrillDown(contextMenu.nodeId || '')}>
              ドリルダウンを追加
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
            {contextMenuType === 'edge' && (
              <>
                <DropdownMenuItem onSelect={() => {
                  console.log('Reverse edge clicked, contextMenu:', contextMenu); // デバッグログ
                  if (contextMenu.edgeId) {
                    console.log('Reversing edge:', contextMenu.edgeId);
                    reverseEdge(contextMenu.edgeId);
                  } else {
                    console.error('Edge ID is undefined. Context menu:', contextMenu);
                  }
                  closeContextMenu();
                }}>
                  向きを逆転
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => {
                  if (contextMenu.edgeId) {
                    deleteEdge(contextMenu.edgeId === 'custom' ? 'lastEdge' : contextMenu.edgeId);
                  } else {
                    console.error('Edge ID is undefined. Context menu:', contextMenu);
                  }
                  closeContextMenu();
                }}>
                  削除
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UPNContextMenu;