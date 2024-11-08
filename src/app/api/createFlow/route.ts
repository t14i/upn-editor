import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 0;

export async function POST(request: NextRequest) {
  const { name, flow_data, parent_flow_id, note } = await request.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('flows')
    .insert([
      { name, flow_data, parent_flow_id, note }
    ])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const response = NextResponse.json({ data });
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}