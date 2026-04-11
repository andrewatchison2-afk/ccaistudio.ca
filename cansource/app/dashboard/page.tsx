import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SupplierCard } from '@/components/suppliers/SupplierCard'
import { FREE_TIER_VIEW_LIMIT, PROVINCE_LABELS, type CanadianProvince } from '@/types/database'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Brand Dashboard' }

export default async function BrandDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'supplier') redirect('/supplier/dashboard')
  if (profile.role === 'admin') redirect('/admin')

  const isPro =
    profile.subscription_tier === 'brand_pro' &&
    profile.subscription_status === 'active'

  // Monthly view count
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const { count: viewsUsed } = await supabase
    .from('brand_supplier_views')
    .select('id', { count: 'exact', head: true })
    .eq('brand_id', user.id)
    .gte('viewed_at', startOfMonth.toISOString())

  // Saved suppliers
  const { data: savedRaw } = await supabase
    .from('saved_suppliers')
    .select(`
      saved_at,
      suppliers(
        id, company_name, province, website, description, slug,
        min_order_quantity, lead_time_days, ships_internationally,
        usmca_compliant, accepts_shopify_orders, is_verified, is_featured,
        supplier_categories(product_categories(name))
      )
    `)
    .eq('brand_id', user.id)
    .order('saved_at', { ascending: false })
    .limit(12)

  const savedSuppliers = (savedRaw ?? [])
    .map((row: any) => ({
      ...row.suppliers,
      categories: row.suppliers?.supplier_categories
        ?.map((sc: any) => sc.product_categories?.name)
        .filter(Boolean) ?? [],
    }))
    .filter(Boolean)

  // Recent view history
  const { data: historyRaw } = await supabase
    .from('brand_supplier_views')
    .select(`
      viewed_at,
      suppliers(id, company_name, province, slug, is_verified, is_featured)
    `)
    .eq('brand_id', user.id)
    .order('viewed_at', { ascending: false })
    .limit(5)

  const viewHistory = (historyRaw ?? []).filter((r: any) => r.suppliers)

  const monthlyViews = viewsUsed ?? 0

  return (
    <div className="page-container py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="section-header">Brand Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {profile.full_name ?? profile.company_name ?? 'there'}</p>
        </div>
        <Link href="/suppliers" className="btn-primary text-sm">Browse Suppliers</Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Views this month</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {isPro ? '∞' : `${monthlyViews}/${FREE_TIER_VIEW_LIMIT}`}
          </p>
          {!isPro && (
            <div className="mt-2 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-red-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (monthlyViews / FREE_TIER_VIEW_LIMIT) * 100)}%` }}
              />
            </div>
          )}
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Saved suppliers</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{savedSuppliers.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plan</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{isPro ? 'Pro' : 'Free'}</p>
          {!isPro && (
            <Link href="/account/upgrade" className="text-xs text-red-600 hover:underline mt-1 inline-block">
              Upgrade → $79/mo
            </Link>
          )}
        </div>
      </div>

      {/* Upgrade CTA for free users who've used all views */}
      {!isPro && monthlyViews >= FREE_TIER_VIEW_LIMIT && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-5 mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-red-800">You&apos;ve used all your free views this month</p>
            <p className="text-sm text-red-600 mt-1">Upgrade to Pro for unlimited supplier access and contact info.</p>
          </div>
          <Link href="/account/upgrade" className="btn-primary text-sm flex-shrink-0">Upgrade to Pro</Link>
        </div>
      )}

      {/* Saved suppliers */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Saved Suppliers</h2>
          <Link href="/suppliers" className="text-sm text-red-600 hover:underline">Browse more</Link>
        </div>
        {savedSuppliers.length === 0 ? (
          <div className="card p-10 text-center text-gray-400">
            <p className="text-sm">No saved suppliers yet.</p>
            <Link href="/suppliers" className="text-sm text-red-600 hover:underline mt-2 inline-block">
              Browse the directory
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {savedSuppliers.map((s: any) => (
              <SupplierCard key={s.id} supplier={s} />
            ))}
          </div>
        )}
      </section>

      {/* View history */}
      {viewHistory.length > 0 && (
        <section>
          <h2 className="font-semibold text-gray-900 mb-4">Recently Viewed</h2>
          <div className="card divide-y divide-gray-50">
            {viewHistory.map((row: any) => {
              const s = row.suppliers
              const href = s.slug ? `/suppliers/${s.slug}` : `/suppliers/${s.id}`
              return (
                <div key={`${s.id}-${row.viewed_at}`} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <Link href={href} className="text-sm font-medium text-gray-900 hover:text-red-600">
                      {s.company_name}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {PROVINCE_LABELS[s.province as CanadianProvince] ?? s.province}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(row.viewed_at).toLocaleDateString('en-CA')}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
