import Link from 'next/link'
import { PROVINCE_LABELS, type CanadianProvince } from '@/types/database'

type SupplierCardData = {
  id: string
  company_name: string
  province: CanadianProvince
  website: string | null
  description: string | null
  slug: string | null
  min_order_quantity: number | null
  lead_time_days: number | null
  ships_internationally: boolean
  usmca_compliant: boolean
  accepts_shopify_orders: boolean
  is_verified: boolean
  is_featured: boolean
  categories: string[]
}

export function SupplierCard({ supplier }: { supplier: SupplierCardData }) {
  const href = supplier.slug ? `/suppliers/${supplier.slug}` : `/suppliers/${supplier.id}`

  return (
    <Link href={href} className="card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors truncate">
            {supplier.company_name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {PROVINCE_LABELS[supplier.province] ?? supplier.province}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {supplier.is_featured && (
            <span className="badge badge-featured">⭐ Featured</span>
          )}
          {supplier.is_verified && (
            <span className="badge badge-verified">✓ Verified</span>
          )}
        </div>
      </div>

      {/* Description */}
      {supplier.description && (
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
          {supplier.description}
        </p>
      )}

      {/* Categories */}
      {supplier.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {supplier.categories.slice(0, 3).map(cat => (
            <span key={cat} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {cat}
            </span>
          ))}
          {supplier.categories.length > 3 && (
            <span className="text-xs text-gray-400">+{supplier.categories.length - 3} more</span>
          )}
        </div>
      )}

      {/* Details */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 border-t border-gray-50 pt-3">
        {supplier.min_order_quantity != null && (
          <span>MOQ: {supplier.min_order_quantity.toLocaleString()}</span>
        )}
        {supplier.lead_time_days != null && (
          <span>Lead: {supplier.lead_time_days}d</span>
        )}
        {supplier.usmca_compliant && <span className="text-green-600 font-medium">USMCA</span>}
        {supplier.ships_internationally && <span>Ships intl.</span>}
        {supplier.accepts_shopify_orders && <span className="text-green-600 font-medium">Shopify ✓</span>}
      </div>
    </Link>
  )
}
