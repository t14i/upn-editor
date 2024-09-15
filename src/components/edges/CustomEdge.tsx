import React, { useState, useCallback } from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from 'reactflow';

interface CustomEdgeData {
  label: string;
  onLabelChange: (edgeId: string, newLabel: string) => void;
}

const CustomEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data?.label || '');

  const onEdgeClick = useCallback((evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    evt.stopPropagation();
    setIsEditing(true);
  }, []);

  const onLabelChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(evt.target.value);
  }, []);

  const onLabelKeyDown = useCallback((evt: React.KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === 'Enter') {
      setIsEditing(false);
      data?.onLabelChange(id, label);
    }
  }, [id, label, data]);

  const onLabelBlur = useCallback(() => {
    setIsEditing(false);
    data?.onLabelChange(id, label);
  }, [id, label, data]);

  return (
    <>
      <path
        className="react-flow__edge-path-selector"
        d={edgePath}
        fill="none"
        strokeWidth={48}
        stroke="transparent"
      />
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: 3,  // 視覚的な太さを3に設定
          stroke: '#555',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 16,
            pointerEvents: 'all',
            backgroundColor: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            minWidth: '80px',
            textAlign: 'center',
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <input
              value={label}
              onChange={onLabelChange}
              onBlur={onLabelBlur}
              onKeyDown={onLabelKeyDown}
              className="nodrag nopan"
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: '100%',
                textAlign: 'center',
                fontSize: 16,
              }}
            />
          ) : (
            <div onClick={onEdgeClick}>{label || 'エッジラベル'}</div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;