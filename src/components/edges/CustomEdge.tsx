import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
    }
  }, [isEditing, label]);

  const onEdgeClick = useCallback((evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    evt.stopPropagation();
    setIsEditing(true);
  }, []);

  const onLabelChange = useCallback((evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLabel(evt.target.value);
    evt.target.style.height = 'auto';
    evt.target.style.height = `${evt.target.scrollHeight}px`;
  }, []);

  const onLabelKeyDown = useCallback((evt: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (evt.key === 'Enter' && evt.shiftKey) {
      return; // Shift + Enterの場合は改行を許可
    }
    if (evt.key === 'Enter') {
      evt.preventDefault();
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
          strokeWidth: 3,
          stroke: '#555',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          id={id}
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
          className="react-flow__edgelabel nodrag nopan"
        >
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={label}
              onChange={onLabelChange}
              onBlur={onLabelBlur}
              onKeyDown={onLabelKeyDown}
              className="nodrag nopan"
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: '100%',
                resize: 'none',
                textAlign: 'center',
                fontSize: 16,
                overflow: 'hidden',
                minHeight: '24px',
              }}
              rows={1}
            />
          ) : (
            <div 
              onClick={onEdgeClick}
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {label || 'エッジラベル'}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;