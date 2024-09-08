import React from 'react';
import { Handle, Position } from 'reactflow';

const StartNode: React.FC<any> = ({ data }) => {
  return (
    <div style={{ 
      background: '#d3d3d3', 
      padding: '10px', 
      borderRadius: '5px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100px',
      height: '50px'
    }}>
      <Handle
        type="source"
        position={Position.Right}
        id="start-handle"
        style={{
          background: '#555',
          width: '12px',
          height: '12px',
          border: '2px solid #fff',
        }}
      />
      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{data.label}</div>
    </div>
  );
};

export default StartNode;