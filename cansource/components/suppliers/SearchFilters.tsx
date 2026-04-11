'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { ProductCategory } from '@/types/database'
import { PROVINCE_LABELS } from '@/types/database'

type Props = {
  categories: ProductCategory[]
  initialValues: {
    search?: string
    province?: string
    category?: string
    usmca?: string
    ships_internationally?: string
    accepts_shopify?: string
  }
}

export function SearchFilters({ categories, initialValues }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.push(`/suppliers?${params.toString()}`)
    },
    [router, searchParams]
  )

  const clearAll = () => router.push('/suppliers')

  const hasFilters = Object.values(initialValues).some(Boolean)

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="label">Search</label>
        <input
          type="text"
          className="input"
          placeholder="Company, product, keyword…"
          defaultValue={initialValues.search ?? ''}
          onChange={e => updateFilter('search', e.target.value)}
        />
      </div>

      {/* Province */}
      <div>
        <label className="label">Province</label>
        <select
          className="input"
          value={initialValues.province ?? ''}
          onChange={e => updateFilter('province', e.target.value)}
        >
          <option value="">All provinces</option>
          {Object.entries(PROVINCE_LABELS).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="label">Category</label>
        <select
          className="input"
          value={initialValues.category ?? ''}
          onChange={e => updateFilter('category', e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <label className="label">Features</label>
        {[
          { key: 'usmca', label: 'USMCA Compliant' },
          { key: 'ships_internationally', label: 'Ships Internationally' },
          { key: 'accepts_shopify', label: 'Accepts Shopify Orders' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              checked={initialValues[key as keyof typeof initialValues] === 'true'}
              onChange={e => updateFilter(key, e.target.checked ? 'true' : null)}
            />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
      </div>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-sm text-red-600 hover:underline font-medium"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
