'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  supplierId: string
  userId: string
}

export function SaveButton({ supplierId, userId }: Props) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('saved_suppliers')
      .select('brand_id')
      .eq('brand_id', userId)
      .eq('supplier_id', supplierId)
      .maybeSingle()
      .then(({ data }) => {
        setSaved(!!data)
        setLoading(false)
      })
  }, [supplierId, userId])

  const toggle = async () => {
    setLoading(true)
    if (saved) {
      await supabase
        .from('saved_suppliers')
        .delete()
        .eq('brand_id', userId)
        .eq('supplier_id', supplierId)
      setSaved(false)
    } else {
      await supabase
        .from('saved_suppliers')
        .insert({ brand_id: userId, supplier_id: supplierId })
      setSaved(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? 'Remove from saved' : 'Save supplier'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
        saved
          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
      } disabled:opacity-50`}
    >
      {saved ? '❤️ Saved' : '♡ Save'}
    </button>
  )
}
