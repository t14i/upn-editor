import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface NotePanelProps {
  noteContent: string;
  setNoteContent: (content: string) => void;
  onClose: () => void;
}

const NotePanel: React.FC<NotePanelProps> = ({ noteContent, setNoteContent, onClose }) => {
  return (
    <div className="h-full flex flex-col bg-white shadow-lg">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">ノート</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <textarea
        className="flex-grow p-4 w-full resize-none focus:outline-none"
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        placeholder="ここにノートを入力してください..."
      />
    </div>
  );
};

export default NotePanel;