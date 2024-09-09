'use client';

import { useParams } from 'next/navigation';
import UPNEditor from '@/components/UPNEditor';

export default function EditFlow() {
  const params = useParams();
  const flowId = params.id as string;

  return <UPNEditor flowId={flowId === 'new' ? null : flowId} />;
}