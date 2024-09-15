import { useCallback } from 'react';
import { useReactFlow, Viewport } from 'reactflow';

export const useViewportManagement = () => {
  const { setViewport, screenToFlowPosition, getViewport } = useReactFlow();

  const updateViewport = useCallback((viewport: Viewport) => {
    setViewport(viewport);
  }, [setViewport]);

  const getFlowPosition = useCallback((screenX: number, screenY: number) => {
    return screenToFlowPosition({ x: screenX, y: screenY });
  }, [screenToFlowPosition]);

  const getCurrentViewport = useCallback(() => {
    return getViewport();
  }, [getViewport]);

  return {
    updateViewport,
    getFlowPosition,
    getCurrentViewport,
  };
};