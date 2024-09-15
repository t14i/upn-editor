import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import UPNDownloadManager from './UPNDownloadManager';
import UPNNoteManager from './UPNNoteManager';

interface UPNToolbarProps {
  isSlideIn: boolean;
  flowName: string;
  setFlowName: (name: string) => void;
  handleClose: (action: 'backToList' | 'closeSlideIn') => void;
  handleSaveFlow: () => void;
  rfInstance: any;
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
  noteContent: string;
  setNoteContent: (content: string) => void;
}

const UPNToolbar: React.FC<UPNToolbarProps> = ({
  isSlideIn,
  flowName,
  setFlowName,
  handleClose,
  handleSaveFlow,
  rfInstance,
  reactFlowWrapper,
  noteContent,
  setNoteContent,
}) => {
  return (
    <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
      {!isSlideIn ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleClose('backToList')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => handleClose('closeSlideIn')} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          <span>閉じる</span>
        </Button>
      )}
      <input
        type="text"
        value={flowName}
        onChange={(e) => setFlowName(e.target.value)}
        placeholder="Flow Name"
        className="p-2 border rounded"
      />
      <Button onClick={handleSaveFlow}>保存</Button>
      <UPNDownloadManager
        rfInstance={rfInstance}
        reactFlowWrapper={reactFlowWrapper}
        flowName={flowName}
      />
      <UPNNoteManager
        noteContent={noteContent}
        setNoteContent={setNoteContent}
        isSlideIn={isSlideIn}
      />
    </div>
  );
};

export default UPNToolbar;