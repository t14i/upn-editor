import React, { useCallback, useState, MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Resizable, ResizeDirection } from 're-resizable';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface DownloadAreaProps {
  downloadArea: { width: number; height: number };
  downloadAreaPosition: { x: number; y: number };
  setDownloadArea: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>;
  setDownloadAreaPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  handleDownloadAreaMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleDownloadAreaConfirm: () => void;
  handleDownloadAreaCancel: () => void;
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
}

const DownloadArea: React.FC<DownloadAreaProps> = ({
  downloadArea,
  downloadAreaPosition,
  setDownloadArea,
  setDownloadAreaPosition,
  setIsDragging,
  handleDownloadAreaMouseDown,
  handleDownloadAreaConfirm,
  handleDownloadAreaCancel,
  reactFlowWrapper,
}) => {
  const [dragStartSize, setDragStartSize] = useState<{ width: number; height: number; x: number; y: number } | undefined>();
  const [isDraggingArea, setIsDraggingArea] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [isAspectRatioLocked, setIsAspectRatioLocked] = useState(true);

  const handleMouseEnter = () => {
    document.body.style.cursor = 'grab';
  };

  const handleMouseLeave = () => {
    if (!isDraggingArea) {
      document.body.style.cursor = 'default';
    }
  };

  const onResize = useCallback(
    ({ delta, direction }: { delta: { width: number; height: number }, direction: ResizeDirection }) => {
      if (!dragStartSize) {
        return;
      }
      const directions = ["top", "left", "topLeft", "bottomLeft", "topRight"];

      let newWidth = dragStartSize.width + delta.width;
      let newHeight = dragStartSize.height + delta.height;
      let newX = downloadAreaPosition.x;
      let newY = downloadAreaPosition.y;

      if (isAspectRatioLocked) {
        const aspectRatio = dragStartSize.width / dragStartSize.height;
        if (Math.abs(delta.width) > Math.abs(delta.height)) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
        }
      }

      if (directions.indexOf(direction) !== -1) {
        if (direction === "bottomLeft") {
          newX = dragStartSize.x - delta.width;
        } else if (direction === "topRight") {
          newY = dragStartSize.y - delta.height;
        } else {
          newX = dragStartSize.x - delta.width;
          newY = dragStartSize.y - delta.height;
        }
      }

      setDownloadAreaPosition({ x: newX, y: newY });
      setDownloadArea({ width: newWidth, height: newHeight });
    },
    [dragStartSize, setDownloadArea, setDownloadAreaPosition, downloadAreaPosition, isAspectRatioLocked]
  );

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (isResizing) return;
    const target = e.target as HTMLElement;
    if (target.classList.contains('react-resizable-handle')) {
      return;
    }
    setIsDraggingArea(true);
    document.body.style.cursor = 'grabbing';
    setDragStartPosition({
      x: e.clientX - downloadAreaPosition.x,
      y: e.clientY - downloadAreaPosition.y
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingArea || isResizing) return;
    const newX = e.clientX - dragStartPosition.x;
    const newY = e.clientY - dragStartPosition.y;
    setDownloadAreaPosition({ x: newX, y: newY });
  }, [isDraggingArea, isResizing, dragStartPosition, setDownloadAreaPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingArea(false);
    document.body.style.cursor = 'grab';
  }, []);

  React.useEffect(() => {
    if (isDraggingArea) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove as any);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove as any);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingArea, handleMouseMove, handleMouseUp]);

  return (
    <div style={{ position: 'absolute', left: downloadAreaPosition.x, top: downloadAreaPosition.y }}>
      <div 
        className="absolute -top-4 right-2 z-[1001] flex items-center space-x-2 bg-white p-2 rounded-md shadow-md"
        style={{ transform: 'translateY(-100%)' }}
      >
        <div className="flex items-center space-x-2">
          <Switch
            id="aspect-ratio-lock"
            checked={isAspectRatioLocked}
            onCheckedChange={setIsAspectRatioLocked}
          />
          <Label htmlFor="aspect-ratio-lock">縦横比を固定</Label>
        </div>
        <Button variant="outline" onClick={handleDownloadAreaCancel}>
          キャンセル
        </Button>
        <Button onClick={handleDownloadAreaConfirm}>
          次へ
        </Button>
      </div>
      <div 
        style={{
          width: `${downloadArea.width}px`,
          height: `${downloadArea.height}px`,
          cursor: isDraggingArea ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Resizable
          size={{ width: downloadArea.width, height: downloadArea.height }}
          onResizeStart={() => {
            setIsDragging(false);
            setIsResizing(true);
            setIsDraggingArea(false);
            setDragStartSize({ ...downloadArea, ...downloadAreaPosition });
          }}
          onResize={(e, direction, ref, d) => {
            onResize({ delta: d, direction });
          }}
          onResizeStop={() => {
            setDragStartSize(undefined);
            setIsResizing(false);
            setIsDraggingArea(false);
          }}
          minWidth={100}
          minHeight={100}
          maxWidth={reactFlowWrapper.current?.clientWidth || 1000}
          maxHeight={reactFlowWrapper.current?.clientHeight || 1000}
          handleStyles={{
            topRight: { cursor: 'ne-resize' },
            bottomRight: { cursor: 'se-resize' },
            bottomLeft: { cursor: 'sw-resize' },
            topLeft: { cursor: 'nw-resize' }
          }}
          handleClasses={{
            topRight: 'w-1 h-1 bg-white border-2 border-black rounded-full absolute top-0 right-0 -mt-0 -mr-0',
            bottomRight: 'w-1 h-1 bg-white border-2 border-black rounded-full absolute bottom-0 right-0 -mb-0 -mr-0',
            bottomLeft: 'w-1 h-1 bg-white border-2 border-black rounded-full absolute bottom-0 left-0 -mb-0 -ml-0',
            topLeft: 'w-1 h-1 bg-white border-2 border-black rounded-full absolute top-0 left-0 -mt-0 -ml-0'
          }}
        >
          <div 
            className="w-full h-full border-2 border-dashed border-black bg-black bg-opacity-10"
            style={{ pointerEvents: 'none' }}
          />
        </Resizable>
      </div>
    </div>
  );
};

export default DownloadArea;