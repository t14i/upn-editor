import React, { useState, useCallback, useEffect, useRef } from 'react';
import { NodeProps } from 'reactflow';

interface StickyNoteData {
  content: string;
  onChange: (id: string, content: string) => void;
  onContextMenu: (event: React.MouseEvent) => void;
}

const StickyNoteNode: React.FC<NodeProps<StickyNoteData>> = ({ data, id }) => {
  const [content, setContent] = useState(data.content || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGrabArea, setIsGrabArea] = useState(false);

  const baseWidth = 216; // 180 * 1.2 = 216
  const [height, setHeight] = useState(baseWidth);

  const onChange = useCallback((evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = evt.target.value;
    setContent(newContent);
    data.onChange(id, newContent);
  }, [data, id]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, baseWidth)}px`;
      setHeight(Math.max(textareaRef.current.scrollHeight, baseWidth));
    }
  }, [content, baseWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const rect = textarea.getBoundingClientRect();
      if (e.clientY > rect.top + rect.height / 2) {
        setIsDragging(true);
        e.preventDefault(); // テキスト選択を防ぐ
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const rect = textarea.getBoundingClientRect();
      setIsGrabArea(e.clientY > rect.top + rect.height / 2);
    }
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div 
      className="shadow-md rounded-md bg-yellow-100 border border-yellow-300" 
      style={{ 
        width: baseWidth, 
        height: height,
        cursor: isDragging ? 'grabbing' : (isGrabArea ? 'grab' : 'default')
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setIsGrabArea(false)}
      onContextMenu={data.onContextMenu}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={onChange}
        className="w-full h-full bg-transparent border-none resize-none text-sm focus:outline-none p-2"
        style={{ 
          overflow: 'hidden',
          cursor: isGrabArea ? 'grab' : 'text'
        }}
        placeholder="ここにメモを入力..."
        onMouseDown={(e) => {
          const textarea = textareaRef.current;
          if (textarea) {
            const rect = textarea.getBoundingClientRect();
            if (e.clientY <= rect.top + rect.height / 2) {
              e.stopPropagation(); // 上半分のクリックでドラッグを開始しないようにする
            }
          }
        }}
      />
    </div>
  );
};

export default StickyNoteNode;