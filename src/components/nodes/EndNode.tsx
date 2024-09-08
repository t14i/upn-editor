import React from 'react';
import { Handle, Position } from 'reactflow';

const EndNode: React.FC<any> = ({ data }) => {
  return (
    <div style={{ 
      background: '#a9a9a9', 
      padding: '10px', 
      borderRadius: '5px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100px',
      height: '50px'
    }}>
      <Handle
        type="target"
        position={Position.Left}
        id="end-handle"
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

export default EndNode;