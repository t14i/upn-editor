import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Trash2, Copy, MoreHorizontal } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import sampleObject from '../sample-object.json';

interface Flow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string | null;
}

const FlowList: React.FC = () => {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useSample, setUseSample] = useState(false);
  const router = useRouter();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState<string | null>(null);

  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [flowToDuplicate, setFlowToDuplicate] = useState<Flow | null>(null);
  const [newFlowName, setNewFlowName] = useState('');

  const fetchFlows = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/getFlows', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      if (data.data) {
        console.log('Fetched flows:', data.data);
        setFlows(data.data);
      }
    } catch (error) {
      console.error('Error fetching flows:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Invalid Date';
    }
    
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleCreateNew = async () => {
    const flowData = useSample ? sampleObject : { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
    const flowName = useSample ? 'New Sample Flow' : 'New Flow';

    try {
      const response = await fetch('/api/createFlow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: flowName,
          flow_data: flowData
        }),
      });
      const data = await response.json();
      if (data.data && data.data[0]) {
        router.push(`/edit/${data.data[0].id}`);
      } else {
        console.error('Failed to create new flow');
      }
    } catch (error) {
      console.error('Error creating new flow:', error);
    }
  };

  const handleDeleteFlow = async (id: string) => {
    try {
      const response = await fetch(`/api/deleteFlow?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setFlows(flows.filter(flow => flow.id !== id));
      } else {
        console.error('Failed to delete flow');
      }
    } catch (error) {
      console.error('Error deleting flow:', error);
    }
    setDeleteDialogOpen(false);
    setFlowToDelete(null);
  };

  const handleDuplicateFlow = async () => {
    if (!flowToDuplicate) return;

    try {
      const response = await fetch('/api/duplicateFlow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ flowId: flowToDuplicate.id, newName: newFlowName }),
      });
      if (response.ok) {
        const result = await response.json();
        console.log('Flow duplicated:', result.newFlowId);
        // フローリストを再取得
        fetchFlows();
      } else {
        console.error('Failed to duplicate flow');
      }
    } catch (error) {
      console.error('Error duplicating flow:', error);
    }
    setDuplicateDialogOpen(false);
    setFlowToDuplicate(null);
    setNewFlowName('');
  };

  const openDuplicateDialog = (flow: Flow) => {
    setFlowToDuplicate(flow);
    setNewFlowName(`${flow.name} のコピー`);
    setDuplicateDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex justify-between items-center">
            UPN Flows
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> 新規フロー作成
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新規フロー作成</DialogTitle>
                  <DialogDescription>
                    新しいフローを作成します。サンプルオブジェクトを使用するかどうかを選択してください。
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-sample"
                    checked={useSample}
                    onCheckedChange={setUseSample}
                  />
                  <Label htmlFor="use-sample">サンプルオブジェクトを使用</Label>
                </div>
                <Button onClick={handleCreateNew}>作成</Button>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>データを読み込み中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Name</TableHead>
                  <TableHead className="text-center">Created At</TableHead>
                  <TableHead className="text-center">Updated At</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flows.map((flow) => (
                  <TableRow key={flow.id}>
                    <TableCell className="w-[40%]">{flow.name}</TableCell>
                    <TableCell className="text-center">{formatDate(flow.created_at)}</TableCell>
                    <TableCell className="text-center">{formatDate(flow.updated_at)}</TableCell>
                    <TableCell>
                      <div className="flex justify-center space-x-2">
                        <Link href={`/edit/${flow.id}`}>
                          <Button variant="outline" size="sm">
                            編集
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => openDuplicateDialog(flow)}>
                              <Copy className="w-4 h-4 mr-2" />
                              複製
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setFlowToDelete(flow.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              削除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 複製ダイアログ */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>フローの複製</DialogTitle>
            <DialogDescription>
              新しいフロー名を入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-flow-name" className="text-right">
                フロー名
              </Label>
              <Input
                id="new-flow-name"
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleDuplicateFlow}>
              複製
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>フローの削除</DialogTitle>
            <DialogDescription>
              このフローを削除してもよろしいですか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={() => flowToDelete && handleDeleteFlow(flowToDelete)}>
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlowList;