import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PROVINCE_LABELS, type CanadianProvince, FREE_TIER_VIEW_LIMIT } from '@/types/database'
import Link from 'next/link'
import { ContactReveal } from '@/components/suppliers/ContactReveal'
import { SaveButton } from '@/components/suppliers/SaveButton'

export const dynamic = 'force-dynamic'

async function getSupplier(slug: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('suppliers')
    .select(`
      id, company_name, province, website, description, logo_url, slug,
      min_order_quantity, lead_time_days, ships_internationally, usmca_compliant,
      accepts_shopify_orders, is_verified, is_featured, is_active,
      contact_email, contact_phone, last_updated, created_at,
      supplier_categories(product_categories(name, slug))
    `)
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .eq('is_active', true)
    .single()
  return data
}

async function getViewCount(supplierId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { canView: false, viewsUsed: 0, isPro: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status, role')
    .eq('id', user.id)
    .single()

  if (!profile) return { canView: false, viewsUsed: 0, isPro: false }

  const isPro =
    profile.subscription_tier === 'brand_pro' &&
    profile.subscription_status === 'active'

  if (isPro || profile.role === 'admin') {
    return { canView: true, viewsUsed: 0, isPro: true }
  }

  // Count this month's unique supplier views
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('brand_supplier_views')
    .select('id', { count: 'exact', head: true })
    .eq('brand_id', user.id)
    .gte('viewed_at', startOfMonth.toISOString())

  const viewsUsed = count ?? 0
  const canView = viewsUsed < FREE_TIER_VIEW_LIMIT

  // Record this view if allowed (upsert to handle duplicates)
  if (canView) {
    await supabase.from('brand_supplier_views').upsert(
      { brand_id: user.id, supplier_id: supplierId },
      { onConflict: 'brand_id,supplier_id,date_trunc(\'month\', viewed_at)' }
    )
    // Also record analytics view
    await supabase.from('supplier_views').upsert(
      { supplier_id: supplierId, viewer_id: user.id },
      { onConflict: 'supplier_id,viewer_id,(viewed_at::date)' }
    )
  }

  return { canView, viewsUsed, isPro: false }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supplier = await getSupplier(params.slug)
  if (!supplier) return { title: 'Supplier Not Found' }
  return {
    title: `${supplier.company_name} — Canadian Supplier`,
    description: supplier.description ?? `View ${supplier.company_name} on CanSource`,
  }
}

export default async function SupplierPage({ params }: { params: { slug: string } }) {
  const supplier = await getSupplier(params.slug)
  if (!supplier) notFound()

  const { canView, viewsUsed, isPro } = await getViewCount(supplier.id)

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const categories: string[] = (supplier.supplier_categories ?? [])
    .map((sc: any) => sc.product_categories?.name)
    .filter(Boolean)

  return (
    <div className="page-container py-10">
      <div className="mb-6">
        <Link href="/suppliers" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          ← Back to directory
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {supplier.is_featured && <span className="badge badge-featured">⭐ Featured</span>}
                  {supplier.is_verified && <span className="badge badge-verified">✓ Verified</span>}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mt-1">{supplier.company_name}</h1>
                <p className="text-gray-500 mt-1">
                  {PROVINCE_LABELS[supplier.province as CanadianProvince] ?? supplier.province}
                </p>
              </div>
              {user && <SaveButton supplierId={supplier.id} userId={user.id} />}
            </div>

            {supplier.description && (
              <p className="mt-4 text-gray-600 leading-relaxed">{supplier.description}</p>
            )}

            {supplier.website && (
              <a
                href={supplier.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-sm text-red-600 hover:underline font-medium"
              >
                Visit website →
              </a>
            )}
          </div>

          {/* Details */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Supplier Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Province', value: PROVINCE_LABELS[supplier.province as CanadianProvince] },
                { label: 'Min. Order Quantity', value: supplier.min_order_quantity != null ? supplier.min_order_quantity.toLocaleString() + ' units' : null },
                { label: 'Lead Time', value: supplier.lead_time_days != null ? `${supplier.lead_time_days} days` : null },
                { label: 'USMCA Compliant', value: supplier.usmca_compliant ? 'Yes' : 'No' },
                { label: 'Ships Internationally', value: supplier.ships_internationally ? 'Yes' : 'No' },
                { label: 'Accepts Shopify Orders', value: supplier.accepts_shopify_orders ? 'Yes' : 'No' },
              ].map(({ label, value }) => value !== null ? (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
                  <dd className="text-sm font-medium text-gray-900">{value}</dd>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Product Categories</h2>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <Link
                    key={cat}
                    href={`/suppliers?category=${encodeURIComponent(cat)}`}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — contact info */}
        <div className="space-y-4">
          <ContactReveal
            supplierId={supplier.id}
            contactEmail={supplier.contact_email}
            contactPhone={supplier.contact_phone}
            canView={canView}
            isPro={isPro}
            isLoggedIn={!!user}
            viewsUsed={viewsUsed}
            viewLimit={FREE_TIER_VIEW_LIMIT}
          />

          <div className="card p-4 text-xs text-gray-400">
            <p>Last updated: {new Date(supplier.last_updated).toLocaleDateString('en-CA')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
