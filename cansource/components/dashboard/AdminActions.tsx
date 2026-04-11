'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = {
  supplierId: string
  isVerified: boolean
  isActive: boolean
  isFeatured: boolean
}

export function AdminActions({ supplierId, isVerified, isActive, isFeatured }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const update = async (fields: Record<string, boolean>) => {
    setLoading(true)
    await supabase.from('suppliers').update(fields).eq('id', supplierId)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        disabled={loading}
        onClick={() => update({ is_verified: !isVerified })}
        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
          isVerified
            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
        } disabled:opacity-50`}
      >
        {isVerified ? '✓ Verified' : 'Verify'}
      </button>
      <button
        disabled={loading}
        onClick={() => update({ is_featured: !isFeatured })}
        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
          isFeatured
            ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
        } disabled:opacity-50`}
      >
        {isFeatured ? '⭐ Featured' : 'Feature'}
      </button>
      <button
        disabled={loading}
        onClick={() => update({ is_active: !isActive })}
        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
          isActive
            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
        } disabled:opacity-50`}
      >
        {isActive ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  )
}
