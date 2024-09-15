import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface UPNDialogManagerProps {
  showSaveDialog: boolean;
  setShowSaveDialog: (show: boolean) => void;
  handleSaveAndClose: () => void;
  handleCloseWithoutSaving: () => void;
  showLinkDialog: boolean;
  setShowLinkDialog: (show: boolean) => void;
  newLink: { name: string; url: string };
  setNewLink: (link: { name: string; url: string }) => void;
  handleAddLink: () => void;
  showEditNumberDialog: boolean;
  setShowEditNumberDialog: (show: boolean) => void;
  newNodeNumber: number | null;
  setNewNodeNumber: (number: number | null) => void;
  handleEditNodeNumber: () => void;
}

const UPNDialogManager: React.FC<UPNDialogManagerProps> = ({
  showSaveDialog,
  setShowSaveDialog,
  handleSaveAndClose,
  handleCloseWithoutSaving,
  showLinkDialog,
  setShowLinkDialog,
  newLink,
  setNewLink,
  handleAddLink,
  showEditNumberDialog,
  setShowEditNumberDialog,
  newNodeNumber,
  setNewNodeNumber,
  handleEditNodeNumber,
}) => {
  return (
    <>
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>保存されていない変更があります</AlertDialogTitle>
            <AlertDialogDescription>
              変更を保存しますか？保存せずに閉じると、変更内容が失われます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseWithoutSaving}>
              保存せずに閉じる
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndClose}>
              保存して閉じる
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>関連リンクを追加</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="link-name" className="text-right">
                リンク名
              </Label>
              <Input
                id="link-name"
                value={newLink.name}
                onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="link-url" className="text-right">
                URL
              </Label>
              <Input
                id="link-url"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddLink}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditNumberDialog} onOpenChange={setShowEditNumberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ノード番号を編集</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="node-number" className="text-right">
                新しい番号
              </Label>
              <Input
                id="node-number"
                type="number"
                value={newNodeNumber !== null ? newNodeNumber : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setNewNodeNumber(value === '' ? null : parseInt(value, 10));
                  }
                }}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditNodeNumber}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UPNDialogManager;