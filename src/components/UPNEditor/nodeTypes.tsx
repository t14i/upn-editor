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
  handleStickyNoteChange: (id: string, content: string) => void,
  handleEditLinks: (nodeId: string, links: { name: string; url: string; }[]) => void
) => ({
  activity: React.memo(function ActivityNodeWrapper(props: any) {
    return (
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
            handleEditLinks(props.id, links);
          }
        }}
      />
    );
  }),
  start: React.memo(StartNode),
  end: React.memo(EndNode),
  stickyNote: React.memo(function StickyNoteNodeWrapper(props: any) {
    return (
      <StickyNoteNode
        {...props}
        data={{
          ...props.data,
          onChange: handleStickyNoteChange,
          onContextMenu: (event: React.MouseEvent) => onContextMenu(event),
        }}
      />
    );
  }),
});