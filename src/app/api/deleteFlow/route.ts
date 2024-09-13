import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function deleteFlowRecursively(flowId: string) {
  // フローデータを取得
  const { data: flow, error: fetchError } = await supabase
    .from('flows')
    .select('*')
    .eq('id', flowId)
    .single()

  if (fetchError) {
    throw new Error(`Error fetching flow: ${fetchError.message}`)
  }

  // ドリルダウンフローを再帰的に削除
  if (flow.flow_data && flow.flow_data.nodes) {
    for (const node of flow.flow_data.nodes) {
      if (node.data && node.data.drilldownFlowId) {
        await deleteFlowRecursively(node.data.drilldownFlowId)
      }
    }
  }

  // 現在のフローを削除
  const { error: deleteError } = await supabase
    .from('flows')
    .delete()
    .eq('id', flowId)

  if (deleteError) {
    throw new Error(`Error deleting flow: ${deleteError.message}`)
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Flow ID is required' }, { status: 400 })
  }

  try {
    await deleteFlowRecursively(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting flow:', error)
    return NextResponse.json({ error: 'Failed to delete flow' }, { status: 500 })
  }
}