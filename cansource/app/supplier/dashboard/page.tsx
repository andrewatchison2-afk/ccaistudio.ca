import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SupplierForm } from '@/components/suppliers/SupplierForm'

export const dynamic = 'force-dynamic'
// Province labels used in child components

export const metadata = { title: 'Supplier Dashboard' }

export default async function SupplierDashboard({
  searchParams,
}: {
  searchParams: { onboarding?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'supplier') redirect('/dashboard')

  const isFeatured =
    profile.subscription_tier === 'supplier_featured' &&
    profile.subscription_status === 'active'

  // Get supplier listing
  const { data: supplier } = await supabase
    .from('suppliers')
    .select(`
      *, supplier_categories(category_id, product_categories(id, name))
    `)
    .eq('profile_id', user.id)
    .single()

  // Analytics
  const { data: analytics } = await supabase
    .from('supplier_analytics')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle()

  // Categories for form
  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, name, slug')
    .order('name')

  const isOnboarding = searchParams.onboarding === 'true' && !supplier

  return (
    <div className="page-container py-10">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="section-header">Supplier Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {profile.company_name ?? profile.full_name ?? 'Your business'}
          </p>
        </div>
        {supplier && (
          <Link
            href={supplier.slug ? `/suppliers/${supplier.slug}` : `/suppliers/${supplier.id}`}
            className="btn-secondary text-sm"
            target="_blank"
          >
            View public listing →
          </Link>
        )}
      </div>

      {/* Analytics (featured only) */}
      {supplier && (
        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          <div className="card p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total views</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {isFeatured ? (analytics?.total_views ?? 0) : '—'}
            </p>
            {!isFeatured && <p className="text-xs text-gray-400 mt-1">Featured plan required</p>}
          </div>
          <div className="card p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last 30 days</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {isFeatured ? (analytics?.views_last_30_days ?? 0) : '—'}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last 7 days</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {isFeatured ? (analytics?.views_last_7_days ?? 0) : '—'}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Saves</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {isFeatured ? (analytics?.total_saves ?? 0) : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {supplier?.is_verified && <span className="badge badge-verified text-sm px-3 py-1">✓ Verified</span>}
        {isFeatured
          ? <span className="badge badge-featured text-sm px-3 py-1">⭐ Featured</span>
          : (
            <Link href="/account/upgrade?plan=supplier_featured" className="badge border border-amber-200 bg-amber-50 text-amber-700 text-sm px-3 py-1 hover:bg-amber-100">
              Get Featured — $49/mo ↗
            </Link>
          )
        }
        {!isFeatured && <p className="text-xs text-gray-400">Upgrade to see analytics and get top placement</p>}
      </div>

      {/* Listing form */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-6">
          {supplier ? 'Edit Your Listing' : 'Create Your Listing'}
        </h2>
        {isOnboarding && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-red-800">Welcome to CanSource!</p>
            <p className="text-sm text-red-600 mt-1">
              Complete your listing below so Canadian brands can find you.
            </p>
          </div>
        )}
        <SupplierForm
          categories={categories ?? []}
          supplier={supplier}
          userId={user.id}
        />
      </div>
    </div>
  )
}
