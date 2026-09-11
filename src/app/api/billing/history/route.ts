import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

type TransactionRow = {
  id: string
  amount: number | null
  currency: string | null
  transaction_type: string | null
  status: string | null
  created_at: string | null
  completed_at: string | null
  invoice_url: string | null
  receipt_url: string | null
}

export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await (supabaseAdmin as any)
      .from('payment_transactions')
      .select(
        'id, amount, currency, transaction_type, status, created_at, completed_at, invoice_url, receipt_url',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const transactions = ((data as TransactionRow[]) || []).map(t => ({
      id: t.id,
      amount: t.amount,
      currency: (t.currency || 'USD').toUpperCase(),
      type: t.transaction_type,
      status: t.status,
      date: t.completed_at || t.created_at,
      invoiceUrl: t.invoice_url,
      receiptUrl: t.receipt_url,
    }))

    return NextResponse.json({ transactions })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load billing history'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
