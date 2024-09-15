import React, { useState, useCallback, useEffect } from 'react';
import { ReactFlowInstance } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import DownloadArea from './DownloadArea';
import DownloadModal from './DownloadModal';
import { handleDownload as handleDownloadUtil } from '../../../utils/downloadUtils';

interface UPNDownloadManagerProps {
  rfInstance: ReactFlowInstance | null;
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
  flowName: string;
}

const UPNDownloadManager: React.FC<UPNDownloadManagerProps> = ({
  rfInstance,
  reactFlowWrapper,
  flowName,
}) => {
  const [downloadFormat, setDownloadFormat] = useState<'PNG' | 'JPEG' | 'PDF'>('PNG');
  const [downloadResolution, setDownloadResolution] = useState<'低' | '中' | '高'>('中');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showDownloadArea, setShowDownloadArea] = useState(false);
  const [downloadArea, setDownloadArea] = useState({ width: 0, height: 0 });
  const [downloadAreaPosition, setDownloadAreaPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const initializeDownloadArea = useCallback(() => {
    if (reactFlowWrapper.current) {
      const { width: screenWidth, height: screenHeight } = reactFlowWrapper.current.getBoundingClientRect();
      
      const areaHeight = screenHeight * 0.85;
      const areaWidth = areaHeight * 16 / 9;

      setDownloadArea({
        width: areaWidth,
        height: areaHeight
      });

      setDownloadAreaPosition({
        x: (screenWidth - areaWidth) / 2,
        y: screenHeight * 0.1
      });
    }
  }, [reactFlowWrapper]);

  useEffect(() => {
    initializeDownloadArea();
    window.addEventListener('resize', initializeDownloadArea);
    return () => {
      window.removeEventListener('resize', initializeDownloadArea);
    };
  }, [initializeDownloadArea]);

  const handleDownloadClick = useCallback(() => {
    setShowDownloadArea(true);
    initializeDownloadArea();
  }, [initializeDownloadArea]);

  const handleDownloadAreaConfirm = useCallback(() => {
    setShowDownloadArea(false);
    setShowDownloadModal(true);
  }, []);

  const handleDownloadAreaCancel = useCallback(() => {
    setShowDownloadArea(false);
  }, []);

  const handleDownloadAreaMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - downloadAreaPosition.x,
        y: e.clientY - downloadAreaPosition.y
      });
    }
  };

  const handleDownloadAreaMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && reactFlowWrapper.current) {
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(e.clientX - dragStart.x, bounds.width - downloadArea.width));
      const newY = Math.max(0, Math.min(e.clientY - dragStart.y, bounds.height - downloadArea.height));
      setDownloadAreaPosition({ x: newX, y: newY });
    }
  }, [isDragging, dragStart, downloadArea, reactFlowWrapper]);

  const handleDownloadAreaMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDownloadAreaMouseMove);
      window.addEventListener('mouseup', handleDownloadAreaMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleDownloadAreaMouseMove);
      window.removeEventListener('mouseup', handleDownloadAreaMouseUp);
    };
  }, [isDragging, handleDownloadAreaMouseMove, handleDownloadAreaMouseUp]);

  const handleDownload = useCallback(async () => {
    if (reactFlowWrapper.current && rfInstance) {
      const flowElement = reactFlowWrapper.current.querySelector('.react-flow__viewport');
      if (!flowElement) return;

      const { x: viewportX, y: viewportY, zoom } = rfInstance.getViewport();
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();

      const selectedAreaInReactFlow = {
        x: (downloadAreaPosition.x - reactFlowBounds.left) / zoom - viewportX / zoom,
        y: (downloadAreaPosition.y - reactFlowBounds.top) / zoom - viewportY / zoom,
        width: downloadArea.width / zoom,
        height: downloadArea.height / zoom,
      };

      await handleDownloadUtil({
        flowElement: flowElement as HTMLElement,
        downloadFormat,
        downloadResolution,
        selectedArea: selectedAreaInReactFlow,
        flowName,
        zoom,
      });
    }
    setShowDownloadModal(false);
  }, [
    downloadFormat,
    downloadResolution,
    flowName,
    reactFlowWrapper,
    downloadArea,
    downloadAreaPosition,
    rfInstance,
  ]);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center border border-gray-300"
        onClick={handleDownloadClick}
      >
        <Download className="h-4 w-4 mr-1" />
        ダウンロード
      </Button>
      {showDownloadArea && (
        <DownloadArea
          downloadArea={downloadArea}
          downloadAreaPosition={downloadAreaPosition}
          setDownloadArea={setDownloadArea}
          setDownloadAreaPosition={setDownloadAreaPosition}
          setIsDragging={setIsDragging}
          handleDownloadAreaMouseDown={handleDownloadAreaMouseDown}
          handleDownloadAreaConfirm={handleDownloadAreaConfirm}
          handleDownloadAreaCancel={handleDownloadAreaCancel}
          reactFlowWrapper={reactFlowWrapper}
        />
      )}
      <DownloadModal
        showDownloadModal={showDownloadModal}
        setShowDownloadModal={setShowDownloadModal}
        downloadFormat={downloadFormat}
        setDownloadFormat={setDownloadFormat}
        downloadResolution={downloadResolution}
        setDownloadResolution={setDownloadResolution}
        handleDownload={handleDownload}
      />
    </>
  );
};

export default UPNDownloadManager;