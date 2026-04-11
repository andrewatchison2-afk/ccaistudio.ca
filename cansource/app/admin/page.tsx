import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AdminActions } from '@/components/dashboard/AdminActions'
import { PROVINCE_LABELS, type CanadianProvince } from '@/types/database'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Admin Panel' }

export default async function AdminPanel() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Stats
  const [
    { count: totalSuppliers },
    { count: activeSuppliers },
    { count: featuredSuppliers },
    { count: totalBrands },
    { count: proBrands },
  ] = await Promise.all([
    supabase.from('suppliers').select('id', { count: 'exact', head: true }),
    supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('is_featured', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'brand'),
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('role', 'brand').eq('subscription_tier', 'brand_pro').eq('subscription_status', 'active'),
  ])

  // Recent suppliers (pending verification)
  const { data: pendingSuppliers } = await supabase
    .from('suppliers')
    .select(`
      id, company_name, province, is_verified, is_featured, is_active, created_at,
      profiles(full_name, company_name)
    `)
    .eq('is_verified', false)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(10)

  // All suppliers
  const { data: allSuppliers } = await supabase
    .from('suppliers')
    .select(`
      id, company_name, province, is_verified, is_featured, is_active, created_at,
      profiles(full_name, company_name)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="page-container py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="section-header">Admin Panel</h1>
          <span className="badge bg-red-100 text-red-700">admin</span>
        </div>
        <p className="text-gray-500">Manage listings, verifications, and subscriptions</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-5 gap-4 mb-10">
        {[
          { label: 'Total suppliers', value: totalSuppliers ?? 0 },
          { label: 'Active suppliers', value: activeSuppliers ?? 0 },
          { label: 'Featured', value: featuredSuppliers ?? 0 },
          { label: 'Total brands', value: totalBrands ?? 0 },
          { label: 'Pro brands', value: proBrands ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Pending verification */}
      {(pendingSuppliers?.length ?? 0) > 0 && (
        <section className="mb-10">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Pending Verification
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingSuppliers?.length}
            </span>
          </h2>
          <div className="card divide-y divide-gray-50">
            {pendingSuppliers?.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-4 gap-4 flex-wrap">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{s.company_name}</div>
                  <div className="text-xs text-gray-500">
                    {PROVINCE_LABELS[s.province as CanadianProvince] ?? s.province} ·{' '}
                    {new Date(s.created_at).toLocaleDateString('en-CA')} ·{' '}
                    {s.profiles?.full_name ?? s.profiles?.company_name}
                  </div>
                </div>
                <AdminActions supplierId={s.id} isVerified={s.is_verified} isActive={s.is_active} isFeatured={s.is_featured} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All suppliers */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-4">All Suppliers</h2>
        <div className="card divide-y divide-gray-50">
          {(allSuppliers ?? []).map((s: any) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-4 gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/suppliers/${s.id}`}
                    className="font-medium text-gray-900 text-sm hover:text-red-600"
                  >
                    {s.company_name}
                  </Link>
                  {s.is_verified && <span className="badge badge-verified text-xs">✓</span>}
                  {s.is_featured && <span className="badge badge-featured text-xs">⭐</span>}
                  {!s.is_active && <span className="badge bg-gray-100 text-gray-500 text-xs">Inactive</span>}
                </div>
                <div className="text-xs text-gray-500">
                  {PROVINCE_LABELS[s.province as CanadianProvince] ?? s.province} ·{' '}
                  {new Date(s.created_at).toLocaleDateString('en-CA')}
                </div>
              </div>
              <AdminActions supplierId={s.id} isVerified={s.is_verified} isActive={s.is_active} isFeatured={s.is_featured} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
