import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function duplicateFlow(flowId: string, newName: string, parentFlowId: string | null = null): Promise<string> {
  // 元のフローを取得
  const { data: originalFlow, error: fetchError } = await supabase
    .from('flows')
    .select('*')
    .eq('id', flowId)
    .single()

  if (fetchError) {
    throw new Error(`Error fetching original flow: ${fetchError.message}`)
  }

  // 新しいフローを作成
  const { data: newFlow, error: insertError } = await supabase
    .from('flows')
    .insert({
      name: newName,
      flow_data: originalFlow.flow_data,
      parent_flow_id: parentFlowId
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(`Error creating new flow: ${insertError.message}`)
  }

  // ドリルダウンフローを再帰的に複製
  if (originalFlow.flow_data && originalFlow.flow_data.nodes) {
    for (const node of originalFlow.flow_data.nodes) {
      if (node.data && node.data.drilldownFlowId) {
        // ドリルダウンフローの元の名前を取得
        const { data: drilldownFlow, error: drilldownError } = await supabase
          .from('flows')
          .select('name')
          .eq('id', node.data.drilldownFlowId)
          .single()

        if (drilldownError) {
          throw new Error(`Error fetching drilldown flow: ${drilldownError.message}`)
        }

        const newDrilldownFlowId = await duplicateFlow(node.data.drilldownFlowId, drilldownFlow.name, newFlow.id)
        node.data.drilldownFlowId = newDrilldownFlowId
      }
    }
  }

  // 更新されたフローデータを保存
  const { error: updateError } = await supabase
    .from('flows')
    .update({ flow_data: originalFlow.flow_data })
    .eq('id', newFlow.id)

  if (updateError) {
    throw new Error(`Error updating new flow: ${updateError.message}`)
  }

  return newFlow.id
}

export async function POST(request: NextRequest) {
  const { flowId, newName } = await request.json()

  if (!flowId || !newName) {
    return NextResponse.json({ error: 'Flow ID and new name are required' }, { status: 400 })
  }

  try {
    const newFlowId = await duplicateFlow(flowId, newName)
    return NextResponse.json({ success: true, newFlowId })
  } catch (error) {
    console.error('Error duplicating flow:', error)
    return NextResponse.json({ error: 'Failed to duplicate flow' }, { status: 500 })
  }
}