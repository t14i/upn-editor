import React from 'react';
import ActivityNode from '@/components/nodes/ActivityNode';
import StartNode from '@/components/nodes/StartNode';
import EndNode from '@/components/nodes/EndNode';
import StickyNoteNode from '@/components/nodes/StickyNoteNode';

export const createNodeTypes = (
  updateNodeData: (nodeId: string, newData: any) => void,
  handleOpenDrilldown: (flowId: string) => void,
  handleAddDrillDown: (nodeId: string) => void,
  onContextMenu: (event: React.MouseEvent) => void,
  handleStickyNoteChange: (id: string, content: string) => void
) => ({
  activity: React.memo((props: any) => (
    <ActivityNode
      {...props}
      onChange={(newText: string, newAdditionalInfo: any[]) =>
        updateNodeData(props.id, { verbPhrase: newText, additionalInfo: newAdditionalInfo })
      }
      onOpenDrilldown={handleOpenDrilldown}
      onAddDrilldown={() => handleAddDrillDown(props.id)}
      onContextMenu={(event: React.MouseEvent) => onContextMenu(event)}
      onEditLinks={(links: { name: string; url: string; }[]) => {
        if (props.id) {
          updateNodeData(props.id, { links });
        }
      }}
    />
  )),
  start: React.memo(StartNode),
  end: React.memo(EndNode),
  stickyNote: React.memo((props: any) => (
    <StickyNoteNode
      {...props}
      data={{
        ...props.data,
        onChange: handleStickyNoteChange,
        onContextMenu: (event: React.MouseEvent) => onContextMenu(event),
      }}
    />
  )),
});