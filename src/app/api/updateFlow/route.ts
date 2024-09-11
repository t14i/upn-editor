import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 0;

export async function POST(request: NextRequest) {
  const { id, name, flow_data } = await request.json()

  if (!id) {
    return NextResponse.json({ error: "ID is required for update" }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('flows')
    .update({ name, flow_data })
    .eq('id', id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const response = NextResponse.json({ data });
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}