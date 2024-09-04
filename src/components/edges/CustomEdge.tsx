import React, { useState, useCallback } from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from 'reactflow';

interface CustomEdgeData {
  label: string;
  onLabelChange: (edgeId: string, newLabel: string) => void;
}

interface CustomEdgeProps extends EdgeProps {
  data: CustomEdgeData;
}

const CustomEdge: React.FC<CustomEdgeProps> = ({
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
      data.onLabelChange(id, label);
    }
  }, [id, label, data.onLabelChange]);

  const onLabelBlur = useCallback(() => {
    setIsEditing(false);
    data.onLabelChange(id, label);
  }, [id, label, data.onLabelChange]);

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: 3,
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
            fontSize: 16,  // フォントサイズを大きくしました
            pointerEvents: 'all',
            backgroundColor: 'white',
            padding: '4px 8px',  // パディングを少し増やしました
            borderRadius: '4px',
            // border を削除しました
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
                fontSize: 16,  // 入力フィールドのフォントサイズも合わせました
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