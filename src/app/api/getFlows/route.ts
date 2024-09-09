import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('flows')
    .select('id, name, created_at, updated_at')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('API response:', JSON.stringify(data, null, 2));

  const response = NextResponse.json({ data });
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}