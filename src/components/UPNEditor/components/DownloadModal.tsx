import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DownloadModalProps {
  showDownloadModal: boolean;
  setShowDownloadModal: React.Dispatch<React.SetStateAction<boolean>>;
  downloadFormat: 'PNG' | 'JPEG' | 'PDF';
  setDownloadFormat: React.Dispatch<React.SetStateAction<'PNG' | 'JPEG' | 'PDF'>>;
  downloadResolution: '低' | '中' | '高';
  setDownloadResolution: React.Dispatch<React.SetStateAction<'低' | '中' | '高'>>;
  handleDownload: () => void;
}

const DownloadModal: React.FC<DownloadModalProps> = ({
  showDownloadModal,
  setShowDownloadModal,
  downloadFormat,
  setDownloadFormat,
  downloadResolution,
  setDownloadResolution,
  handleDownload,
}) => {
  return (
    <Dialog open={showDownloadModal} onOpenChange={setShowDownloadModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>フローをエクスポート</DialogTitle>
          <DialogDescription>
            ファイル形式と画質を選択してください。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>ファイル形式</Label>
            <RadioGroup
              value={downloadFormat}
              onValueChange={(value) => setDownloadFormat(value as 'PNG' | 'JPEG' | 'PDF')}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PNG" id="format-png" />
                <Label htmlFor="format-png">PNG</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="JPEG" id="format-jpeg" />
                <Label htmlFor="format-jpeg">JPEG</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PDF" id="format-pdf" />
                <Label htmlFor="format-pdf">PDF</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>画質</Label>
            <RadioGroup
              value={downloadResolution}
              onValueChange={(value) => setDownloadResolution(value as '低' | '中' | '高')}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="低" id="resolution-low" />
                <Label htmlFor="resolution-low">低 (1x)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="中" id="resolution-medium" />
                <Label htmlFor="resolution-medium">中 (2x)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="高" id="resolution-high" />
                <Label htmlFor="resolution-high">高 (3x)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDownloadModal(false)}>
            キャンセル
          </Button>
          <Button onClick={handleDownload}>
            ダウンロード
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadModal;