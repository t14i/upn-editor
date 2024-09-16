import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StickyNote } from 'lucide-react';
import NotePanel from './NotePanel';

interface UPNNoteManagerProps {
  noteContent: string;
  setNoteContent: (content: string) => void;
  isSlideIn: boolean;
}

const UPNNoteManager: React.FC<UPNNoteManagerProps> = ({
  noteContent,
  setNoteContent,
  isSlideIn,
}) => {
  const [showNotePanel, setShowNotePanel] = useState(false);

  const handleNoteButtonClick = () => {
    setShowNotePanel(prevState => !prevState);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center border border-gray-300"
        onClick={handleNoteButtonClick}
      >
        <StickyNote className="h-4 w-4 mr-1" />
        ノート
      </Button>
      {showNotePanel && (
        <div className="fixed inset-y-0 right-0 w-80 z-50 transition-transform duration-300 ease-in-out transform translate-x-0">
          <NotePanel
            noteContent={noteContent}
            setNoteContent={setNoteContent}
            onClose={() => setShowNotePanel(false)}
          />
        </div>
      )}
    </>
  );
};

export default UPNNoteManager;