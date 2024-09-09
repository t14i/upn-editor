import React, { useEffect, useState } from 'react';
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
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

  useEffect(() => {
    const fetchFlows = async () => {
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
    };

    fetchFlows();
  }, []);

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
                  <TableHead>Name</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flows.map((flow) => (
                  <TableRow key={flow.id}>
                    <TableCell>{flow.name}</TableCell>
                    <TableCell>{formatDate(flow.created_at)}</TableCell>
                    <TableCell>{formatDate(flow.updated_at)}</TableCell>
                    <TableCell>
                      <Link href={`/edit/${flow.id}`}>
                        <Button variant="outline" size="sm">
                          編集
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FlowList;